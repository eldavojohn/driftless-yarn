"use strict";
describe("start.js", function () {
    // @ts-expect-error
    var mockshell;
    // @ts-expect-error
    var exitSpy;
    beforeEach(function () {
        jest.mock("shelljs", function () {
            return {
                exec: jest.fn(),
                which: jest.fn(),
                echo: jest.fn(),
            };
        });
        mockshell = require("shelljs");
        exitSpy = jest.spyOn(process, "exit").mockImplementation(function () {
            throw new Error("Mock");
        });
    });
    afterEach(function () {
        jest.resetModules();
        jest.resetAllMocks();
    });
    it("should execute program", function () {
        // @ts-expect-error
        mockshell.which.mockReturnValue(true);
        require("../src/index.js");
        // @ts-expect-error
        expect(mockshell.echo).not.toHaveBeenCalled();
        // @ts-expect-error
        expect(exitSpy).not.toHaveBeenCalled();
        // @ts-expect-error
        expect(mockshell.exec).toHaveBeenCalledWith("../src/index.js");
    });
});
