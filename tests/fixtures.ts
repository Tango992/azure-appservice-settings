import { ApplicationSettingElement, ConnectionStringSettingElement, GeneralSetting } from "../src/types/app-settings.js"

/** Test fixture. */
export const validApplicationSettings: ApplicationSettingElement[] = [
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

/** Test fixture. */
export const validConnectionStringSettings: ConnectionStringSettingElement[] = [
    {
        ...validApplicationSettings[0],
        type: "PostgreSQL",
    },
    {
        ...validApplicationSettings[1],
        type: "",
    },
    {
        ...validApplicationSettings[2],
        type: "foo",
    },
]

/** Test fixture. */
export const validGeneralSetting: GeneralSetting = {
    hello: "world",
    foo: "bar",
    baz: "",
}

/** Test fixture. */
export const validApplicationInputCollection = {
    "app-name": "MOCK_APP_NAME",
    "resource-group-name": "MOCK_RESOURCE_GROUP",
    "mask-inputs": "false",
    "app-kind": "MOCK_APP_KIND",
    "app-settings-json": JSON.stringify(validApplicationSettings),
    "connection-strings-json": JSON.stringify(validConnectionStringSettings),
    "general-settings-json": JSON.stringify(validGeneralSetting),
}
