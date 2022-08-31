import * as express from "express";
import HelperMiddlewares from '../middlewares';
import * as ParamTypes from './param.types';
import * as UserTypes from './user.types';
import * as ValidTypes from './valid.types';

export type RoutePairs = { [key: string]: string }

export type Default_Options = Partial<Omit<ValidTypes.Config, 'port' | 'host' | 'rootPath' | 'id' | 'reverse' | 'dbMode'>>

export type Default_Middlewares = typeof HelperMiddlewares;
export type User_Middlweares = { [x: string]: express.RequestHandler | Array<express.RequestHandler> }
export type Global_Middlweares = { _globals?: express.RequestHandler | Array<express.RequestHandler> }
export type HarMiddleware = {
  _harEntryCallback?: (entry: HarEntry, routePath: string, routeConfig: UserTypes.RouteConfig) => { [key: string]: UserTypes.RouteConfig }
  _harDbCallback?: (data: string | UserTypes.Db | { [key: string]: Omit<Object, "__config"> | any[] | string } | HAR, dbFromHAR: UserTypes.Db) => UserTypes.Db
}
export type KibanaMiddleware = {
  _kibanaHitsCallback?: (hit: HIT, routePath: string, routeConfig: UserTypes.RouteConfig) => { [key: string]: UserTypes.RouteConfig }
  _kibanaDbCallback?: (data: string | UserTypes.Db | { [key: string]: Omit<Object, "__config"> | any[] | string } | HAR, dbFromKibana: UserTypes.Db) => UserTypes.Db
}
export type MiddlewareNames = keyof Default_Middlewares

export type DbMode = 'mock' | 'fetch' | 'multi';

export interface Locals {
  routePath: string;
  routeConfig: ValidTypes.RouteConfig;
  data: any;
  config: ValidTypes.Config;
  getStore: () => ValidTypes.Store;
  getDb: () => ValidTypes.Db;
}

export type HIT = {
  [key: string]: any;
  _source: {
    requestURI: string;
    response?: string;
    e2eRequestId?: string;
    session_id?: string;
    request: string;
    status_code: string;
  }
}

export type KIBANA = {
  rawResponse: {
    hits: { hits: HIT[] }
  }
}

export type HAR = {
  log: {
    [key: string]: any;
    entries: HarEntry[];
  };
}

export type HarEntry = {
  [key: string]: any;
  _resourceType: string;
  request: {
    [key: string]: any;
    url: string;
  };
  response: {
    [key: string]: any;
    status: number;
    content: {
      [key: string]: any;
      text: string;
    };
  };
}

export type PathDetails = {
  fileName: string;
  extension: string;
  filePath: string;
  isFile: boolean;
  isDirectory: boolean;
}

export type SetData = {
  db?: ParamTypes.Db,
  injectors?: ParamTypes.Injectors,
  middlewares?: ParamTypes.Middlewares,
  store?: ParamTypes.Store,
  rewriters?: ParamTypes.Rewriters,
  config?: ParamTypes.Config,
}

export type GetData = {
  db: ValidTypes.Db;
  injectors: ValidTypes.Injectors;
  middlewares: ValidTypes.Middlewares;
  store: ValidTypes.Store;
  rewriters: ValidTypes.Rewriters
  config: ValidTypes.Config;
}

export type Server = {
  app?: express.Application,
  routes?: string[],
  data?: GetData,
  getDb?: () => ValidTypes.Db
  getStore?: () => ValidTypes.Store
}

export type SetterOptions = {
  rootPath?: string;
  merge?: boolean;
  log?: boolean;
}

export type DbSetterOptions = SetterOptions & {
  injectors?: ParamTypes.Injectors,
  reverse?: boolean,
  dbMode?: DbMode
}

export type ValidatorOptions = {
  rootPath?: string;
  mockServer?: Server
}

export type DbValidatorOptions = ValidatorOptions & {
  injectors?: ParamTypes.Injectors,
  reverse?: boolean,
  dbMode?: DbMode
}

export type LaunchServerOptions = {
  injectors?: ParamTypes.Injectors,
  middlewares?: ParamTypes.Middlewares,
  store?: ParamTypes.Store,
  rewriters?: ParamTypes.Rewriters,
  router?: express.Router,
  log?: boolean
}

export type ResourceOptions = {
  reverse?: boolean,
  injectors?: ParamTypes.Injectors,
  middlewares?: ParamTypes.Middlewares,
  rootPath?: string;
  router?: express.Router,
  dbMode?: DbMode,
  log?: boolean | string,
}


