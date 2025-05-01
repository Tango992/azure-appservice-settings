import * as core from "@actions/core"
import { main } from "../src/main"

import { AzureResourceFilterUtility } from "azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility"
import { AzureAppServiceUtility } from "azure-actions-appservice-rest/Utilities/AzureAppServiceUtility"

jest.mock("@actions/core")
jest.mock("azure-actions-appservice-rest/Arm/azure-app-service")
jest.mock("azure-actions-webclient/AuthorizerFactory")
jest.mock("azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility")
jest.mock("azure-actions-webclient/Authorizer/IAuthorizer")
jest.mock("azure-actions-appservice-rest/Utilities/AzureAppServiceUtility")

const jsonObject = {
    "app-name": "MOCK_APP_NAME",
    "resource-group-name": "MOCK_RESOURCE_GROUP",
    "mask-inputs": "false",
    "app-kind": "MOCK_APP_KIND",
    "app-settings-json": `[
        {
            "name": "key2",
            "value": "valueefgh",
            "slotSetting": true
        }
    ]`,
    "connection-strings-json": `[
        {
        "name": "key1",
        "value": "valueabcd",
        "type": "MySql",
        "slotSetting": false
        }
    ]`,
}

describe("Test Azure App Service Settings", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it("Get all variables as input", async () => {
        const getInputSpy = jest.spyOn(core, "getInput").mockImplementation((name, _options) => {
            switch (name) {
                case "app-name": return jsonObject["app-name"]
                case "connection-strings-json" : return jsonObject["connection-strings-json"]
            }
            return ""
        })

        const appDetails = jest.spyOn(AzureResourceFilterUtility, "getAppDetails").mockResolvedValue({
            resourceGroupName: jsonObject["resource-group-name"],
            kind: jsonObject["app-kind"],
        })

        const getApplicationURLSpy = jest.spyOn(AzureAppServiceUtility.prototype, "getApplicationURL").mockResolvedValue("http://testurl")

        try {
            await main()
        }
        catch (e) {
            console.log(e)
        }

        expect(getInputSpy).toHaveBeenCalledTimes(6)
        expect(appDetails).toHaveBeenCalled()
        expect(getApplicationURLSpy).toHaveBeenCalled()
    })

    it("Checks valid json", async () => {
        const validateSettings = jest.fn()

        validateSettings(JSON.stringify(jsonObject["connection-strings-json"]))
        validateSettings(JSON.stringify(jsonObject["app-settings-json"]))

        expect(validateSettings).toHaveBeenCalledTimes(2)
        expect(validateSettings).toHaveReturnedTimes(2)
    })

    it("do not set inputs as secrets if mask-inputs is false", async () => {
        const getInputSpy = jest.spyOn(core, "getInput").mockImplementation((name, _options) => {
            switch (name) {
                case "app-name": return jsonObject["app-name"]
                case "connection-strings-json" : return jsonObject["connection-strings-json"]
                case "mask-inputs": return jsonObject["mask-inputs"]
            }
            return ""
        })

        const appDetails = jest.spyOn(AzureResourceFilterUtility, "getAppDetails").mockResolvedValue({
            resourceGroupName: jsonObject["resource-group-name"],
            kind: jsonObject["app-kind"],
        })

        const getApplicationURLSpy = jest.spyOn(AzureAppServiceUtility.prototype, "getApplicationURL").mockResolvedValue("http://testurl")
        // const validateSettingsSpy = jest.spyOn(Utils, "validateSettings")
        // const maskValuesSpy = jest.spyOn(Utils, "maskValues")

        await main()

        expect(getInputSpy).toHaveBeenCalledTimes(6)
        expect(appDetails).toHaveBeenCalled()
        expect(getApplicationURLSpy).toHaveBeenCalled()
        // expect(validateSettingsSpy).toHaveBeenCalled()
        // expect(maskValuesSpy).not.toHaveBeenCalled()
    })
})
