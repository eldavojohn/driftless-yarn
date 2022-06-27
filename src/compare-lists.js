"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
function parseLevel(line) {
    var lineSegments = line.split(" ");
    if (lineSegments[1]) {
        if (lineSegments[1] === "M") {
            return "major";
        }
        else if (lineSegments[1] === "m") {
            return "minor";
        }
    }
    return undefined;
}
function parseNumber(line) {
    var lineSegments = line.split(" ");
    try {
        if (lineSegments[1]) {
            if (lineSegments[1] === "m" || lineSegments[1] === "M") {
                return undefined;
            }
            return parseInt(lineSegments[1]);
        }
    }
    catch (_a) {
        return undefined;
    }
    return undefined;
}
function parsePkg(line) {
    var lineSegments = line.split(" ");
    if (lineSegments[0]) {
        return lineSegments[0];
    }
    return "UNKNOWN";
}
function englishList(arr) {
    var end = arr === null || arr === void 0 ? void 0 : arr.pop();
    if (arr === null || arr === void 0 ? void 0 : arr.length) {
        return arr.join(", ") + " and " + end;
    }
    return end;
}
function detectViolation(rawpkg, artifactRegistryEntry) {
    var _a;
    var desiredLevel = parseLevel(rawpkg);
    var regexpVersion = /([0-9]+)\.([0-9]+)\.([0-9]+)\.tgz/;
    if (desiredLevel) {
        var isViolation_1 = false;
        var levelCollection_1 = new Set();
        artifactRegistryEntry === null || artifactRegistryEntry === void 0 ? void 0 : artifactRegistryEntry.forEach(function (entry) {
            if (!isViolation_1) {
                var match = entry.match(regexpVersion);
                if (desiredLevel === "major") {
                    levelCollection_1.add(match === null || match === void 0 ? void 0 : match[1]);
                }
                else if (desiredLevel === "minor") {
                    levelCollection_1.add("".concat(match === null || match === void 0 ? void 0 : match[1], ".").concat(match === null || match === void 0 ? void 0 : match[2]));
                }
                if (levelCollection_1.size > 1) {
                    isViolation_1 = true;
                }
            }
        });
        return isViolation_1;
    }
    return parseNumber(rawpkg) === undefined
        ? (artifactRegistryEntry === null || artifactRegistryEntry === void 0 ? void 0 : artifactRegistryEntry.length) > 1
        : ((_a = artifactRegistryEntry === null || artifactRegistryEntry === void 0 ? void 0 : artifactRegistryEntry.length) !== null && _a !== void 0 ? _a : 0) !== parseNumber(rawpkg);
}
function compareLists(packageList, artifactRegistry, reportingLists, verbose, yarnWhy, 
// eslint-disable-next-line no-unused-vars
consoleInfo) {
    var collectedIssues = [];
    packageList.split("\n").forEach(function (rawpkg) {
        var pkg = parsePkg(rawpkg);
        var registryViolation = detectViolation(rawpkg, artifactRegistry[pkg]);
        if (registryViolation && !verbose && !yarnWhy) {
            // fail eagerly
            process.exit(1);
        }
        else if (registryViolation) {
            collectedIssues.push(pkg);
            var numberNote = parseNumber(rawpkg) === undefined
                ? ""
                : " (".concat(parseNumber(rawpkg), " are required)");
            var depList = englishList(reportingLists[pkg]);
            var explanation = depList === undefined
                ? "no library entries"
                : "library entries for ".concat(depList);
            consoleInfo("Package ".concat(pkg, " has ").concat(explanation).concat(numberNote, ":"));
            var yarnWhyData = (0, child_process_1.spawnSync)("yarn", ["why", pkg]);
            if (depList !== undefined) {
                consoleInfo(yarnWhyData.stdout.toString());
            }
        }
    });
    if (collectedIssues.length > 0) {
        process.exit(1);
    }
    if (verbose) {
        var report = packageList
            .split("\n")
            .map(function (pkg) {
            return "".concat(pkg, ": ").concat(reportingLists[parsePkg(pkg)]
                ? reportingLists[parsePkg(pkg)].length
                : 0, " entries");
        })
            .join("\n");
        consoleInfo("Report for each package and the number of entries it had in the yarn file:\n".concat(report));
    }
    process.exit(0);
}
module.exports = { compareLists: compareLists };
