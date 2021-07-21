#! /usr/bin/env node
import axios from 'axios';
import chalk from "chalk";
import * as path from 'path';
import * as yargs from 'yargs';
import { MockServer } from "../server";
import { UserConfig } from '../server/model';

interface Options {
  [x: string]: unknown;
  routes: string;
  config: UserConfig;
  middlewares: string;
  injectors: string;
  store: string;
  port: number;
  static: string;
  r: string;
  c: UserConfig;
  m: string;
  i: string;
  st: string;
  p: number;
  s: string;
  _: (string | number)[];
  $0: string;
}

function parseCommandLine() {
  let options: Options = yargs.options({
    r: { type: "string", alias: "routes", description: "Path to routes" },
    c: { type: "string", alias: "config", description: "Path to Config file" },
    m: { type: "string", alias: "middlewares", description: "Path to Middlewares file. Note It must be a .js file" },
    i: { type: "string", alias: "injectors", description: "Path to Injectors file" },
    st: { type: "string", alias: "store", description: "Path to Store" },
    p: { type: "number", alias: "port", default: 3000, description: "Set port" },
    s: { type: "string", alias: "static", description: "Set static files directory" },
  }).argv as Options;

  if (options.port !== 3000 || options.static) {
    options.config = {
      static: options.static,
      port: options.port
    }
  }

  return options;
}

async function init() {
  try {

    let { routes, config, middlewares, injectors, store } = parseCommandLine();

    if (routes.startsWith("http")) {
      routes = await axios.get(routes).then(resp => resp.data).catch(_err => undefined);
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