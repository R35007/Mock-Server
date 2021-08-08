import express from 'express';
import { Server } from "http";
import Default_Config from './config';
import Default_Middlewares from './middlewares';
import { Config, Db, KeyValString, Middleware } from "./model";

export class Initials {

  app: express.Application = express().set("json spaces", 2);
  router: express.Router = express.Router();
  server: Server | undefined;
  routes: string[] = [];

  db = {} as Db;
  middleware = { ...Default_Middlewares } as Middleware;
  injectors = {} as Db;
  store = {} as Object;
  config = { ...Default_Config } as Config
  rewriters = {} as KeyValString;

  initialDb = {} as Db;
  initialStore = {} as Object;
}