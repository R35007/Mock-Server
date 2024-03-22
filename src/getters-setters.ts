import chalk from 'chalk';
import express from 'express';
import type { Server } from 'http';
import * as _ from 'lodash';
import ora from 'ora';
import * as Defaults from './defaults';
import type { GetData, SetData, SetterOptions } from './types/common.types';
import type * as Params from './types/param.types';
import type * as ValidTypes from './types/valid.types';
import { getValidConfig, getValidInjectors, getValidMiddlewares, getValidStore } from './utils/validators';

export class GettersSetters {
  // port, address, listeningTo will be undefined when server is stopped
  port: number | undefined; // gives current running port.
  server: Server | undefined; //  gives current running server.
  address: string | undefined; // gives host ip address.
  listeningTo: string | undefined; // gives -> http://${host}:${port}/${base} -> http://localhost:3000/api

  app!: express.Application;
  routes!: string[];
  rewriterRoutes!: string[];
  initialDb!: ValidTypes.Db;

  #config!: ValidTypes.Config;
  #db!: ValidTypes.Db;
  #middlewares!: ValidTypes.Middlewares;
  #injectors!: ValidTypes.Injectors;
  #rewriters!: ValidTypes.Rewriters;
  #store!: ValidTypes.Store;

  /**
   * Constructs a new instance with optional configuration.
   * It sets the global quiet mode based on the provided config, suppresses terminal logs in test environments,
   * suppresses console logs if quiet is true, and initializes the instance with the given config.
   * @param {Params.Config} [config] - Optional configuration object.
   */
  constructor(config?: Params.Config) {
    global.quiet = typeof config === 'object' ? config.quiet : false;

    this.#suppressTerminalLogs(); // Suppress terminal logs on testing environments
    this.#suppressLogs(global.quiet); // Suppress console logs if quiet is set to true

    console.log(chalk.blueBright('\n{^_^}/~ Hi!'));
    this.init();
    config && this.setConfig(config);
  }

