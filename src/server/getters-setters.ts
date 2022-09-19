import chalk from "chalk";
import express from "express";
import { Server } from "http";
import * as _ from 'lodash';
import * as Defaults from './defaults';
import { GetData, SetData, SetterOptions } from "./types/common.types";
import * as Params from "./types/param.types";
import * as ValidTypes from "./types/valid.types";
import { getValidConfig, getValidInjectors, getValidMiddlewares, getValidStore } from './utils/validators';
import ora from 'ora';

export class GettersSetters {

  // port, address, listeningTo will be undefined when server is stopped
  port: number | undefined; // gives current running port.
  server: Server | undefined; //  gives current running server.
  address: string | undefined; // gives host ip address.
  listeningTo: string | undefined; // gives -> http://${host}:${port}/${base} -> http://localhost:3000/api

  app!: express.Application;
  routes!: string[];

  initialDb!: ValidTypes.Db;

  #config!: ValidTypes.Config;
  #db!: ValidTypes.Db;
  #middlewares!: ValidTypes.Middlewares;
  #injectors!: ValidTypes.Injectors;
  #store!: ValidTypes.Store;
  #rewriters!: ValidTypes.Rewriters;

  constructor(config?: Params.Config) {
    global.quiet = false;
    console.log(chalk.blueBright("\n{^_^}/~ Hi!"));
    this.init();
    config && this.setConfig(config);
  }

  get config() { return _.cloneDeep(this.#config) };
  get db() { return _.cloneDeep(this.#db) };
  get middlewares() { return _.cloneDeep(this.#middlewares) };
  get injectors() { return _.cloneDeep(this.#injectors) };
  get rewriters() { return _.cloneDeep(this.#rewriters) };
  get store() { return _.cloneDeep(this.#store) };
  get data(): GetData {
    return {
      db: this.db,
      injectors: this.injectors,
      middlewares: this.middlewares,
      store: this.store,
      rewriters: this.rewriters,
      config: this.config
    } as GetData;
  };

  getDb = (routePath?: string | string[]) => {
    if (!routePath) return this.#db;

    const routePaths = ([] as string[]).concat(routePath as string);
    if (routePaths.length === 1) return this.#db[routePaths[0]];

    return routePaths.reduce((res, route) => {
      return this.#db[route] ? { ...res, [route]: this.#db[route] } : res;
    }, {});
  };
  getRewriters = () => this.#rewriters;
  getStore = () => this.#store;

  protected _getServerDetails = () => ({
    app: this.app,
    routes: this.routes,
    data: this.data,
    getDb: this.getDb,
    getStore: this.getStore
  })

  init() {
    this.port = undefined;
    this.server = undefined;
    this.address = undefined;
    this.listeningTo = undefined;

    this.app = express().set("json spaces", 2);
    this.routes = [];

    this.#config = _.cloneDeep(Defaults.Config);
    this.#middlewares = _.cloneDeep(Defaults.Middlewares);
    this.#injectors = _.cloneDeep(Defaults.Injectors);
    this.#rewriters = _.cloneDeep(Defaults.Rewriters);
    this.#db = _.cloneDeep(Defaults.Db);
    this.#store = _.cloneDeep(Defaults.Store);

    this.initialDb = _.cloneDeep(Defaults.Db);
  }

  setData(data: SetData = {}, options: SetterOptions = {}) {
    data.config && this.setConfig(data.config, options);
    data.middlewares && this.setMiddlewares(data.middlewares, options);
    data.injectors && this.setInjectors(data.injectors, options);
    data.store && this.setStore(data.store, options);
  };

  setConfig(config?: Params.Config, { root = this.#config.root, merge, log }: SetterOptions = {}) {
    const spinner = !global.quiet && log && ora('Loading Config...').start();
    const oldConfig = this.#config;
    const newConfig = getValidConfig(config, { root, mockServer: this._getServerDetails() });
    this.#config = merge ? { ...oldConfig, ...newConfig } : newConfig;


    global.quiet = this.#config.quiet;
    if (this.#config.quiet) {
      if (!global.consoleOriginal) global.consoleOriginal = { ...global.console };
      global.console = { ...global.console, log: () => { }, warn: () => { } };
    } else {
      if (global.consoleOriginal) global.console = { ...global.consoleOriginal };
      delete global.consoleOriginal
    };

    spinner && spinner.stopAndPersist({ symbol: "✔", text: chalk.gray("Config Loaded.") });
  }

  setMiddlewares(middleware?: Params.Middlewares, { root = this.#config.root, merge, log }: SetterOptions = {}) {
    const spinner = !global.quiet && log && ora('Loading Middlewares...').start();
    const oldMiddlewares = this.#middlewares;
    const newMiddlewares = getValidMiddlewares(middleware, { root, mockServer: this._getServerDetails() });
    this.#middlewares = merge ? { ...oldMiddlewares, ...newMiddlewares } : newMiddlewares;
    spinner && spinner.stopAndPersist({ symbol: "✔", text: chalk.gray("Middlewares Loaded.") });
  }

  setInjectors(injectors?: Params.Injectors, { root = this.#config.root, merge, log }: SetterOptions = {}) {
    const spinner = !global.quiet && log && ora('Loading Injectors...').start();
    const oldInjectors = this.#injectors;
    const newInjectors = getValidInjectors(injectors, { root, mockServer: this._getServerDetails() });
    this.#injectors = merge ? [...oldInjectors, ...newInjectors] : newInjectors;
    spinner && spinner.stopAndPersist({ symbol: "✔", text: chalk.gray("Injectors Loaded.") });
  }

  setStore(store?: Params.Store, { root = this.#config.root, merge, log }: SetterOptions = {}) {
    const spinner = !global.quiet && log && ora('Loading Store...').start();
    const oldStore = this.#store;
    const newStore = getValidStore(store, { root, mockServer: this._getServerDetails() });
    this.#store = merge ? { ...oldStore, ...newStore } : newStore;
    spinner && spinner.stopAndPersist({ symbol: "✔", text: chalk.gray("Store Loaded.") });
  }
}