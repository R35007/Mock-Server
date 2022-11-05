#! /usr/bin/env node
import axios from 'axios';
import chalk from "chalk";
import * as Watcher from 'chokidar';
import * as fs from 'fs';
import ora from 'ora';
import * as path from 'path';
import pleaseUpgradeNode from 'please-upgrade-node';
import MockServer from "../server";
import { LaunchServerOptions } from '../server/types/common.types';
import * as ParamTypes from '../server/types/param.types';
import { getCleanDb } from '../server/utils';
import argv from './argv';

const pkgStr = fs.readFileSync(path.join(__dirname, "../../package.json"), 'utf8');
const pkg = JSON.parse(pkgStr);

let mockServer: MockServer;

pleaseUpgradeNode(pkg, {
  message: function (requiredVersion) {
    return chalk.red(`Please upgrade Node.\n@r35007/mock-server requires at least version ` + chalk.yellow(requiredVersion) + ` of Node.`)
  }
})

const getDataFromUrl = async (data?: string, root?: string) => {
  try {
    if (!data) return;
    if (data.startsWith("http")) {
      const spinner = !global.quiet ? ora(`GET: ` + chalk.gray(data)).start() : false;
      try {
        const response = await axios.get(data).then(resp => resp.data);
        spinner && spinner.stopAndPersist({ symbol: chalk.green("✔"), text: chalk.green("GET: ") + chalk.gray(data) });
        return response;
      } catch (err) {
        spinner && spinner.stopAndPersist({ symbol: chalk.red("✖"), text: chalk.red(`GET: `) + chalk.gray(data) });
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    } else {
      const resolvedPath = path.resolve(root!, data);
      if (!fs.existsSync(resolvedPath)) {
        console.error(chalk.red(`Invalid Path : ${resolvedPath}`));
        process.exit(1);
      }
      return resolvedPath;
    }
  } catch (err) {
    console.error(chalk.red(err.message));
    process.exit(1);
  }
};

const restartServer = async (changedPath: string, db: ParamTypes.Db, launchServerOptions: LaunchServerOptions) => {
  try {
    process.stdout.write(chalk.yellow("\n" + path.relative(process.cwd(), changedPath)) + chalk.gray(` has changed, reloading...\n`));
    await MockServer.Destroy(mockServer);
    !mockServer.server && await mockServer.launchServer(db, launchServerOptions);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

const uncaughtException = (error) => {
  console.error(chalk.red('Something went wrong!'), error);
  process.exit(1);
}

const errorHandler = () => {
  console.error(chalk.red(`Error, can't read from stdin`));
  console.error(chalk.red(`Creating a snapshot from the CLI won't be possible`));
}

const getSnapshot = (snapshots) => {
  process.stdout.write("\n" + chalk.gray('Type s + enter at any time to create a snapshot of the database') + "\n");
  process.stdin.on('data', chunk => {
    try {
      if (chunk.toString().trim().toLowerCase() !== 's') return;
      const filename = `db-${Date.now()}.json`;
      const file = path.join(snapshots, filename);
      const cleanDb = getCleanDb(mockServer.db, mockServer.config.dbMode);
      fs.writeFileSync(file, JSON.stringify(cleanDb, null, 2), 'utf-8');
      console.log(chalk.green('Saved snapshot to ') + `${path.relative(process.cwd(), file)}\n`);
    } catch (err) {
      console.error(chalk.red(err.message));
    }
  });
}

const init = async () => {
  const args = argv(pkg);
  const { _: [source], db = source, injectors, middlewares, store, rewriters, root, watch, snapshots, log, ...configArgs } = args;

  const _root = path.resolve(process.cwd(), root);

  const _config = { ...configArgs, root: _root };
  mockServer = new MockServer(_config);
  global.quiet = _config.quiet;

  const _db = await getDataFromUrl(db, _root);
  const _middlewares = await getDataFromUrl(middlewares, _root);
  const _injectors = await getDataFromUrl(injectors, _root);
  const _store = await getDataFromUrl(store, _root);
  const _rewriters = await getDataFromUrl(rewriters, _root);

  const launchServerOptions = {
    middlewares: _middlewares,
    injectors: _injectors,
    store: _store,
    rewriters: _rewriters,
    log
  };

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
    watcher.on('change', (changedPath, _event) => restartServer(changedPath, _db, launchServerOptions));
  }

  getSnapshot(snapshots);

  process.on('uncaughtException', uncaughtException);
  process.stdin.setEncoding('utf8');
  process.stdin.on('error', errorHandler);
}

init();