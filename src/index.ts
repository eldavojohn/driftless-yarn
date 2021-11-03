import fs from "fs";
import https from "https";
// @ts-expect-error
import { parse } from "@yarnpkg/lockfile";
import { Command } from "commander";
import { spawnSync } from "child_process";

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
const offenders: string[] = [];

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
  if (artifactRegistry[name].length > 1 && offenders.indexOf(name) === -1) {
    offenders.push(name);
  }
});

function englishList(arr: string[]) {
  const end = arr.pop();
  if (arr.length) {
    return arr.join(", ") + " and " + end;
  }
  return end;
}

function compareLists(
  packageList: string,
  badList: string[],
  reportingLists: { [key: string]: string[] }
) {
  const collectedIssues: string[] = [];
  packageList.split("\n").forEach((pkg) => {
    if (badList.indexOf(pkg) !== -1 && !options.verbose && !options.yarnWhy) {
      // fail eagerly
      process.exit(1);
    } else if (badList.indexOf(pkg) !== -1) {
      collectedIssues.push(pkg);
      console.info(
        `Package ${pkg} has library entries for ${englishList(
          reportingLists[pkg]
        )}:`
      );
      const yarnWhyData = spawnSync("yarn", ["why", pkg]);
      console.info(yarnWhyData.stdout.toString());
    }
  });
  if (collectedIssues.length > 0) {
    process.exit(1);
  }
  if (options.verbose) {
    const report: string = packageList
      .split("\n")
      .map(
        (pkg) =>
          `${pkg}: ${
            reportingLists[pkg] ? reportingLists[pkg].length : 0
          } entries`
      )
      .join("\n");
    console.info(
      `Report for each package and the number of entries it had in the yarn file:\n${report}`
    );
  }
  process.exit(0);
}

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
          offenders,
          versionStringRegistry
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
    offenders,
    versionStringRegistry
  );
}
