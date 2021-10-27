# driftless-yarn
A simple tool to consume a project's yarn.lock and ensure certain dependencies are singular.

# Sample usage (more to come)
```console
yarn add -D driftless-yarn
node ./node_modules/driftless-yarn/src/index.js -p https://github.com/eldavojohn/driftless-yarn/blob/main/public/failingList.txt
```

This will use the project's `yarn.lock` file and compare it against failingList from this repo.  