  // Suppress console logs if quiet is set to true
  #suppressTerminalLogs() {
    if (process.env.NODE_ENV === 'test') {
      global.originalWrite = process.stdout.write;
      process.stdout.write = () => false;
    } else {
      if (global.originalWrite) {
        process.stdout.write = global.originalWrite;
      }
    }
  }

  // Suppress console logs if quiet is set to true
  #suppressLogs(quiet: boolean) {
    if (quiet) {
      if (!global.consoleOriginal) global.consoleOriginal = { ...global.console };
      global.console = { ...global.console, log: () => {}, warn: () => {} };
    } else {
      if (global.consoleOriginal) global.console = { ...global.consoleOriginal };
      delete global.consoleOriginal;
    }
  }

  /**
   * Gets a deep clone of the server configuration.
   * @returns {ValidTypes.Config} A deep clone of the server configuration.
   */
  get config() {
    return _.cloneDeep(this.#config);
  }

  /**
   * Gets a deep clone of the database.
   * @returns {ValidTypes.Db} A deep clone of the database.
   */
  get db() {
    return _.cloneDeep(this.#db);
  }

  /**
   * Gets a deep clone of the middlewares configuration.
   * @returns {ValidTypes.Middlewares} A deep clone of the middlewares configuration.
   */
  get middlewares() {
    return _.cloneDeep(this.#middlewares);
  }

  /**
   * Gets a deep clone of the injectors configuration.
   * @returns {ValidTypes.Injectors} A deep clone of the injectors configuration.
   */
  get injectors() {
    return _.cloneDeep(this.#injectors);
  }

  /**
   * Gets a deep clone of the rewriters configuration.
   * @returns {ValidTypes.Rewriters} A deep clone of the rewriters configuration.
   */
  get rewriters() {
    return _.cloneDeep(this.#rewriters);
  }

  /**
   * Gets a deep clone of the store configuration.
   * @returns {ValidTypes.Store} A deep clone of the store configuration.
   */
  get store() {
    return _.cloneDeep(this.#store);
  }

  /**
   * Gets an object containing deep clones of various configurations and state properties.
   * @returns {GetData} An object with deep clones of config, db, injectors, middlewares, rewriters, and store.
   */
  get data(): GetData {
    return {
      config: this.config,
      db: this.db,
      injectors: this.injectors,
      middlewares: this.middlewares,
      rewriters: this.rewriters,
      store: this.store,
    } as GetData;
  }

  /**
   * Retrieves the database configuration for a specific route or the entire database.
   * @param {string | string[]} [routePath] - A single route path or an array of route paths to retrieve the database configuration for.
   * @returns {Object} The database configuration for the specified route(s) or the entire database if no route is specified.
   */
  getDb = (routePath?: string | string[]) => {
    if (!routePath) return this.#db;

    const routePaths = ([] as string[]).concat(routePath as string);
    if (routePaths.length === 1) return this.#db[routePaths[0]];

    return routePaths.reduce((res, route) => {
      return this.#db[route] ? { ...res, [route]: this.#db[route] } : res;
    }, {});
  };

  /**
   * Retrieves the rewriters configuration.
   * @returns {ValidTypes.Rewriters} The rewriters configuration.
   */
  getRewriters = () => this.#rewriters;

  /**
   * Retrieves the store configuration.
   * @returns {ValidTypes.Store} The store configuration.
   */
  getStore = () => this.#store;

  /**
   * Retrieves details about the server including the app instance, data, database, store, and routes.
   * @protected
   * @returns {Object} An object containing details about the server.
   */
  protected _getServerDetails = () => ({
    app: this.app,
    data: this.data,
    getDb: this.getDb,
    getStore: this.getStore,
    routes: this.routes,
  });

  /**
   * Initializes the server by clearing the server address, creating a new Express app, and setting default configurations.
   */
  init() {
    this.clearServerAddress();
    this.createExpressApp();
    this.setDefaults();
  }

  /**
   * Clears the server address information, setting the port, server, address, and listeningTo properties to undefined.
   */
  clearServerAddress() {
    this.port = undefined;
    this.server = undefined;
    this.address = undefined;
    this.listeningTo = undefined;
  }

  /**
   * Sets the default configurations for the server, including database, middlewares, injectors, rewriters, and store.
   */
  setDefaults() {
    this.setDefaultConfig();
    this.setDefaultDb();
    this.setDefaultMiddlewares();
    this.setDefaultInjectors();
    this.setDefaultRewriters();
    this.setDefaultStore();
  }

  /**
   * Sets the default configurations for the server, excluding the database.
   */
  setDefaultData() {
    this.setDefaultConfig();
    this.setDefaultMiddlewares();
    this.setDefaultInjectors();
    this.setDefaultStore();
  }

  /**
   * Sets the server's configurations based on the provided data object and options.
   * @param {SetData} [data={}] - The data object containing configurations to set.
   * @param {SetterOptions} [options={}] - Options for setting the configurations.
   */
  setData(data: SetData = {}, options: SetterOptions = {}) {
    data.config && this.setConfig(data.config, options);
    data.middlewares && this.setMiddlewares(data.middlewares, options);
    data.injectors && this.setInjectors(data.injectors, options);
    data.store && this.setStore(data.store, options);
  }

  /**
   * Sets the default configuration by deep cloning the default configuration object.
   */
  setDefaultConfig() {
    this.#config = _.cloneDeep(Defaults.Config);
  }

  /**
   * Sets the server's configuration, optionally merging with existing configurations.
   * @param {Params.Config} [config] - The configuration object to set.
   * @param {SetterOptions} [options={}] - Options for setting the configuration, including root, merge, and log.
   */
  setConfig(config?: Params.Config, { root = this.#config.root, merge, log = this.config.log }: SetterOptions = {}) {
    const spinner = !global.quiet && log && ora('Loading Config...').start();

    const oldConfig = this.#config || Defaults.Config;
    const newConfig = getValidConfig(config, { mockServer: this._getServerDetails(), root });

    this.#config = merge ? { ...Defaults.Config, ...oldConfig, ...newConfig } : { ...Defaults.Config, ...newConfig };

    global.quiet = this.#config.quiet;
    this.#suppressLogs(this.#config.quiet);

    spinner && spinner.stopAndPersist({ symbol: '✔', text: chalk.gray('Config Loaded.') });
  }

  /**
   * Sets the default database configuration by deep cloning the default database object.
   */
  setDefaultDb() {
    this.#db = _.cloneDeep(Defaults.Db);
    this.initialDb = _.cloneDeep(Defaults.Db);
  }

  /**
   * Sets the default middlewares configuration by deep cloning the default middlewares object.
   */
  setDefaultMiddlewares() {
    this.#middlewares = _.cloneDeep(Defaults.Middlewares);
  }

  /**
   * Sets the middlewares configuration, optionally merging with existing middlewares.
   * @param {Params.Middlewares} [middleware] - The middlewares configuration object to set.
   * @param {SetterOptions} [options={}] - Options for setting the middlewares, including root, merge, and log.
   */
  setMiddlewares(middleware?: Params.Middlewares, { root = this.#config.root, merge, log = this.config.log }: SetterOptions = {}) {
    const spinner = !global.quiet && log && ora('Loading Middlewares...').start();
    const oldMiddlewares = this.#middlewares;
    const newMiddlewares = getValidMiddlewares(middleware, { mockServer: this._getServerDetails(), root });
    this.#middlewares = merge ? { ...oldMiddlewares, ...newMiddlewares } : newMiddlewares;
    spinner && spinner.stopAndPersist({ symbol: '✔', text: chalk.gray('Middlewares Loaded.') });
  }

  /**
   * Sets the default injectors configuration by deep cloning the default injectors object.
   */
  setDefaultInjectors() {
    this.#injectors = _.cloneDeep(Defaults.Injectors);
  }

  /**
   * Sets the injectors configuration, optionally merging with existing injectors.
   * @param {Params.Injectors} [injectors] - The injectors configuration object to set.
   * @param {SetterOptions} [options={}] - Options for setting the injectors, including root, merge, and log.
   */
  setInjectors(injectors?: Params.Injectors, { root = this.#config.root, merge, log = this.config.log }: SetterOptions = {}) {
    const spinner = !global.quiet && log && ora('Loading Injectors...').start();
    const oldInjectors = this.#injectors;
    const newInjectors = getValidInjectors(injectors, { mockServer: this._getServerDetails(), root });
    this.#injectors = merge ? [...oldInjectors, ...newInjectors] : newInjectors;
    spinner && spinner.stopAndPersist({ symbol: '✔', text: chalk.gray('Injectors Loaded.') });
  }

  /**
   * Sets the default rewriters configuration by deep cloning the default rewriters object.
   */
  setDefaultRewriters() {
    this.#rewriters = _.cloneDeep(Defaults.Rewriters);
  }

  /**
   * Sets the default store configuration by deep cloning the default store object.
   */
  setDefaultStore() {
    this.#store = _.cloneDeep(Defaults.Store);
  }

  /**
   * Sets the store configuration, optionally merging with existing store data.
   * @param {Params.Store} [store] - The store configuration object to set.
   * @param {SetterOptions} [options={}] - Options for setting the store, including root, merge, and log.
   */
  setStore(store?: Params.Store, { root = this.#config.root, merge, log = this.config.log }: SetterOptions = {}) {
    const spinner = !global.quiet && log && ora('Loading Store...').start();
    const oldStore = this.#store;
    const newStore = getValidStore(store, { mockServer: this._getServerDetails(), root });
    this.#store = merge ? { ...oldStore, ...newStore } : newStore;
    spinner && spinner.stopAndPersist({ symbol: '✔', text: chalk.gray('Store Loaded.') });
  }

  /**
   * Creates a new Express application or uses the provided one, sets JSON spaces to 2 for formatting, and initializes routes.
   * @param {express.Application} [app] - An optional existing Express application to use.
   * @returns {express.Application} The Express application with initialized settings.
   */
  createExpressApp(app?: express.Application) {
    this.app = app || express().set('json spaces', 2);
    this.routes = [];
    this.rewriterRoutes = [];
    return this.app;
  }
}
