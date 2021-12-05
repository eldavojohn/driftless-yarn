"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
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
function compareLists(packageList, artifactRegistry, reportingLists, verbose, yarnWhy, 
// eslint-disable-next-line no-unused-vars
consoleInfo) {
    console.log({
        packageList: packageList,
        artifactRegistry: artifactRegistry,
        reportingLists: reportingLists
    });
    var collectedIssues = [];
    packageList.split("\n").forEach(function (rawpkg) {
        var _a, _b, _c;
        var pkg = parsePkg(rawpkg);
        var registryViolation = parseNumber(rawpkg) === undefined
            ? ((_a = artifactRegistry[pkg]) === null || _a === void 0 ? void 0 : _a.length) > 1
            : ((_c = (_b = artifactRegistry[pkg]) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0) !== parseNumber(rawpkg);
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
