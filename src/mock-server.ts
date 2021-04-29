#! /usr/bin/env node
import chalk from "chalk";
import { MockServer } from ".";

var path = require("path");
const [_node, _mockserver, routePath, configPath, injectorsPath, globalsPath, middlewaresPath] = process.argv;


try {

  const parseUrl = (relativeUrl: string) => {
    if (relativeUrl && path.extname(parseUrl(relativeUrl)) && path.extname(parseUrl(relativeUrl)) === ".json") {
      return typeof relativeUrl === "string" ? decodeURIComponent(path.resolve(process.cwd(), relativeUrl)) : "./";
    };
    return;
  };

  const routes = parseUrl(routePath);
  const config = parseUrl(configPath);
  const globals = parseUrl(injectorsPath);
  const injectors = parseUrl(globalsPath);
  const middlewares = parseUrl(middlewaresPath);


  const mockServer = new MockServer(routes, config, globals, injectors, middlewares);
  mockServer.launchServer();
} catch (err) {
  console.error("\n" + chalk.red(err.message) + "\n");
}
