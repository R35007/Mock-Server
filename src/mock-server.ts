#! /usr/bin/env node
import chalk from "chalk";
import { MockServer } from ".";

var path = require("path");
const [_node, _mockserver, routePath, configPath, injectorsPath, middlewaresPath, storePath] = process.argv;


try {

  const parseUrl = (relativeUrl: string) => {
    if (relativeUrl && path.extname(parseUrl(relativeUrl)) && path.extname(parseUrl(relativeUrl)) === ".json") {
      return typeof relativeUrl === "string" ? decodeURIComponent(path.resolve(process.cwd(), relativeUrl)) : "./";
    };
    return;
  };

  const routes = parseUrl(routePath);
  const config = parseUrl(configPath);
  const middlewares = parseUrl(middlewaresPath);
  const injectors = parseUrl(injectorsPath);
  const store = parseUrl(storePath);


  const mockServer = new MockServer(routes, config, middlewares, injectors, store);
  mockServer.launchServer();
} catch (err) {
  console.error("\n" + chalk.red(err.message) + "\n");
}
