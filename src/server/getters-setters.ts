import chalk from "chalk";
import express from "express";
import { Server } from "http";
import * as _ from 'lodash';
import * as Defaults from './defaults';
import { GetData, GetValidDbOptions } from "./types/common.types";
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
  router!: express.Router;
  routes!: string[];

  initialDb!: ValidTypes.Db;

  #config!: ValidTypes.Config;
  #db!: ValidTypes.Db;
  #middlewares!: ValidTypes.Middlewares;
  #injectors!: ValidTypes.Injectors;
  #store!: ValidTypes.Store;
  #rewriters!: ValidTypes.Rewriters;

  constructor(config?: Params.Config) {
    console.log("\n" + chalk.blueBright("{^_^}/~ Hi!"));
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
    this.router = express.Router();
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

  setConfig(config?: Params.Config) {
    console.log("\n" + chalk.gray("Setting Config..."));
    this.#config = getValidConfig(config, this.#config.root);
    console.log(chalk.gray("Done."));
  }

  setRewriters(rewriters?: Params.Rewriters) {
    console.log("\n" + chalk.gray("Setting Rewriters..."));
    this.#rewriters = getValidRewriters(rewriters, this.#config.root);
    console.log(chalk.gray("Done."));
  }

  setMiddlewares(middleware?: Params.Middlewares) {
    console.log("\n" + chalk.gray("Setting Middleware..."));
    this.#middlewares = getValidMiddlewares(middleware, this.#config.root);
    console.log(chalk.gray("Done."));
  }

  setInjectors(injectors?: Params.Injectors) {
    console.log("\n" + chalk.gray("Setting Injectors..."));
    this.#injectors = getValidInjectors(injectors, this.#config.root);
    console.log(chalk.gray("Done."));
  }

  setStore(store?: Params.Store) {
    console.log("\n" + chalk.gray("Setting Store..."));
    this.#store = getValidStore(store, this.#config.root);
    console.log(chalk.gray("Done."));
  }

  setDb(db?: Params.Db, { reverse = this.config.reverse, mode = this.config.mode }: GetValidDbOptions = {}) {
    console.log("\n" + chalk.gray("Setting Db..."));
    this.#db = getValidDb(db, this.#injectors, this.#config.root, { reverse, mode });
    this.initialDb = _.cloneDeep(this.#db);
    console.log(chalk.gray("Done."));
  }
}