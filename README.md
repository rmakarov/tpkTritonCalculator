# tpkTritonCalculator

Run app: npm run build, npm run dev
<!-- Create exe: npx electron-builder --win -->

npm run build:exe
npm run build:trial



"build:trial:test": "npm run build && electron-builder --win --config.appId=com.triton.calculator.trialtest --config.productName=\"Triton Calculator Trial Test\" --config.directories.output=release-trial-test --config.extraMetadata.name=tpktritoncalculator-trial-test --config.extraMetadata.trialTestBuild=true",

"reset:trial:test": "node src/main/trialLicenseTest.js --reset",

npm run build:trial:test
npm run reset:trial:test