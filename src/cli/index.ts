#! /usr/bin/env node
import axios from 'axios';
import * as Watcher from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import MockServer from "../server";
import * as ParamTypes from '../server/types/param.types';
import argv from './argv';
import ora from 'ora';
import { LaunchServerOptions } from '../server/types/common.types';

let chalk = require("chalk");

const getDataFromUrl = async (data?: string, log?: boolean) => {
  try {
    if (!data) return;
    if (data.startsWith("http")) {
      const spinner = log ? ora(chalk.yellow(data)).start() : false;
      const response = await axios.get(data).then(resp => resp.data).catch(_err => { });
      spinner && spinner.stopAndPersist({ symbol: "✔", text: `GET: ${chalk.gray(data)}` });
      return response;
    } else {
      const resolvedPath = path.resolve(process.cwd(), data);
      if (!fs.existsSync(resolvedPath)) {
        console.error(chalk.red(`Invalid Path : ${resolvedPath}`));
        process.exit(1);
      }
      return resolvedPath;
    }
  } catch (err) {
    console.error(chalk.red(err));
    process.exit(1);
  }
};

const restartServer = async (changedPath: string, db: ParamTypes.Db, launchServerOptions: LaunchServerOptions, mockServer: MockServer) => {
  try {
    console.log(chalk.yellow("\n" + path.relative(process.cwd(), changedPath)) + chalk.gray(` has changed, reloading...\n`));
    mockServer.server && await mockServer.stopServer();
    await mockServer.resetServer();
    !mockServer.server && await mockServer.launchServer(db, launchServerOptions);
    console.log(chalk.gray('watching for changes...'));
    console.log(chalk.gray('Type s + enter at any time to create a snapshot of the database.'));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

const uncaughtException = (error) => {
  if (error["errno"] === 'EADDRINUSE') {
    console.error(chalk.red("\nServer already listening to port : ") + chalk.yellow(error["port"]));
    console.error(chalk.red(`Please specify another port number either through --port argument or through the config.json configuration file`));
    process.exit(1);
  };
  console.error(chalk.red('Something went wrong!'), error);
  process.exit(1);
}

const errorHandler = () => {
  console.error(chalk.red(`Error, can't read from stdin`));
  console.error(chalk.red(`Creating a snapshot from the CLI won't be possible`));
}

const watchForSnapshot = (snapshots, mockServer) => {
  console.log(chalk.blue('Type s + enter at any time to create a snapshot of the database'));
  process.stdin.on('data', chunk => {
    if (chunk.toString().trim().toLowerCase() !== 's') return;
    const filename = `db-${Date.now()}.json`;
    const file = path.join(snapshots, filename);
    fs.writeFileSync(file, JSON.stringify(mockServer.db, null, 2), 'utf-8');
    console.log(chalk.green('Saved snapshot to ') + `${path.relative(process.cwd(), file)}\n`);
  });
}

const init = async () => {
  const args = argv();
  const { _: [source], config, db = source, injectors, middlewares, store, rewriters, watch, snapshots, quite, ...configArgs } = args;

  const log = !quite;
  if (quite) {
    const chalkColors = { green: chalk.green, blue: chalk.blue };
    chalk = { ...chalkColors, gray: () => '', yellow: () => '' } as any;
  }

  const mockServer = new MockServer({ rootPath: process.cwd() });

  const _config = typeof config === 'string' ? await getDataFromUrl(config, log) : { ...configArgs, rootPath: process.cwd() };
  mockServer.setConfig(_config, { log });

  const _db = await getDataFromUrl(db, log);
  const _middlewares = await getDataFromUrl(middlewares, log);
  const _injectors = await getDataFromUrl(injectors, log);
  const _store = await getDataFromUrl(store, log);
  const _rewriters = await getDataFromUrl(rewriters, log);

  const launchServerOptions = {
    middlewares: _middlewares,
    injectors: _injectors,
    store: _store,
    rewriters: _rewriters,
    log
  }
  try {
    await mockServer.launchServer(_db, launchServerOptions);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  const filesToWatch = ([_config, _store, _db, _middlewares, _injectors, _rewriters])
    .filter(x => typeof x === 'string').filter(Boolean) as string[];

  if (watch) {
    const watcher = Watcher.watch(filesToWatch);
    watcher.on('change', (changedPath, _event) => restartServer(changedPath, _db, launchServerOptions, mockServer));
  }

  process.on('uncaughtException', uncaughtException);
  process.stdin.setEncoding('utf8');
  process.stdin.on('error', errorHandler);

  watchForSnapshot(snapshots, mockServer);
}

init();