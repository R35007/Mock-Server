#! /usr/bin/env node
import axios from 'axios';
import chalk from "chalk";
import * as Watcher from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import MockServer from "../server";
import * as ParamTypes from '../server/types/param.types';
import { createSampleFiles } from "../server/utils";
import argv from './argv';

const init = async () => {
  let {
    db, config, middleware, injectors, store, rewriters, port, host,
    id, staticDir, base, noCors, noGzip, readOnly, cookieParser, bodyParser, sample, watch, snapshots, _: [source]
  } = argv();

  const _config: ParamTypes.Config = typeof config === 'string' ? path.resolve(process.cwd(), config) as ParamTypes.Config : {
    port, host, id, staticDir, base, noCors, noGzip, cookieParser, bodyParser, readOnly, root: process.cwd()
  } as ParamTypes.Config;

  if (sample) {
    createSampleFiles(process.cwd());
    const db = path.join(process.cwd(), 'db.json');
    const middleware = path.join(process.cwd(), 'middleware.js');
    const injectors = path.join(process.cwd(), 'injectors.json');
    const rewriters = path.join(process.cwd(), 'rewriters.json');
    const store = path.join(process.cwd(), 'store.json');

    console.log(chalk.gray('Sample files created !'));

    await startServer(snapshots, watch, db, middleware, injectors, rewriters, store, _config);
  } else {
    db = source || db;

    if (db) {
      if (db?.startsWith("http")) {
        console.log(chalk.gray(`\nLoading ${db}`));
        const _db = await axios.get(db).then(resp => resp.data).catch(err => {
          console.log(chalk.red(err.message));
          return;
        });
        if (!_db) return;
        db = _db;
        console.log(chalk.gray(`Done.`));
      } else {
        db = path.resolve(process.cwd(), db);
      }
    }
    middleware = middleware && path.resolve(process.cwd(), middleware);
    injectors = injectors && path.resolve(process.cwd(), injectors);
    store = store && path.resolve(process.cwd(), store);
    rewriters = rewriters && path.resolve(process.cwd(), rewriters);

    await startServer(snapshots, watch, db, middleware, injectors,
      rewriters, store, _config);
  }
}

const startServer = async (
  snapshots: string,
  watch: boolean,
  db?: string,
  middlewares?: string,
  injectors?: string,
  rewriters?: string,
  store?: string,
  _config?: ParamTypes.Config
) => {
  const mockServer = new MockServer(_config);
  const filesToWatch = ([
    _config,
    store,
    db,
    middlewares,
    injectors,
    rewriters,
  ]).filter(x => typeof x === 'string').filter(Boolean) as string[];

  try {
    if (watch) {
      const watcher = Watcher.watch(filesToWatch);
      watcher.on('change', async (_path, _event) => {
        try {
          console.log("\n" + chalk.yellow(_path) + chalk.gray(` has changed, reloading...`));
          mockServer.server && await mockServer.stopServer();
          !mockServer.server && await mockServer.launchServer(db, { middlewares, injectors, rewriters, store });
          console.log(chalk.gray('watching for changes...'));
          console.log(chalk.gray('Type s + enter at any time to create a snapshot of the database'));
        } catch (err) {
          console.error(err.message);
        }
      });
      !mockServer.server && await mockServer.launchServer(db, { injectors, middlewares, rewriters, store });
    } else {
      !mockServer.server && await mockServer.launchServer(db, { injectors, middlewares, rewriters, store });
    }
  } catch (err) {
    console.error(err.message);
  }

  // Catch and handle any error occurring in the server process
  process.on('uncaughtException', error => {
    if (error["errno"] === 'EADDRINUSE') {
      console.log(chalk.red(`Cannot bind to the port ${error["port"]}. Please specify another port number either through --port argument or through the config.json configuration file`));
    }
    else {
      console.log('Some error occurred', error);
    }
    process.exit(1);
  });

  process.stdin.on('error', () => {
    console.log(`  Error, can't read from stdin`);
    console.log(`  Creating a snapshot from the CLI won't be possible`);
  });
  process.stdin.setEncoding('utf8');

  // Snapshot
  console.log(chalk.gray('Type s + enter at any time to create a snapshot of the database'));
  process.stdin.on('data', chunk => {
    if (chunk.toString().trim().toLowerCase() === 's') {
      const filename = `db-${Date.now()}.json`;
      const file = path.join(snapshots, filename);
      fs.writeFileSync(file, JSON.stringify(mockServer.db, null, 2), 'utf-8');
      console.log(`Saved snapshot to ${path.relative(process.cwd(), file)}\n`);
    }
  });
}

init();