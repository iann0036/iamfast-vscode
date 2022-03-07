#!/bin/bash

npm i -U iamfast
cd node_modules/iamfast/
mv package-module.json package.json
npm i esbuild
npm run-script prepare
