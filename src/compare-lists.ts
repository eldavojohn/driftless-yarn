import { spawnSync } from "child_process";

function parseLevel(line: string) {
  const lineSegments = line.split(" ");
  if (lineSegments[2]) {
    if (lineSegments[2] === "M") {
      return "minor";
    } else if (lineSegments[2] === "m") {
      return "minor";
    } else if (lineSegments[2] === "p") {
      return "patch";
    }
  }
  return undefined;
}

function parseNumber(line: string) {
  const lineSegments = line.split(" ");
  if (lineSegments[1]) {
    return parseInt(lineSegments[1]);
  }
  return undefined;
}

function parsePkg(line: string) {
  const lineSegments = line.split(" ");
  if (lineSegments[0]) {
    return lineSegments[0];
  }
  return "UNKNOWN";
}

function englishList(arr: string[]) {
  const end = arr?.pop();
  if (arr?.length) {
    return arr.join(", ") + " and " + end;
  }
  return end;
}

function detectViolation(rawpkg: string, artifactRegistryEntry: string[]) {
  const desiredLevel = parseLevel(rawpkg);
  const regexpVersion = /([0-9]+)\.([0-9]+)\.([0-9]+)\.tgz/;
  console.log(rawpkg, artifactRegistryEntry, desiredLevel);
  artifactRegistryEntry?.forEach((entry) => {
    const match = entry.match(regexpVersion);
    console.log(
      `Major: ${match?.[1]} Minor: ${match?.[2]}  Patch: ${match?.[3]}`
    );
  });
  return parseNumber(rawpkg) === undefined
    ? artifactRegistryEntry?.length > 1
    : (artifactRegistryEntry?.length ?? 0) !== parseNumber(rawpkg);
}

function compareLists(
  packageList: string,
  artifactRegistry: { [key: string]: string[] },
  reportingLists: { [key: string]: string[] },
  verbose: boolean,
  yarnWhy: boolean,
  // eslint-disable-next-line no-unused-vars
  consoleInfo: (arg: any) => void
) {
  console.log({
    packageList,
    artifactRegistry,
    reportingLists,
  });
  const collectedIssues: string[] = [];
  packageList.split("\n").forEach((rawpkg) => {
    const pkg = parsePkg(rawpkg);
    const registryViolation = detectViolation(rawpkg, artifactRegistry[pkg]);
    if (registryViolation && !verbose && !yarnWhy) {
      // fail eagerly
      process.exit(1);
    } else if (registryViolation) {
      collectedIssues.push(pkg);
      const numberNote =
        parseNumber(rawpkg) === undefined
          ? ""
          : ` (${parseNumber(rawpkg)} are required)`;
      const depList = englishList(reportingLists[pkg]);
      const explanation =
        depList === undefined
          ? "no library entries"
          : `library entries for ${depList}`;
      consoleInfo(`Package ${pkg} has ${explanation}${numberNote}:`);
      const yarnWhyData = spawnSync("yarn", ["why", pkg]);
      if (depList !== undefined) {
        consoleInfo(yarnWhyData.stdout.toString());
      }
    }
  });
  if (collectedIssues.length > 0) {
    process.exit(1);
  }
  if (verbose) {
    const report: string = packageList
      .split("\n")
      .map(
        (pkg) =>
          `${pkg}: ${
            reportingLists[parsePkg(pkg)]
              ? reportingLists[parsePkg(pkg)].length
              : 0
          } entries`
      )
      .join("\n");
    consoleInfo(
      `Report for each package and the number of entries it had in the yarn file:\n${report}`
    );
  }
  process.exit(0);
}

module.exports = { compareLists };
