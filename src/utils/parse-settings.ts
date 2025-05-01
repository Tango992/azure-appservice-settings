// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ZodError } from "zod"
import { ParsedSettingCollection } from "../types/dtos"
import { ApplicationSettingsZod, ConnectionStringSettingsZod, GeneralSettingZod } from "../schemas"

/**
 * Parses the application setting inputs into a JavaScript object.
 * @param appSettingsStr The raw input for application settings.
 * @param connSettingsStr The raw input for connection strings settings.
 * @param generalSettingStr The raw input for general settings.
 * @throws {Error}
 * @throws {ZodError}
 * @throws {SyntaxError} When parsing the string to JavaScript object fails.
 */
const parseSettings = (
    appSettingsStr: string,
    connSettingsStr: string,
    generalSettingStr: string,
): ParsedSettingCollection => {
    if (!appSettingsStr && !connSettingsStr && !generalSettingStr) {
        throw new Error("App Service Settings is not enabled. Please provide one of the following : App Settings or General Settings or Connection Strings.")
    }

    return {
        appSettings: appSettingsStr === "" ? undefined : ApplicationSettingsZod.parse(JSON.parse(appSettingsStr)),
        connStringSettings: connSettingsStr === "" ? undefined : ConnectionStringSettingsZod.parse(JSON.parse(connSettingsStr)),
        generalSetting: generalSettingStr === "" ? undefined : GeneralSettingZod.parse(JSON.parse(generalSettingStr)),
    }
}

export { parseSettings }
