import {
    validApplicationInputCollection, validApplicationSettings,
    validConnectionStringSettings, validGeneralSetting,
} from "./fixtures.js"
import { afterAll, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import { main } from "../src/main.js"
import * as maskValues from "../src/utils/mask-values.js"
import * as parseSettings from "../src/utils/parse-settings.js"
import * as core from "@actions/core"
import { AuthorizerFactory } from "azure-actions-webclient/AuthorizerFactory.js"
import { AzureResourceFilterUtility } from "azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility.js"
import { AzureAppServiceUtility } from "azure-actions-appservice-rest/Utilities/AzureAppServiceUtility.js"
import { IAuthorizer } from "azure-actions-webclient/Authorizer/IAuthorizer.js"
import { AssertionError } from "assert"

vi.mock("@actions/core", () => ({
    error: vi.fn(),
    exportVariable: vi.fn(),
    getInput: vi.fn(),
    info: vi.fn(),
    setFailed: vi.fn(),
    setSecret: vi.fn(),
    setOutput: vi.fn(),
}))

describe("main", () => {
    let parseSettingsSpy: MockInstance
    let getAuthorizerSpy: MockInstance
    let getAppDetailsSpy: MockInstance
    let maskValuesSpy: MockInstance
    let updateAndMonitorAppSettingsSpy: MockInstance
    let updateConnectionStringsSpy: MockInstance
    let updateConfigurationSettingsSpy: MockInstance
    let getApplicationURLSpy: MockInstance

    beforeEach(() => {
        getAuthorizerSpy = vi.spyOn(AuthorizerFactory, "getAuthorizer").mockResolvedValue("mockAuthorizer" as unknown as IAuthorizer)
        getAppDetailsSpy = vi.spyOn(AzureResourceFilterUtility, "getAppDetails").mockResolvedValue({
            resourceGroupName: "mockResourceGroupName",
        })
        maskValuesSpy = vi.spyOn(maskValues, "default")
        parseSettingsSpy = vi.spyOn(parseSettings, "default")
        updateAndMonitorAppSettingsSpy = vi.spyOn(AzureAppServiceUtility.prototype, "updateAndMonitorAppSettings").mockResolvedValue(true)
        updateConnectionStringsSpy = vi.spyOn(AzureAppServiceUtility.prototype, "updateConnectionStrings").mockResolvedValue(true)
        updateConfigurationSettingsSpy = vi.spyOn(AzureAppServiceUtility.prototype, "updateConfigurationSettings").mockResolvedValue()
        getApplicationURLSpy = vi.spyOn(AzureAppServiceUtility.prototype, "getApplicationURL").mockResolvedValue("http://testurl")
    })

    afterAll(() => {
        vi.restoreAllMocks()
    })

    it.each([
        ["truthy", true],
        ["", true],
        ["true", true],
        ["false", false],
    ])("executes the happy path and masks values if set", async (maskInputValue, shouldMask) => {
        vi.mocked(core.getInput).mockImplementation((key: string) => {
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

        vi.mocked(core.getInput).mockImplementation((key: string) => {
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
        vi.mocked(core.getInput).mockImplementation((key: string) => {
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

    it("handles other errors", async () => {
        getAuthorizerSpy.mockRejectedValue(new AssertionError({ message: "test" }))

        vi.mocked(core.getInput).mockImplementation((key: string) => {
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

        expect(getAuthorizerSpy).toHaveBeenCalledTimes(1)
        expect(getAuthorizerSpy).toHaveBeenCalledWith()

        expect(updateAndMonitorAppSettingsSpy).not.toHaveBeenCalled()
        expect(updateConnectionStringsSpy).not.toHaveBeenCalled()
        expect(updateConfigurationSettingsSpy).not.toHaveBeenCalled()
        expect(getApplicationURLSpy).not.toHaveBeenCalled()
        expect(core.setOutput).not.toHaveBeenCalled()

        expect(core.setFailed).toHaveBeenCalledTimes(1)
        expect(core.setFailed).toHaveBeenCalledWith("test")
    })
})
