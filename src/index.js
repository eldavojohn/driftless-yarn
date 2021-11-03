"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var https_1 = __importDefault(require("https"));
// @ts-expect-error
var lockfile_1 = require("@yarnpkg/lockfile");
var commander_1 = require("commander");
var child_process_1 = require("child_process");
var program = new commander_1.Command();
program
    .requiredOption("-p, --package-list <file or url>", "a relative file path or https URL to the list of packages")
    .option("-y, --yarn-location <file location of yarn.lock>", "a relative file path to the yarn.lock in question")
    .option("-w, --yarn-why", "upon failure, display the yarn why for each problem")
    .option("-v, --verbose", "print out report for both success and error");
program.parse();
var options = program.opts();
var file = fs_1.default.readFileSync(options.yarnLocation || "yarn.lock", "utf8");
var json = (0, lockfile_1.parse)(file);
var artifactRegistry = {};
var versionStringRegistry = {};
var offenders = [];
Object.keys(json.object).forEach(function (key) {
    var implodedEntry = json.object[key];
    var name = key[0] === "@" ? "@" + key.split("@")[1] : key.split("@")[0];
    var artifact = implodedEntry.resolved;
    if (artifactRegistry[name] &&
        artifactRegistry[name].indexOf(artifact) === -1) {
        artifactRegistry[name].push(artifact);
        if (options.verbose || options.yarnWhy) {
            versionStringRegistry[name].push(key);
        }
    }
    else if (!artifactRegistry[name]) {
        artifactRegistry[name] = [artifact];
        if (options.verbose || options.yarnWhy) {
            versionStringRegistry[name] = [key];
        }
    }
    if (artifactRegistry[name].length > 1 && offenders.indexOf(name) === -1) {
        offenders.push(name);
    }
});
function englishList(arr) {
    var end = arr.pop();
    if (arr.length) {
        return arr.join(", ") + " and " + end;
    }
    return end;
}
function compareLists(packageList, badList, reportingLists) {
    var collectedIssues = [];
    packageList.split("\n").forEach(function (pkg) {
        if (badList.indexOf(pkg) !== -1 && !options.verbose && !options.yarnWhy) {
            // fail eagerly
            process.exit(1);
        }
        else if (badList.indexOf(pkg) !== -1) {
            collectedIssues.push(pkg);
            console.info("Package " + pkg + " has library entries for " + englishList(reportingLists[pkg]) + ":");
            var yarnWhyData = (0, child_process_1.spawnSync)("yarn", ["why", pkg]);
            console.info(yarnWhyData.stdout.toString());
        }
    });
    if (collectedIssues.length > 0) {
        process.exit(1);
    }
    if (options.verbose) {
        var report = packageList
            .split("\n")
            .map(function (pkg) {
            return pkg + ": " + (reportingLists[pkg] ? reportingLists[pkg].length : 0) + " entries";
        })
            .join("\n");
        console.info("Report for each package and the number of entries it had in the yarn file:\n" + report);
    }
    process.exit(0);
}
if (options.packageList.indexOf("https") === 0) {
    https_1.default
        .get(options.packageList, function (res) {
        var data = [];
        res.on("data", function (chunk) {
            data.push(chunk);
        });
        res.on("end", function () {
            compareLists(Buffer.concat(data).toString(), offenders, versionStringRegistry);
        });
    })
        .on("error", function (err) {
        console.error("Error: ", err.message);
        process.exit(1);
    });
}
else {
    compareLists(fs_1.default.readFileSync(options.packageList, "utf8"), offenders, versionStringRegistry);
}
