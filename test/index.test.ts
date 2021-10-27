describe("start.js", () => {
  // @ts-expect-error
  let mockshell;
  // @ts-expect-error
  let exitSpy;

  beforeEach(() => {
    jest.mock("shelljs", () => {
      return {
        exec: jest.fn(),
        which: jest.fn(),
        echo: jest.fn(),
      };
    });
    mockshell = require("shelljs");

    exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("Mock");
    });
  });

  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it("should execute program", () => {
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
