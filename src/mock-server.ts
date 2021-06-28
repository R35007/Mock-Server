#! /usr/bin/env node
import axios from 'axios';
import chalk from "chalk";
import { MockServer } from ".";
import { UserConfig } from './model';
import * as yargs from 'yargs';
import * as path from 'path';

interface Options {
  [x: string]: unknown;
  routes: string;
  config: UserConfig;
  middlewares: string;
  injectors: string;
  store: string;
  port: number;
  static: string;
  _: (string | number)[];
  $0: string;
}

function parseCommandLine() {
  let options: Options = yargs.options({
    routes: { type: "string", alias: "r", default: "https://jsonplaceholder.typicode.com/db", description: "Path to routes" },
    config: { type: "string", alias: "c", description: "Path to Config file" },
    middlewares: { type: "string", alias: "m", description: "Path to Middlewares file. Note It must be a .js file" },
    injectors: { type: "string", alias: "i", description: "Path to Injectors file" },
    store: { type: "string", alias: "st", description: "Path to Store" },
    port: { type: "number", alias: "p", default: 3000, description: "Set port" },
    static: { type: "string", alias: "s", description: "Set static files directory" },
  }).argv as Options;

  if (options.port !== 3000 || options.static) {
    options.config = {
      staticUrl: options.static,
      port: options.port
    }
  }

  return options;
}

async function init() {
  try {

    let { routes, config, middlewares, injectors, store } = parseCommandLine();

    if (routes.startsWith("http")) {
      routes = await axios.get(routes).then(resp => resp.data).catch(_err => { });
    } else {
      routes = path.resolve(process.cwd(), routes);
    }

    config = typeof config === 'string' ? path.resolve(process.cwd(), config) : config;
    middlewares = middlewares && path.resolve(process.cwd(), middlewares);
    injectors = injectors && path.resolve(process.cwd(), injectors);
    store = store && path.resolve(process.cwd(), store);

    new MockServer(routes, config, middlewares, injectors, store).launchServer()
  } catch (err) {
    console.error("\n" + chalk.red(err.message) + "\n");
  }
}

init()