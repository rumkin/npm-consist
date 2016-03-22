name: npm-consist
description: NPM consistency checker

bin: bin/npm-consist.js
beforeInstall:
    - npm install .
