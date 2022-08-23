import chalk from "chalk";
import express from "express";
import { Server } from "http";
import * as _ from 'lodash';
import * as Defaults from './defaults';
import { GetData, SetData, SetterOptions } from "./types/common.types";
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

  getDb = () => this.#db;
  getStore = () => this.#store;

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
    !_.isEmpty(data.config) && this.setConfig(data.config, options);
    !_.isEmpty(data.rewriters) && this.setRewriters(data.rewriters, options);
    !_.isEmpty(data.middlewares) && this.setMiddlewares(data.middlewares, options);
    !_.isEmpty(data.injectors) && this.setInjectors(data.injectors, options);
    !_.isEmpty(data.store) && this.setStore(data.store, options);
    !_.isEmpty(data.db) && this.setDb(data.db, options);
  };

  setConfig(config?: Params.Config, { rootPath = this.#config.root, merge, mockServer }: SetterOptions = {}) {
    const oldConfig = this.#config;
    const newConfig = getValidConfig(config, { rootPath, mockServer });
    this.#config = merge ? { ...oldConfig, ...newConfig } : newConfig;
  }

  setRewriters(rewriters?: Params.Rewriters, { rootPath = this.#config.root, merge, mockServer }: SetterOptions = {}) {
    const oldRewriters = this.#rewriters;
    const newRewriters = getValidRewriters(rewriters, { rootPath, mockServer });
    this.#rewriters = merge ? { ...oldRewriters, ...newRewriters } : newRewriters;
  }

  setMiddlewares(middleware?: Params.Middlewares, { rootPath = this.#config.root, merge, mockServer }: SetterOptions = {}) {
    const oldMiddlewares = this.#middlewares;
    const newMiddlewares = getValidMiddlewares(middleware, { rootPath, mockServer });
    this.#middlewares = merge ? { ...oldMiddlewares, ...newMiddlewares } : newMiddlewares;
  }

  setInjectors(injectors?: Params.Injectors, { rootPath = this.#config.root, merge, mockServer }: SetterOptions = {}) {
    const oldInjectors = this.#injectors;
    const newInjectors = getValidInjectors(injectors, { rootPath, mockServer });
    this.#injectors = merge ? [...oldInjectors, ...newInjectors] : newInjectors;
  }

  setStore(store?: Params.Store, { rootPath = this.#config.root, merge, mockServer }: SetterOptions = {}) {
    const oldStore = this.#store;
    const newStore = getValidStore(store, { rootPath, mockServer });
    this.#store = merge ? { ...oldStore, ...newStore } : newStore;
  }

  setDb(db?: Params.Db,
    {
      injectors = this.#injectors,
      rootPath = this.#config.root,
      reverse = this.#config.reverse,
      dbMode = this.#config.dbMode,
      merge, 
      mockServer
    }: SetterOptions = {}) {
    const oldDb = this.#db;
    const newDb = getValidDb(db, { rootPath, injectors, reverse, dbMode, mockServer });
    this.#db = merge ? { ...oldDb, ...newDb } : newDb;
    this.initialDb = _.cloneDeep(this.#db);
  }
}