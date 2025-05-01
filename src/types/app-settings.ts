/**
 * An element of the application settings.
 * @see https://learn.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal#edit-app-settings-in-bulk
 */
export type ApplicationSettingElement = {
    name: string
    value: string
    slotSetting?: boolean
}

/**
 * An element of the connection strings settings.
 * @see https://learn.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal#edit-connection-strings-in-bulk
*/
export type ConnectionStringSettingElement = ApplicationSettingElement & {
    type: string
}

/**
 * A general key-value pair setting.
 * @see https://learn.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal#configure-general-settings
 */
export type GeneralSetting = Record<string, string>
