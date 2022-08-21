import chalk from "chalk";
import express from "express";
import { Server } from "http";
import * as _ from 'lodash';
import * as Defaults from './defaults';
import { GetData } from "./types/common.types";
import * as Params from "./types/param.types";
import * as ValidTypes from "./types/valid.types";
import { getValidConfig, getValidDb, getValidInjectors, getValidMiddlewares, getValidRewriters, getValidStore } from './utils/validators';

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
    console.log("\n" + chalk.blueBright("{^_^}/~ Hi!") + "\n");
    this.init();
    this.setConfig(config);
  }

  get config() { return _.cloneDeep(this.#config) };
  get db() { return _.cloneDeep(this.#db) };
  get middlewares() { return _.cloneDeep(this.#middlewares) };
  get injectors() { return _.cloneDeep(this.#injectors) };
  get rewriters() { return _.cloneDeep(this.#rewriters) };
  get store() { return _.cloneDeep(this.#store) };

  protected _getDb = () => this.#db;
  protected _getStore = () => this.#store;

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

  setData(
    db?: Params.Db,
    injectors?: Params.Injectors,
    middlewares?: Params.Middlewares,
    rewriters?: Params.Rewriters,
    store?: Params.Store,
    config?: Params.Config,
  ) {
    !_.isEmpty(config) && this.setConfig(config);
    !_.isEmpty(rewriters) && this.setRewriters(rewriters);
    !_.isEmpty(middlewares) && this.setMiddlewares(middlewares);
    !_.isEmpty(injectors) && this.setInjectors(injectors);
    !_.isEmpty(store) && this.setStore(store);
    !_.isEmpty(db) && this.setDb(db);
  };

  get data(): GetData {
    return {
      db: this.db,
      injectors: this.injectors,
      middlewares: this.middlewares,
      rewriters: this.rewriters,
      store: this.store,
      config: this.config
    } as GetData;
  };

  setConfig(config?: Params.Config, merge?: boolean) {
    console.log(chalk.gray("Setting Config..."));
    const oldConfig = this.#config;
    const newConfig = getValidConfig(config, this.#config.root);
    this.#config = merge ? { ...oldConfig, ...newConfig } : newConfig;
    console.log(chalk.gray("Done."));
  }

  setRewriters(rewriters?: Params.Rewriters, merge?: boolean) {
    console.log(chalk.gray("Setting Rewriters..."));
    const oldRewriters = this.#rewriters;
    const newRewriters = getValidRewriters(rewriters, this.#config.root);
    this.#rewriters = merge ? { ...oldRewriters, ...newRewriters } : newRewriters;
    console.log(chalk.gray("Done."));
  }

  setMiddlewares(middleware?: Params.Middlewares, merge?: boolean) {
    console.log(chalk.gray("Setting Middleware..."));
    const oldMiddlewares = this.#middlewares;
    const newMiddlewares = getValidMiddlewares(middleware, this.#config.root);
    this.#middlewares = merge ? { ...oldMiddlewares, ...newMiddlewares } : newMiddlewares;
    console.log(chalk.gray("Done."));
  }

  setInjectors(injectors?: Params.Injectors, merge?: boolean) {
    console.log(chalk.gray("Setting Injectors..."));
    const oldInjectors = this.#injectors;
    const newInjectors = getValidInjectors(injectors, this.#config.root);
    this.#injectors = merge ? [...oldInjectors, ...newInjectors] : newInjectors;
    console.log(chalk.gray("Done."));
  }

  setStore(store?: Params.Store, merge?: boolean) {
    console.log(chalk.gray("Setting Store..."));
    const oldStore = this.#store;
    const newStore = getValidStore(store, this.#config.root);
    this.#store = merge ? { ...oldStore, ...newStore } : newStore;
    console.log(chalk.gray("Done."));
  }

  setDb(db?: Params.Db, merge?: boolean) {
    console.log(chalk.gray("Setting Db..."));
    const oldDb = this.#db;
    const newDb = getValidDb(
      db,
      this.#injectors,
      this.#config.root,
      { reverse: this.config.reverse, dbMode: this.config.dbMode }
    );
    this.#db = merge ? { ...oldDb, ...newDb } : newDb;
    this.initialDb = _.cloneDeep(this.#db);
    console.log(chalk.gray("Done."));
  }
}