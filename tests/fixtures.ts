import { ApplicationSettingElement, ConnectionStringSettingElement, GeneralSetting } from "../src/types/app-settings"

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

export const validGeneralSetting: GeneralSetting = {
    hello: "world",
    foo: "bar",
    baz: "",
}
