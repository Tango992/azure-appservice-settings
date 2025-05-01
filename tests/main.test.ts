import {
    validApplicationInputCollection, validApplicationSettings,
    validConnectionStringSettings, validGeneralSetting,
} from "./fixtures"
import { main } from "../src/main"
import * as maskValues from "../src/utils/mask-values"
import * as parseSettings from "../src/utils/parse-settings"
import { default as core } from "@actions/core"
import { AuthorizerFactory } from "azure-actions-webclient/AuthorizerFactory"
import { AzureResourceFilterUtility } from "azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility"
import { AzureAppServiceUtility } from "azure-actions-appservice-rest/Utilities/AzureAppServiceUtility"
import { IAuthorizer } from "azure-actions-webclient/Authorizer/IAuthorizer"

jest.mock("@actions/core", () => ({
    error: jest.fn(),
    exportVariable: jest.fn(),
    getInput: jest.fn(),
    info: jest.fn(),
    setFailed: jest.fn(),
    setSecret: jest.fn(),
    setOutput: jest.fn(),
}))

describe("main", () => {
    let parseSettingsSpy: jest.SpyInstance<
        ReturnType<typeof parseSettings.default>,
        Parameters<typeof parseSettings.default>
    >
    let getAuthorizerSpy: jest.SpyInstance<
        ReturnType<typeof AuthorizerFactory.getAuthorizer>,
        Parameters<typeof AuthorizerFactory.getAuthorizer>
    >
    let getAppDetailsSpy: jest.SpyInstance<
        ReturnType<typeof AzureResourceFilterUtility.getAppDetails>,
        Parameters<typeof AzureResourceFilterUtility.getAppDetails>
    >
    let maskValuesSpy: jest.SpyInstance<
        ReturnType<typeof maskValues.default>,
        Parameters<typeof maskValues.default>
    >
    let updateAndMonitorAppSettingsSpy: jest.SpyInstance<
        ReturnType<typeof AzureAppServiceUtility.prototype.updateAndMonitorAppSettings>,
        Parameters<typeof AzureAppServiceUtility.prototype.updateAndMonitorAppSettings>
    >
    let updateConnectionStringsSpy: jest.SpyInstance<
        ReturnType<typeof AzureAppServiceUtility.prototype.updateConnectionStrings>,
        Parameters<typeof AzureAppServiceUtility.prototype.updateConnectionStrings>
    >
    let updateConfigurationSettingsSpy: jest.SpyInstance<
        ReturnType<typeof AzureAppServiceUtility.prototype.updateConfigurationSettings>,
        Parameters<typeof AzureAppServiceUtility.prototype.updateConfigurationSettings>
    >
    let getApplicationURLSpy: jest.SpyInstance<
        ReturnType<typeof AzureAppServiceUtility.prototype.getApplicationURL>,
        Parameters<typeof AzureAppServiceUtility.prototype.getApplicationURL>
    >

    beforeEach(() => {
        getAuthorizerSpy = jest.spyOn(AuthorizerFactory, "getAuthorizer").mockResolvedValue("mockAuthorizer" as unknown as IAuthorizer)
        getAppDetailsSpy = jest.spyOn(AzureResourceFilterUtility, "getAppDetails").mockResolvedValue({
            resourceGroupName: "mockResourceGroupName",
        })
        maskValuesSpy = jest.spyOn(maskValues, "default")
        parseSettingsSpy = jest.spyOn(parseSettings, "default")
        updateAndMonitorAppSettingsSpy = jest.spyOn(AzureAppServiceUtility.prototype, "updateAndMonitorAppSettings").mockImplementation()
        updateConnectionStringsSpy = jest.spyOn(AzureAppServiceUtility.prototype, "updateConnectionStrings").mockImplementation()
        updateConfigurationSettingsSpy = jest.spyOn(AzureAppServiceUtility.prototype, "updateConfigurationSettings").mockImplementation()
        getApplicationURLSpy = jest.spyOn(AzureAppServiceUtility.prototype, "getApplicationURL").mockResolvedValue("http://testurl")
    })

    afterAll(() => {
        jest.restoreAllMocks()
    })

    it.each([
        ["truthy", true],
        ["", true],
        ["true", true],
        ["false", false],
    ])("executes the happy path and masks values if set", async (maskInputValue, shouldMask) => {
        jest.mocked(core.getInput).mockImplementation((key: string) => {
            if (key === "mask-inputs") {
                return maskInputValue
            }

            return (validApplicationInputCollection as Record<string, string | undefined>)[key] || ""
        })

        await main()

        expect(core.exportVariable).toHaveBeenCalledTimes(2)
        expect(core.exportVariable).toHaveBeenNthCalledWith(
            1,
            "AZURE_HTTP_USER_AGENT",
            expect.stringMatching(/^GITHUBACTIONS_AzureAppServiceSettings_[a-z0-9]{64}/),
        )
        expect(core.exportVariable).toHaveBeenNthCalledWith(2, "AZURE_HTTP_USER_AGENT", "")

        expect(core.getInput).toHaveBeenCalledTimes(6)
        expect(core.getInput).toHaveBeenNthCalledWith(1, "app-name", { required: true })
        expect(core.getInput).toHaveBeenNthCalledWith(2, "slot-name", { required: false })
        expect(core.getInput).toHaveBeenNthCalledWith(3, "mask-inputs", { required: false })
        expect(core.getInput).toHaveBeenNthCalledWith(4, "app-settings-json", { required: false })
        expect(core.getInput).toHaveBeenNthCalledWith(5, "connection-strings-json", { required: false })
        expect(core.getInput).toHaveBeenNthCalledWith(6, "general-settings-json", { required: false })

        expect(parseSettingsSpy).toHaveBeenCalledTimes(1)
        expect(parseSettingsSpy).toHaveBeenCalledWith(
            JSON.stringify(validApplicationSettings),
            JSON.stringify(validConnectionStringSettings),
            JSON.stringify(validGeneralSetting),
        )

        expect(maskValuesSpy).toHaveBeenCalledTimes(2)
        expect(maskValuesSpy).toHaveBeenNthCalledWith(1, validApplicationSettings, shouldMask)
        expect(maskValuesSpy).toHaveBeenNthCalledWith(2, validConnectionStringSettings, shouldMask)

        expect(getAuthorizerSpy).toHaveBeenCalledTimes(1)
        expect(getAuthorizerSpy).toHaveBeenCalledWith()

        expect(getAppDetailsSpy).toHaveBeenCalledTimes(1)
        expect(getAppDetailsSpy).toHaveBeenCalledWith("mockAuthorizer", "MOCK_APP_NAME")

        expect(updateAndMonitorAppSettingsSpy).toHaveBeenCalledTimes(1)
        expect(updateAndMonitorAppSettingsSpy).toHaveBeenCalledWith(validApplicationSettings, null)

        expect(updateConnectionStringsSpy).toHaveBeenCalledTimes(1)
        expect(updateConnectionStringsSpy).toHaveBeenCalledWith(validConnectionStringSettings)

        expect(updateConfigurationSettingsSpy).toHaveBeenCalledTimes(1)
        expect(updateConfigurationSettingsSpy).toHaveBeenCalledWith(validGeneralSetting)

        expect(getApplicationURLSpy).toHaveBeenCalledTimes(1)
        expect(getApplicationURLSpy).toHaveBeenCalledWith()

        expect(core.setOutput).toHaveBeenCalledTimes(1)
        expect(core.setOutput).toHaveBeenCalledWith("webapp-url", "http://testurl")

        expect(core.setFailed).not.toHaveBeenCalled()
    })

    it("executes happy path and handles when AZURE_HTTP_USER_AGENT is set", async () => {
        const originalAzureHttpUserAgent = process.env.AZURE_HTTP_USER_AGENT
        process.env.AZURE_HTTP_USER_AGENT = "customUserAgent"

        jest.mocked(core.getInput).mockImplementation((key: string) => {
            return (validApplicationInputCollection as Record<string, string | undefined>)[key] || ""
        })

        await main()

        expect(core.exportVariable).toHaveBeenCalledTimes(2)
        expect(core.exportVariable).toHaveBeenNthCalledWith(
            1,
            "AZURE_HTTP_USER_AGENT",
            expect.stringMatching(/^customUserAgent\+GITHUBACTIONS_AzureAppServiceSettings_[a-z0-9]{64}/),
        )
        expect(core.exportVariable).toHaveBeenNthCalledWith(2, "AZURE_HTTP_USER_AGENT", "customUserAgent")

        expect(core.getInput).toHaveBeenCalledTimes(6)
        expect(core.getInput).toHaveBeenNthCalledWith(1, "app-name", { required: true })
        expect(core.getInput).toHaveBeenNthCalledWith(2, "slot-name", { required: false })
        expect(core.getInput).toHaveBeenNthCalledWith(3, "mask-inputs", { required: false })
        expect(core.getInput).toHaveBeenNthCalledWith(4, "app-settings-json", { required: false })
        expect(core.getInput).toHaveBeenNthCalledWith(5, "connection-strings-json", { required: false })
        expect(core.getInput).toHaveBeenNthCalledWith(6, "general-settings-json", { required: false })

        expect(parseSettingsSpy).toHaveBeenCalledTimes(1)
        expect(parseSettingsSpy).toHaveBeenCalledWith(
            JSON.stringify(validApplicationSettings),
            JSON.stringify(validConnectionStringSettings),
            JSON.stringify(validGeneralSetting),
        )

        expect(maskValuesSpy).toHaveBeenCalledTimes(2)
        expect(maskValuesSpy).toHaveBeenNthCalledWith(1, validApplicationSettings, false)
        expect(maskValuesSpy).toHaveBeenNthCalledWith(2, validConnectionStringSettings, false)

        expect(getAuthorizerSpy).toHaveBeenCalledTimes(1)
        expect(getAuthorizerSpy).toHaveBeenCalledWith()

        expect(getAppDetailsSpy).toHaveBeenCalledTimes(1)
        expect(getAppDetailsSpy).toHaveBeenCalledWith("mockAuthorizer", "MOCK_APP_NAME")

        expect(updateAndMonitorAppSettingsSpy).toHaveBeenCalledTimes(1)
        expect(updateAndMonitorAppSettingsSpy).toHaveBeenCalledWith(validApplicationSettings, null)

        expect(updateConnectionStringsSpy).toHaveBeenCalledTimes(1)
        expect(updateConnectionStringsSpy).toHaveBeenCalledWith(validConnectionStringSettings)

        expect(updateConfigurationSettingsSpy).toHaveBeenCalledTimes(1)
        expect(updateConfigurationSettingsSpy).toHaveBeenCalledWith(validGeneralSetting)

        expect(getApplicationURLSpy).toHaveBeenCalledTimes(1)
        expect(getApplicationURLSpy).toHaveBeenCalledWith()

        expect(core.setOutput).toHaveBeenCalledTimes(1)
        expect(core.setOutput).toHaveBeenCalledWith("webapp-url", "http://testurl")

        expect(core.setFailed).not.toHaveBeenCalled()

        if (originalAzureHttpUserAgent === undefined) {
            delete process.env.AZURE_HTTP_USER_AGENT
        }
        else {
            process.env.AZURE_HTTP_USER_AGENT = originalAzureHttpUserAgent
        }
    })

    it.each([
        ["willThrowSyntaxErrorFromJSONparse", "Invalid JSON format. Please check the JSON format of the input."],
        ["{\"thrown_by\":\"zod\"}", "Invalid JSON format. Please check the JSON format of the input."],
    ])("handles thrown errors", async (appSettingsValue, errorMessage) => {
        jest.mocked(core.getInput).mockImplementation((key: string) => {
            if (key === "app-settings-json") {
                return appSettingsValue
            }

            return (validApplicationInputCollection as Record<string, string | undefined>)[key] || ""
        })

        await main()

        expect(core.exportVariable).toHaveBeenCalledTimes(2)
        expect(core.exportVariable).toHaveBeenNthCalledWith(
            1,
            "AZURE_HTTP_USER_AGENT",
            expect.stringMatching(/^GITHUBACTIONS_AzureAppServiceSettings_[a-z0-9]{64}/),
        )
        expect(core.exportVariable).toHaveBeenNthCalledWith(2, "AZURE_HTTP_USER_AGENT", "")

        expect(updateAndMonitorAppSettingsSpy).not.toHaveBeenCalled()
        expect(updateConnectionStringsSpy).not.toHaveBeenCalled()
        expect(updateConfigurationSettingsSpy).not.toHaveBeenCalled()
        expect(getApplicationURLSpy).not.toHaveBeenCalled()
        expect(core.setOutput).not.toHaveBeenCalled()

        expect(core.setFailed).toHaveBeenCalledTimes(1)
        expect(core.setFailed).toHaveBeenCalledWith(errorMessage)
    })
})
