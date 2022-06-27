import fs from "fs";
import { parse } from "@yarnpkg/lockfile";
const { compareLists } = require("../src/compare-lists");

const output: string[] = [];

const mockConsole = (arg: string) => output.push(arg);

// TODO need to figure out how to capture process.exit(1)
describe("copare-lists", () => {
  it("should run with no params", () => {
    const file = fs.readFileSync("yarn.lock", "utf8");
    const json = parse(file);

    const artifactRegistry: { [key: string]: string[] } = {};
    const versionStringRegistry: { [key: string]: string[] } = {};

    Object.keys(json.object).forEach((key) => {
      const implodedEntry = json.object[key];
      const name = key[0] === "@" ? `@${key.split("@")[1]}` : key.split("@")[0];
      const artifact = implodedEntry.resolved;
      if (
        artifactRegistry[name] &&
        artifactRegistry[name].indexOf(artifact) === -1
      ) {
        artifactRegistry[name].push(artifact);
        versionStringRegistry[name].push(key);
      } else if (!artifactRegistry[name]) {
        artifactRegistry[name] = [artifact];
        versionStringRegistry[name] = [key];
      }
    });
    compareLists(
      "tslib\npath-is-absolute\nchalk\n@cspotcode/source-map-consumer\nsomething-not-present",
      artifactRegistry,
      versionStringRegistry,
      true,
      false,
      mockConsole
    );
    console.log(output);
  });
});
