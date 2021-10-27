"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var https_1 = __importDefault(require("https"));
// @ts-expect-error
var lockfile_1 = require("@yarnpkg/lockfile");
var commander_1 = require("commander");
var program = new commander_1.Command();
program.requiredOption(
  "-p, --package-list <file or url>",
  "a relative file path or https URL to the list of packages"
);
program.parse();
var options = program.opts();
var file = fs_1.default.readFileSync("yarn.lock", "utf8");
var json = (0, lockfile_1.parse)(file);
var artifactRegistry = {};
var offenders = [];
Object.keys(json.object).forEach(function (key) {
  var implodedEntry = json.object[key];
  var name = key[0] === "@" ? "@" + key.split("@")[1] : key.split("@")[0];
  var artifact = implodedEntry.resolved;
  if (
    artifactRegistry[name] &&
    artifactRegistry[name].indexOf(artifact) === -1
  ) {
    artifactRegistry[name].push(artifact);
  } else if (!artifactRegistry[name]) {
    artifactRegistry[name] = [artifact];
  }
  if (artifactRegistry[name].length > 1 && offenders.indexOf(name) === -1) {
    offenders.push(name);
  }
});
function compareLists(packageList, badList) {
  packageList.split("\n").forEach(function (pkg) {
    if (badList.indexOf(pkg) !== -1) {
      process.exit(1);
    }
  });
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
        compareLists(Buffer.concat(data).toString(), offenders);
      });
    })
    .on("error", function (err) {
      console.log("Error: ", err.message);
      process.exit(1);
    });
} else {
  compareLists(
    fs_1.default.readFileSync(options.packageList, "utf8"),
    offenders
  );
}
