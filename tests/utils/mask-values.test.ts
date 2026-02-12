import * as core from "@actions/core"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import { validApplicationSettings, validConnectionStringSettings } from "../fixtures.js"
import maskValues from "../../src/utils/mask-values.js"

vi.mock("@actions/core", () => ({
    setSecret: vi.fn(),
}))

describe("Mask values", () => {
    let setSecretSpy: MockInstance

    beforeEach(() => {
        setSecretSpy = vi.spyOn(core, "setSecret").mockReturnValue()
    })

    afterEach(() => {
        setSecretSpy.mockRestore()
    })

    it.each([
        [validApplicationSettings],
        [validConnectionStringSettings],
    ])("should mask the values of each element", (inputElements) => {
        maskValues(inputElements, true)

        expect(setSecretSpy).toHaveBeenCalledTimes(3)
        expect(setSecretSpy).toHaveBeenNthCalledWith(1, "bar")
        expect(setSecretSpy).toHaveBeenNthCalledWith(2, "")
        expect(setSecretSpy).toHaveBeenNthCalledWith(3, "was a mistake")
    })
})
