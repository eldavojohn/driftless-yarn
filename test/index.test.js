"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
// @ts-expect-error
var lockfile_1 = require("@yarnpkg/lockfile");
var compareLists = require("../src/compare-lists").compareLists;
var output = [];
var mockConsole = function (arg) { return output.push(arg); };
describe("copare-lists", function () {
    it("should run with no params", function () {
        var file = fs_1.default.readFileSync("yarn.lock", "utf8");
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
                versionStringRegistry[name].push(key);
            }
            else if (!artifactRegistry[name]) {
                artifactRegistry[name] = [artifact];
                versionStringRegistry[name] = [key];
            }
        });
        compareLists("tslib\npath-is-absolute\nchalk\n@cspotcode/source-map-consumer\nsomething-not-present", artifactRegistry, versionStringRegistry, true, false, mockConsole);
        console.log(output);
    });
});
