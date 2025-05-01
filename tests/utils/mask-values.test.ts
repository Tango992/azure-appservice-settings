import * as core from "@actions/core"
import { validApplicationSettings, validConnectionStringSettings } from "../fixtures"
import maskValues from "../../src/utils/mask-values"

jest.mock("@actions/core", () => ({
    setSecret: jest.fn(),
}))

describe("Mask values", () => {
    let setSecretSpy: jest.SpyInstance<
        ReturnType<typeof core.setSecret>,
        Parameters<typeof core.setSecret>
    >

    beforeEach(() => {
        setSecretSpy = jest.spyOn(core, "setSecret").mockImplementation()
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
