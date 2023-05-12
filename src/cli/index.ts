#! /usr/bin/env node
import axios from 'axios';
import chalk from 'chalk';
import watcher from 'chokidar';
import * as fs from 'fs';
import * as fsx from 'fs-extra';
import ora from 'ora';
import * as path from 'path';
import pleaseUpgradeNode from 'please-upgrade-node';
import updateNotifier from 'update-notifier-cjs';
import MockServer from '../';
import type { LaunchServerOptions } from '../types/common.types';
import type * as ParamTypes from '../types/param.types';
import { getCleanDb } from '../utils';
import type { Configs, Paths } from './argv';
import argv from './argv';

const pkgStr = fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8');
const pkg = JSON.parse(pkgStr);

updateNotifier({ pkg }).notify();
pleaseUpgradeNode(pkg, {
  message: function (requiredVersion) {
    return chalk.red('Please upgrade Node.\n@r35007/mock-server requires at least version ' + chalk.yellow(requiredVersion) + ' of Node.');
  },
});

const getDataFromUrl = async (root: string, data?: string) => {
  try {
    if (!data) return;
    if (data.startsWith('http')) {
      const spinner = !global.quiet ? ora('GET: ' + chalk.gray(data)).start() : false;
      try {
        const response = await axios.get(data).then((resp) => resp.data);
        spinner && spinner.stopAndPersist({ symbol: chalk.green('✔'), text: chalk.green('GET: ') + chalk.gray(data) });
        return response;
      } catch (err: any) {
        spinner && spinner.stopAndPersist({ symbol: chalk.red('✖'), text: chalk.red('GET: ') + chalk.gray(data) });
        process.stdout.write('\n' + chalk.red('Error: ') + chalk.yellow(err.message) + '\n');
        return;
      }
    } else {
      const resolvedPath = path.resolve(root, data);
      if (!fs.existsSync(resolvedPath)) {
        process.stdout.write('\n' + chalk.red('Invalid Path: ') + chalk.yellow(resolvedPath) + '\n');
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
};

const errorHandler = async (fileWatcher: watcher.FSWatcher) => {
  console.error(chalk.red('Error, cant read from stdin'));
  console.error(chalk.red(`Creating a snapshot from the CLI wonn't be possible`));
  await fileWatcher.close();
  process.exit(1);
};

const getSnapshot = (mockServer: MockServer, snapshots) => {
  process.stdout.write('\n' + chalk.gray('Type s + enter at any time to create a snapshot of the database') + '\n');
  process.stdin.on('data', (chunk) => {
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
};

const startServer = async (mockServer: MockServer, db: ParamTypes.Db, launchServerOptions: LaunchServerOptions) => {
  try {
    const server = await mockServer.launchServer(db, launchServerOptions);
    return server;
  } catch (err: any) {
    process.exit(1);
  }
};

const restartServer = async (mockServer: MockServer, db: ParamTypes.Db, launchServerOptions: LaunchServerOptions, changedPath: string) => {
  try {
    if (!mockServer.server) return;
    process.stdout.write(chalk.yellowBright('\n' + path.relative(process.cwd(), changedPath)) + chalk.gray(' has changed, reloading...\n'));
    await MockServer.Destroy(mockServer).then(() => startServer(mockServer, db, launchServerOptions));
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
};

const init = async () => {
  const args = await argv(pkg);

  if (args.init) {
    fsx.copy(path.join(__dirname, '../../samples'), path.resolve(process.cwd()));
    return;
  }

  const {
    _: [source],
    db = source,
    injectors,
    middlewares,
    store,
    rewriters,
    root,
    watch,
    snapshots,
    ...configArgs
  } = args;
  const config = { ...configArgs, root: path.resolve(process.cwd(), root) };

  global.quiet = config.quiet;

  const mockServer = new MockServer(config);

  const _db = await getDataFromUrl(config.root, db);
  const _middlewares = await getDataFromUrl(config.root, middlewares);
  const _injectors = await getDataFromUrl(config.root, injectors);
  const _store = await getDataFromUrl(config.root, store);
  const _rewriters = await getDataFromUrl(config.root, rewriters);

  const launchServerOptions = {
    injectors: _injectors,
    middlewares: _middlewares,
    rewriters: _rewriters,
    store: _store,
  };

  await startServer(mockServer, _db, launchServerOptions);

  let fileWatcher: watcher.FSWatcher;

  if (watch) {
    const filesToWatch = [_db, _middlewares, _injectors, _store, _rewriters]
      .filter(Boolean)
      .filter((file) => typeof file === 'string')
      .filter((file) => fs.existsSync(file));
    fileWatcher = watcher.watch(filesToWatch);
    fileWatcher.on('change', (changedPath) => restartServer(mockServer, _db, launchServerOptions, changedPath));
  }

  getSnapshot(mockServer, snapshots);

  process.on('uncaughtException', (error) => uncaughtException(error, fileWatcher));
  process.stdin.setEncoding('utf8');
  process.stdin.on('error', () => errorHandler(fileWatcher));
};

init();

// These configs are only meant for vscode Mock Server Extension and not for CLI
export type extensionConfigs = {
  environment: string;
  watchFiles: string[];
  ignoreFiles: string[];
  duplicates: boolean;
  openInside: boolean;
  showInfoMsg: boolean;
  statusBar: {
    show: 'true' | 'false';
    position: 'Right' | 'Left';
    priority: string | number;
  };
};

export type CliOptions = Partial<Paths & Configs> & Partial<extensionConfigs>;
