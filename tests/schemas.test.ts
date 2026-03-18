import { ZodError } from "zod"
import { ApplicationSettingsZod, ConnectionStringSettingsZod, GeneralSettingZod } from "../src/schemas.js"
import { validApplicationSettings, validConnectionStringSettings, validGeneralSetting } from "./fixtures.js"
import { describe, expect, it } from "vitest"

describe("Schema validation", () => {
    it.each([
        [
            validApplicationSettings,
            ApplicationSettingsZod,
        ],
        [
            [],
            ApplicationSettingsZod,
        ],
        [
            validConnectionStringSettings,
            ConnectionStringSettingsZod,
        ],
        [
            [],
            ConnectionStringSettingsZod,
        ],
        [
            validGeneralSetting,
            GeneralSettingZod,
        ],
        [
            {},
            GeneralSettingZod,
        ],
    ])("accepts valid schema", (input, schema) => {
        expect(schema.parse(input)).toStrictEqual(input)
    })

    it.each([
        [
            [
                { name: "hello" },
            ],
            ConnectionStringSettingsZod,
        ],
        [
            [
                { name: "hello", value: 9 },
            ],
            ConnectionStringSettingsZod,
        ],
        [
            [
                { name: 9, value: "hello" },
            ],
            ConnectionStringSettingsZod,
        ],
        [
            [
                { name: "hello" },
            ],
            ApplicationSettingsZod,
        ],
        [
            [
                { name: "hello", value: 9 },
            ],
            ApplicationSettingsZod,
        ],
        [
            [
                { name: 9, value: "hello" },
            ],
            ApplicationSettingsZod,
        ],
        [
            {
                key: 9,
                value: {},
            },
            GeneralSettingZod,
        ],
    ])("rejects invalid input", (input, schema) => {
        expect(() => schema.parse(input)).toThrow(ZodError)
    })
})
