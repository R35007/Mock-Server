#! /usr/bin/env node
import axios from 'axios';
import chalk from "chalk";
import * as path from 'path';
import { MockServer } from "../server";
import { User_Config } from '../server/model';
import argv from './argv';

const init = async () => {
  try {

    let { routes, config, middlewares, injectors, store, rewriter,
      port, host, id, staticDir, base, noCors, noGzip, readOnly, _: [source]
    } = argv();

    routes = source || routes;

    if (routes.startsWith("http")) {
      routes = await axios.get(routes).then(resp => resp.data).catch(_err => undefined);
    } else {
      routes = path.resolve(process.cwd(), routes);
    }

    const _config = typeof config === 'string' ? path.resolve(process.cwd(), config) : {
      port, host, id, staticDir, base, noCors, noGzip, readOnly, root: process.cwd()
    } as User_Config;
    middlewares = middlewares && path.resolve(process.cwd(), middlewares);
    injectors = injectors && path.resolve(process.cwd(), injectors);
    store = store && path.resolve(process.cwd(), store);
    rewriter = rewriter && path.resolve(process.cwd(), rewriter);

    new MockServer(routes, _config, middlewares, injectors, store, rewriter).launchServer()
  } catch (err) {
    console.error("\n" + chalk.red(err.message) + "\n");
  }
}

init()