import * as core from "@actions/core"
import * as crypto from "crypto"

import { AzureAppService } from "azure-actions-appservice-rest/Arm/azure-app-service"
import { AzureAppServiceUtility } from "azure-actions-appservice-rest/Utilities/AzureAppServiceUtility"
import { AzureResourceFilterUtility } from "azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility"
import { IAuthorizer } from "azure-actions-webclient/Authorizer/IAuthorizer"
import { AuthorizerFactory } from "azure-actions-webclient/AuthorizerFactory"
import maskValues from "./utils/mask-values"
import parseSettings from "./utils/parse-settings"
import { ZodError } from "zod/v4"

export async function main() {
    const azureHttpUserAgent = process.env.AZURE_HTTP_USER_AGENT || ""

    try {
        const usrAgentRepo = crypto.createHash("sha256").update(`${process.env.GITHUB_REPOSITORY}`).digest("hex")
        const actionName = "AzureAppServiceSettings"
        const userAgentString = (azureHttpUserAgent ? `${azureHttpUserAgent}+` : "") + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`
        core.exportVariable("AZURE_HTTP_USER_AGENT", userAgentString)

        const webAppName: string = core.getInput("app-name", { required: true })
        const slotName: string = core.getInput("slot-name", { required: false })
        const shouldMaskSettingValues = core.getInput("mask-inputs", { required: false }).toLowerCase() !== "false"

        const { appSettings, connStringSettings, generalSetting } = parseSettings(
            core.getInput("app-settings-json", { required: false }),
            core.getInput("connection-strings-json", { required: false }),
            core.getInput("general-settings-json", { required: false }),
        )

        const endpoint: IAuthorizer = await AuthorizerFactory.getAuthorizer()
        core.info("Got service connection details for Azure App Service: " + webAppName)

        const appDetails = await AzureResourceFilterUtility.getAppDetails(endpoint, webAppName)
        const resourceGroupName = appDetails["resourceGroupName"]
        core.info("Resource Group : " + resourceGroupName)

        const appService: AzureAppService = new AzureAppService(endpoint, resourceGroupName, webAppName, slotName)
        const appServiceUtility: AzureAppServiceUtility = new AzureAppServiceUtility(appService)

        const promises: Promise<unknown>[] = []

        if (appSettings) {
            maskValues(appSettings, shouldMaskSettingValues)
            promises.push(appServiceUtility.updateAndMonitorAppSettings(appSettings, null))
        }

        if (connStringSettings) {
            maskValues(connStringSettings, shouldMaskSettingValues)
            promises.push(appServiceUtility.updateConnectionStrings(connStringSettings))
        }

        if (generalSetting) {
            promises.push(appServiceUtility.updateConfigurationSettings(generalSetting))
        }

        await Promise.all(promises)

        const applicationURL = await appServiceUtility.getApplicationURL()
        core.setOutput("webapp-url", applicationURL)
    }
    catch (error) {
        if (error instanceof ZodError || error instanceof SyntaxError) {
            return core.setFailed("Invalid JSON format. Please check the JSON format of the input.")
        }

        if (error instanceof Error) {
            return core.setFailed(error.message)
        }

        return core.setFailed("An unexpected error occurred.")
    }
    finally {
        // Reset AZURE_HTTP_USER_AGENT
        core.exportVariable("AZURE_HTTP_USER_AGENT", azureHttpUserAgent)
    }
}

main()
