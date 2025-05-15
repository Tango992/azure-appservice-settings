import * as core from "@actions/core"
import { ApplicationSettingElement, ConnectionStringSettingElement } from "../types/app-settings"

type SettingElements = ApplicationSettingElement[] | ConnectionStringSettingElement[]

/**
 * Mask sensitive setting values (if set).
 * @param settingElements The setting elements.
 * @param shouldMaskValues Whether the value of each elements should be masked.
 * @returns
 */
const maskValues = (settingElements: SettingElements, shouldMaskValues: boolean) => {
    if (!shouldMaskValues) {
        return
    }

    settingElements.forEach((setting) => {
        core.setSecret(setting.value)
    })
}

export default maskValues
