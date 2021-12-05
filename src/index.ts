import fs from "fs";
import https from "https";
// @ts-expect-error
import { parse } from "@yarnpkg/lockfile";
import { Command } from "commander";

const { compareLists } = require("./compare-lists");

const program = new Command();
program
  .requiredOption(
    "-p, --package-list <file or url>",
    "a relative file path or https URL to the list of packages"
  )
  .option(
    "-y, --yarn-location <file location of yarn.lock>",
    "a relative file path to the yarn.lock in question"
  )
  .option(
    "-w, --yarn-why",
    "upon failure, display the yarn why for each problem"
  )
  .option("-v, --verbose", "print out report for both success and error");

program.parse();
const options = program.opts();

const file = fs.readFileSync(options.yarnLocation || "yarn.lock", "utf8");
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
    if (options.verbose || options.yarnWhy) {
      versionStringRegistry[name].push(key);
    }
  } else if (!artifactRegistry[name]) {
    artifactRegistry[name] = [artifact];
    if (options.verbose || options.yarnWhy) {
      versionStringRegistry[name] = [key];
    }
  }
});

if (options.packageList.indexOf("https") === 0) {
  https
    .get(options.packageList, (res) => {
      const data: Uint8Array[] = [];
      res.on("data", (chunk) => {
        data.push(chunk);
      });
      res.on("end", () => {
        compareLists(
          Buffer.concat(data).toString(),
          artifactRegistry,
          versionStringRegistry,
          options.verbose,
          options.yarnWhy,
          console.info
        );
      });
    })
    .on("error", (err) => {
      console.error("Error: ", err.message);
      process.exit(1);
    });
} else {
  compareLists(
    fs.readFileSync(options.packageList, "utf8"),
    artifactRegistry,
    versionStringRegistry,
    options.verbose,
    options.yarnWhy,
    console.info
  );
}
