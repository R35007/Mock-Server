import express from 'express';
import { Server } from "http";
import Default_Config from './config';
import Default_Middlewares from './middlewares';
import { Config, Db, Injectors, Middlewares, Rewriters, Store } from "./model";

export class Initials {

  app!: express.Application;
  router!: express.Router;
  server: Server | undefined;
  routes!: string[];

  db!: Db;
  middleware!: Middlewares;
  injectors!: Injectors;
  store!: Store;
  config!: Config
  rewriters!: Rewriters;

  initialDb!: Db;
  initialStore!: Store;

  constructor() {
    this.init();
  }

  init() {
    this.app = express().set("json spaces", 2);
    this.router = express.Router();
    this.routes = [];

    this.db = {} as Db;
    this.middleware = { ...Default_Middlewares } as Middlewares;
    this.injectors = [] as Injectors;
    this.store = {} as Store;
    this.config = { ...Default_Config } as Config
    this.rewriters = {} as Rewriters;

    this.initialDb = {} as Db;
    this.initialStore = {} as Store;
  }
}