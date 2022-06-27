"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var https_1 = __importDefault(require("https"));
var lockfile_1 = require("@yarnpkg/lockfile");
var commander_1 = require("commander");
var compareLists = require("./compare-lists").compareLists;
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
Object.keys(json.object).forEach(function (key) {
    var implodedEntry = json.object[key];
    var name = key[0] === "@" ? "@".concat(key.split("@")[1]) : key.split("@")[0];
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
});
if (options.packageList.indexOf("https") === 0) {
    https_1.default
        .get(options.packageList, function (res) {
        var data = [];
        res.on("data", function (chunk) {
            data.push(chunk);
        });
        res.on("end", function () {
            compareLists(Buffer.concat(data).toString(), artifactRegistry, versionStringRegistry, options.verbose, options.yarnWhy, console.info);
        });
    })
        .on("error", function (err) {
        console.error("Error: ", err.message);
        process.exit(1);
    });
}
else {
    compareLists(fs_1.default.readFileSync(options.packageList, "utf8"), artifactRegistry, versionStringRegistry, options.verbose, options.yarnWhy, console.info);
}
