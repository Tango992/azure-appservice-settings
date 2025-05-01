import { ZodError } from "zod"
import { ApplicationSettingsZod, ConnectionStringSettingsZod, GeneralSettingZod } from "../src/schemas"
import { ApplicationSettingElement, ConnectionStringSettingElement, GeneralSetting } from "../src/types/app-settings"

describe("Schema validation", () => {
    const applicationSettings: ApplicationSettingElement[] = [
        {
            name: "foo",
            value: "bar",
        },
        {
            name: "fufufafa",
            value: "",
            slotSetting: true,
        },
        {
            name: "JavaScript on the server",
            value: "was a mistake",
            slotSetting: false,
        },
    ]

    it.each([
        [
            applicationSettings,
            ApplicationSettingsZod,
        ],
        [
            [],
            ApplicationSettingsZod,
        ],
        [
            [
                {
                    ...applicationSettings[0],
                    type: "PostgreSQL",
                },
                {
                    ...applicationSettings[1],
                    type: "",
                },
                {
                    ...applicationSettings[2],
                    type: "foo",
                },
            ] satisfies ConnectionStringSettingElement[],
            ConnectionStringSettingsZod,
        ],
        [
            [],
            ConnectionStringSettingsZod,
        ],
        [
            {
                hello: "world",
                foo: "bar",
                baz: "",
            } satisfies GeneralSetting,
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
