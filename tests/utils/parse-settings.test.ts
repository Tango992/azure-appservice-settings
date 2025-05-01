import { ParsedSettingCollection } from "../../src/types/dtos"
import parseSettings from "../../src/utils/parse-settings"
import { validApplicationSettings, validConnectionStringSettings, validGeneralSetting } from "../fixtures"

describe("Parse input settings", () => {
    it("throws an error if not a single setting input was provided", () => {
        expect(() => parseSettings("", "", "")).toThrow(Error)
    })

    it.each([
        [
            JSON.stringify(validApplicationSettings),
            JSON.stringify(validConnectionStringSettings),
            JSON.stringify(validGeneralSetting),
            {
                appSettings: validApplicationSettings,
                connStringSettings: validConnectionStringSettings,
                generalSetting: validGeneralSetting,
            } satisfies ParsedSettingCollection,
        ],
        [
            JSON.stringify(validApplicationSettings),
            "",
            "",
            {
                appSettings: validApplicationSettings,
                connStringSettings: undefined,
                generalSetting: undefined,
            } satisfies ParsedSettingCollection,
        ],
        [
            "",
            JSON.stringify(validConnectionStringSettings),
            "",
            {
                appSettings: undefined,
                connStringSettings: validConnectionStringSettings,
                generalSetting: undefined,
            } satisfies ParsedSettingCollection,
        ],
        [
            "",
            "",
            JSON.stringify(validGeneralSetting),
            {
                appSettings: undefined,
                connStringSettings: undefined,
                generalSetting: validGeneralSetting,
            } satisfies ParsedSettingCollection,
        ],
    ])("accepts valid inputs and parse them", (appSettingStr, connSettingStr, generalSettingStr, expectedOutput) => {
        expect(parseSettings(appSettingStr, connSettingStr, generalSettingStr)).toStrictEqual(expectedOutput)
    })
})
