import { ApplicationSettingElement, ConnectionStringSettingElement, GeneralSetting } from "./app-settings"

export type ParsedSettingCollection = {
    appSettings: ApplicationSettingElement[] | undefined
    connStringSettings: ConnectionStringSettingElement[] | undefined
    generalSetting: GeneralSetting | undefined
}
