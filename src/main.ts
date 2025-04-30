import * as core from "@actions/core"
import * as crypto from "crypto"

import { Utils } from "./Utils"
import { AzureAppService } from "azure-actions-appservice-rest/Arm/azure-app-service"
import { AzureAppServiceUtility } from "azure-actions-appservice-rest/Utilities/AzureAppServiceUtility"
import { AzureResourceFilterUtility } from "azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility"
import { IAuthorizer } from "azure-actions-webclient/Authorizer/IAuthorizer"
import { AuthorizerFactory } from "azure-actions-webclient/AuthorizerFactory"

const userAgentPrefix = process.env.AZURE_HTTP_USER_AGENT || ""

export async function main() {
    try {
        // Set user agent variable
        const usrAgentRepo = crypto.createHash("sha256").update(`${process.env.GITHUB_REPOSITORY}`).digest("hex")
        const actionName = "AzureAppServiceSettings"
        const userAgentString = (userAgentPrefix ? `${userAgentPrefix}+` : "") + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`
        core.exportVariable("AZURE_HTTP_USER_AGENT", userAgentString)

        const webAppName: string = core.getInput("app-name", { required: true })
        const slotName: string = core.getInput("slot-name", { required: false })
        const AppSettings: string = core.getInput("app-settings-json", { required: false })
        const ConnectionStrings: string = core.getInput("connection-strings-json", { required: false })
        const ConfigurationSettings: string = core.getInput("general-settings-json", { required: false })
        const maskInputs: string = core.getInput("mask-inputs", { required: false }).toLowerCase()

        if (!AppSettings && !ConnectionStrings && !ConfigurationSettings) {
            throw Error("App Service Settings is not enabled. Please provide one of the following : App Settings or General Settings or Connection Strings.")
        }

        // Validating parsed inputs
        const endpoint: IAuthorizer = await AuthorizerFactory.getAuthorizer()
        console.log("Got service connection details for Azure App Service: " + webAppName)

        const appDetails = await AzureResourceFilterUtility.getAppDetails(endpoint, webAppName)
        const resourceGroupName = appDetails["resourceGroupName"]
        console.log("Resource Group : " + resourceGroupName)

        const appService: AzureAppService = new AzureAppService(endpoint, resourceGroupName, webAppName, slotName)
        const appServiceUtility: AzureAppServiceUtility = new AzureAppServiceUtility(appService)

        if (AppSettings) {
            const customApplicationSettings = Utils.validateSettings(AppSettings, maskInputs)
            await appServiceUtility.updateAndMonitorAppSettings(customApplicationSettings, null)
        }

        if (ConnectionStrings) {
            const customConnectionStrings = Utils.validateSettings(ConnectionStrings, maskInputs)
            await appServiceUtility.updateConnectionStrings(customConnectionStrings)
        }

        if (ConfigurationSettings) {
            const customConfigurationSettings = Utils.validateSettings(ConfigurationSettings)
            await appServiceUtility.updateConfigurationSettings(customConfigurationSettings)
        }

        const applicationURL = await appServiceUtility.getApplicationURL()
        core.setOutput("webapp-url", applicationURL)
    }
    catch (error) {
        console.error(JSON.stringify(error))
        core.setFailed(error)
    }
    finally {
        // Reset AZURE_HTTP_USER_AGENT
        core.exportVariable("AZURE_HTTP_USER_AGENT", userAgentPrefix)
    }
}

main()
