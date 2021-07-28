import express from 'express';
import { Server } from "http";
import * as _ from "lodash";
import Default_Config from './config';
import Default_Middlewares from './middlewares';
import { Config, KeyValString, Middlewares, Routes } from "./model";

export class Initials {

  app: express.Application = express().set("json spaces", 2);
  router: express.Router = express.Router();
  server: Server | undefined;
  routesList: string[] = [];

  routes = {} as Routes;
  middlewares = { ...Default_Middlewares } as Middlewares;
  injectors = {} as Routes;
  store = {} as Object;
  config = _.cloneDeep(Default_Config) as Config
  rewriterRoutes = {} as KeyValString;

  initialRoutes = {} as Routes;
  initialStore = {} as Object;
}