"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
function parseLevel(line) {
    var lineSegments = line.split(" ");
    if (lineSegments[2]) {
        if (lineSegments[2] === "M") {
            return "minor";
        }
        else if (lineSegments[2] === "m") {
            return "minor";
        }
        else if (lineSegments[2] === "p") {
            return "patch";
        }
    }
    return undefined;
}
function parseNumber(line) {
    var lineSegments = line.split(" ");
    if (lineSegments[1]) {
        return parseInt(lineSegments[1]);
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
    console.log(rawpkg, artifactRegistryEntry, desiredLevel);
    artifactRegistryEntry === null || artifactRegistryEntry === void 0 ? void 0 : artifactRegistryEntry.forEach(function (entry) {
        var match = entry.match(regexpVersion);
        console.log("Major: ".concat(match === null || match === void 0 ? void 0 : match[1], " Minor: ").concat(match === null || match === void 0 ? void 0 : match[2], "  Patch: ").concat(match === null || match === void 0 ? void 0 : match[3]));
    });
    return parseNumber(rawpkg) === undefined
        ? (artifactRegistryEntry === null || artifactRegistryEntry === void 0 ? void 0 : artifactRegistryEntry.length) > 1
        : ((_a = artifactRegistryEntry === null || artifactRegistryEntry === void 0 ? void 0 : artifactRegistryEntry.length) !== null && _a !== void 0 ? _a : 0) !== parseNumber(rawpkg);
}
function compareLists(packageList, artifactRegistry, reportingLists, verbose, yarnWhy, 
// eslint-disable-next-line no-unused-vars
consoleInfo) {
    console.log({
        packageList: packageList,
        artifactRegistry: artifactRegistry,
        reportingLists: reportingLists,
    });
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
