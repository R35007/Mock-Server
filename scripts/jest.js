`use strict`

// Do this as the first thing so that any code reading it knows the right env
process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';

const jest = require('jest');
const fs = require('fs');
const path = require('path');

const rootPath = path.resolve(__dirname, "../");

// returns a valid source folder or file until it given sourcePath exist
const getValidSourcePath = (sourcePath) => {
  if (fs.existsSync(sourcePath)) return sourcePath;
  const dir = path.dirname(sourcePath); // get folder of the sourcePath
  if (dir === path.resolve(__dirname, '../src/server')) return dir;
  return getValidSourcePath(dir);
}

const collectCoverageFromPath = (testFilePath) => {
  const sourceFilePath = testFilePath.replace("tests/server", "src/server").replace(".test.ts", ".ts");
  const validSourcePath = getValidSourcePath(sourceFilePath);
  const relativeSourcePath = path.relative(rootPath, validSourcePath).replace(/\\/g, '/');

  const isFile = fs.statSync(validSourcePath).isFile();

  return isFile ? relativeSourcePath : relativeSourcePath + "/**/*.ts";
}

const startTesting = () => {
  const args = process.argv.slice(2);
  const jestArgs = [...args];

  const testPath = jestArgs[0].replace(/\\/g, "/");
  jestArgs[0] = testPath

  // If collectCoverage is true and collectCoverageFrom is not specified then set relative collectCoverageFrom path
  if (jestArgs.some(arg => arg.includes("--collectCoverage=true")) && !jestArgs.some(arg => arg.includes("--collectCoverageFrom="))) {
    const collectCoverageFrom = collectCoverageFromPath(testPath);
    const collectCoverageFromArg = "--collectCoverageFrom=" + collectCoverageFrom;
    console.log("\n", collectCoverageFromArg);
    jestArgs.splice(2, 0, collectCoverageFromArg)
  }

  console.log("\n");

  jest.run(jestArgs, rootPath)
}

startTesting();