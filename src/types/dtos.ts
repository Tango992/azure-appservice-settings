import { ApplicationSettingElement, ConnectionStringSettingElement, GeneralSetting } from "./app-settings.js"

export type ParsedSettingCollection = {
    appSettings: ApplicationSettingElement[] | undefined
    connStringSettings: ConnectionStringSettingElement[] | undefined
    generalSetting: GeneralSetting | undefined
}
