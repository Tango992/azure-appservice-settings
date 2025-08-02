import z from "zod"
import { ApplicationSettingElement, ConnectionStringSettingElement, GeneralSetting } from "./types/app-settings"

const ApplicationSettingElementZod = z.object({
    name: z.string(),
    value: z.string(),
    slotSetting: z.boolean().optional(),
}) satisfies z.ZodType<ApplicationSettingElement>

/** Zod validation schema for a list of {@linkcode ApplicationSettingElement}. */
const ApplicationSettingsZod = z.array(ApplicationSettingElementZod)

const ConnectionStringSettingElementZod = ApplicationSettingElementZod.and(z.object({
    type: z.string(),
})) satisfies z.ZodType<ConnectionStringSettingElement>

/** Zod validation schema for a list of {@linkcode ConnectionStringSettingElement}. */
const ConnectionStringSettingsZod = z.array(ConnectionStringSettingElementZod)

/** Zod validation schema for {@linkcode GeneralSetting}. */
const GeneralSettingZod = z.record(z.string(), z.string()) satisfies z.ZodType<GeneralSetting>

export { ApplicationSettingsZod, ConnectionStringSettingsZod, GeneralSettingZod }
