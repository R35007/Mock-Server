#! /usr/bin/env node
import chalk from "chalk";
import { MockServer } from ".";

var path = require("path");
const [_node, _mockserver, routePath, configPath, injectorsPath, middlewaresPath] = process.argv;


try {

  const parseUrl = (relativeUrl: string) => {
    if (relativeUrl && path.extname(parseUrl(relativeUrl)) && path.extname(parseUrl(relativeUrl)) === ".json") {
      return typeof relativeUrl === "string" ? decodeURIComponent(path.resolve(process.cwd(), relativeUrl)) : "./";
    };
    return;
  };

  const routes = parseUrl(routePath);
  const config = parseUrl(configPath);
  const injectors = parseUrl(injectorsPath);
  const middlewares = parseUrl(middlewaresPath);


  const mockServer = new MockServer(routes, config, middlewares, injectors);
  mockServer.launchServer();
} catch (err) {
  console.error("\n" + chalk.red(err.message) + "\n");
}
