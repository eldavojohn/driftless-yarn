# driftless-yarn
A simple tool to consume a project's yarn.lock and ensure certain dependencies are singular.

# Sample usage (more to come)
```console
yarn add -D driftless-yarn
node ./node_modules/driftless-yarn/src/index.js -p https://github.com/eldavojohn/driftless-yarn/blob/main/public/failingList.txt
```

This will use the project's `yarn.lock` file and compare it against failingList from this repo.  

There are some basic ouputs provided by this very project on itself.  The public directory provides example lists that you can see here:

# Failing with the `yarn why` flag turned on:

```console
$ tsc && ts-node --project tsconfig.json src/index.ts -p public/failingList.txt -w
Package chalk has library entries for chalk@^2.0.0 and chalk@^4.0.0:
[1/4] Why do we have the module "chalk"...?
[2/4] Initialising dependency graph...
[3/4] Finding dependency...
[4/4] Calculating file sizes...
=> Found "chalk@4.1.2"
info Has been hoisted to "chalk"
info Reasons this module exists
   - Hoisted from "eslint#chalk"
   - Hoisted from "jest#@jest#core#chalk"
   - Hoisted from "jest#jest-cli#chalk"
   - Hoisted from "@types#jest#jest-diff#chalk"
   - Hoisted from "ts-jest#jest-util#chalk"
   - Hoisted from "jest#@jest#core#@jest#console#chalk"
   - Hoisted from "jest#@jest#core#@jest#reporters#chalk"
   - Hoisted from "jest#@jest#core#@jest#transform#chalk"
   - Hoisted from "jest#@jest#core#@jest#types#chalk"
   - Hoisted from "jest#@jest#core#jest-config#chalk"
   - Hoisted from "jest#@jest#core#jest-message-util#chalk"
   - Hoisted from "jest#@jest#core#jest-resolve#chalk"
   - Hoisted from "jest#@jest#core#jest-runner#chalk"
   - Hoisted from "jest#@jest#core#jest-runtime#chalk"
   - Hoisted from "jest#@jest#core#jest-snapshot#chalk"
   - Hoisted from "jest#@jest#core#jest-validate#chalk"
   - Hoisted from "jest#@jest#core#jest-watcher#chalk"
   - Hoisted from "jest#@jest#core#jest-config#babel-jest#chalk"
   - Hoisted from "jest#@jest#core#jest-config#jest-circus#chalk"
   - Hoisted from "jest#@jest#core#jest-config#jest-jasmine2#chalk"
   - Hoisted from "jest#@jest#core#jest-snapshot#jest-matcher-utils#chalk"
   - Hoisted from "jest#@jest#core#jest-config#jest-circus#jest-each#chalk"
info Disk size without dependencies: "56KB"
info Disk size with unique dependencies: "108KB"
info Disk size with transitive dependencies: "192KB"
info Number of shared dependencies: 5
=> Found "tslint#chalk@2.4.2"
info This module exists because "tslint" depends on it.
info Disk size without dependencies: "44KB"
info Disk size with unique dependencies: "116KB"
info Disk size with transitive dependencies: "200KB"
info Number of shared dependencies: 6
=> Found "@babel/highlight#chalk@2.4.2"
info This module exists because "tslint#@babel#code-frame#@babel#highlight" depends on it.
info Disk size without dependencies: "44KB"
info Disk size with unique dependencies: "116KB"
info Disk size with transitive dependencies: "200KB"
info Number of shared dependencies: 6

error Command failed with exit code 1.
```

# Failing with the `verbose` flag turned on:

Note: this is identical to the prior output since a failure shows up in both verbose and why.

# Pass with the `verbose` flag turned on:

```console
$ tsc && ts-node --project tsconfig.json src/index.ts -p public/passingList.txt -v
Report for each package and the number of entries it had in the yarn file:
@cspotcode/source-map-consumer: 1 entries
something-not-present: 0 entries
json5: 1 entries
lodash.memoize: 1 entries
Done in 6.45s.
```

# Pass with the `yarn why` flag turned on:

This produces no output other than a success code since there was no package to run yarn why on.

# Enforcing a Number of Versions Present

Inside the configuration file, numbers will enforce that the yarn.lock file has that many versions of that dependency.  For example `source-map 3` will enforce that there are three and exactly three versions of source-map in the project.  