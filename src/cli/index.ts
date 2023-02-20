#! /usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import pleaseUpgradeNode from 'please-upgrade-node';
import MockServer from "../";
import chalk from "chalk";
import watcher from "chokidar";
import axios from "axios";
import ora from "ora";
import { LaunchServerOptions } from '../types/common.types';
import * as ParamTypes from '../types/param.types';
import { getCleanDb } from '../utils';
import argv, { Paths, Configs } from './argv';

const pkgStr = fs.readFileSync(path.join(__dirname, "../../package.json"), 'utf8');
const pkg = JSON.parse(pkgStr);

const args = argv(pkg);
const { _: [source], db = source, injectors, middlewares, store, rewriters, root, watch, snapshots, ...configArgs } = args;
const config = { ...configArgs, root: path.resolve(process.cwd(), root) };

global.quiet = config.quiet;

const mockServer = MockServer.Create(config);

pleaseUpgradeNode(pkg, {
  message: function (requiredVersion) {
    return chalk.red(`Please upgrade Node.\n@r35007/mock-server requires at least version ` + chalk.yellow(requiredVersion) + ` of Node.`)
  }
})

const getDataFromUrl = async (data?: string) => {
  try {
    if (!data) return;
    if (data.startsWith("http")) {
      const spinner = !global.quiet ? ora(`GET: ` + chalk.gray(data)).start() : false;
      try {
        const response = await axios.get(data).then(resp => resp.data);
        spinner && spinner.stopAndPersist({ symbol: chalk.green("✔"), text: chalk.green("GET: ") + chalk.gray(data) });
        return response;
      } catch (err: any) {
        spinner && spinner.stopAndPersist({ symbol: chalk.red("✖"), text: chalk.red(`GET: `) + chalk.gray(data) });
        process.stdout.write("\n" + chalk.red("Error: ") + chalk.yellow(err.message) + "\n");
        return;
      }
    } else {
      const resolvedPath = path.resolve(config.root, data);
      if (!fs.existsSync(resolvedPath)) {
        process.stdout.write("\n" + chalk.red("Invalid Path: ") + chalk.yellow(resolvedPath) + "\n");
        return;
      }
      return resolvedPath;
    }
  } catch (err: any) {
    console.error(chalk.red(err.message));
    return {};
  }
};

const uncaughtException = async (error, fileWatcher: watcher.FSWatcher) => {
  console.error(chalk.red('Something went wrong!'), error);
  await fileWatcher.close();
  process.exit(1);
}

const errorHandler = async (fileWatcher: watcher.FSWatcher) => {
  console.error(chalk.red(`Error, can't read from stdin`));
  console.error(chalk.red(`Creating a snapshot from the CLI won't be possible`));
  await fileWatcher.close();
  process.exit(1);
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
    } catch (err: any) {
      console.error(chalk.red(err.message));
    }
  });
}

const startServer = async (db: ParamTypes.Db, launchServerOptions: LaunchServerOptions) => {
  try {
    const server = await mockServer.launchServer(db, launchServerOptions);
    return server;
  } catch (err: any) {
    process.exit(1);
  }
}

const restartServer = async (db: ParamTypes.Db, launchServerOptions: LaunchServerOptions, changedPath: string) => {
  try {
    if (!mockServer.server) return;
    process.stdout.write(chalk.yellow("\n" + path.relative(process.cwd(), changedPath)) + chalk.gray(` has changed, reloading...\n`));
    await MockServer.Destroy(mockServer).then(() => startServer(db, launchServerOptions));
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}

const init = async () => {
  const _db = await getDataFromUrl(db);
  const _middlewares = await getDataFromUrl(middlewares);
  const _injectors = await getDataFromUrl(injectors);
  const _store = await getDataFromUrl(store);
  const _rewriters = await getDataFromUrl(rewriters);

  const launchServerOptions = {
    middlewares: _middlewares,
    injectors: _injectors,
    store: _store,
    rewriters: _rewriters
  };

  await startServer(_db, launchServerOptions);

  let fileWatcher: watcher.FSWatcher;

  if (watch) {
    const filesToWatch = [
      _db,
      _middlewares,
      _injectors,
      _store,
      _rewriters,
    ]
      .filter(Boolean)
      .filter(file => typeof file === 'string')
      .filter(file => fs.existsSync(file))
    fileWatcher = watcher.watch(filesToWatch);
    fileWatcher.on('change', (changedPath, _event) => restartServer(_db, launchServerOptions, changedPath));
  };

  getSnapshot(snapshots);

  process.on('uncaughtException', (error) => uncaughtException(error, fileWatcher));
  process.stdin.setEncoding('utf8');
  process.stdin.on('error', () => errorHandler(fileWatcher));
}

init();

// These configs are only meant for vscode Mock Server Extension and not for CLI
export type extensionConfigs = {
  environment: string,
  watchFiles: string[],
  ignoreFiles: string[],
  duplicates: boolean,
  openInside: boolean,
  showInfoMsg: boolean,
  statusBar: {
    show: "true" | "false",
    position: "Right" | "Left",
    priority: string | number
  }
}

export type CliOptions = Partial<Paths & Configs> & Partial<extensionConfigs>
