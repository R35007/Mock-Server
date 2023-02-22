import * as express from "express";
import HelperMiddlewares from '../middlewares';
import RouteConfigSetters from '../route-config-setters';
import * as ParamTypes from './param.types';
import * as UserTypes from './user.types';
import * as ValidTypes from './valid.types';

export type RoutePairs = { [key: string]: string }

export type Default_Options = Partial<Omit<ValidTypes.Config, 'port' | 'host' | 'root' | 'id' | 'reverse' | 'dbMode'>>

export type Default_Middlewares = typeof HelperMiddlewares;
export type User_Middlweares = { [x: string]: express.RequestHandler | Array<express.RequestHandler> }
export type Global_Middlweares = { globals?: express.RequestHandler | Array<express.RequestHandler> }
export type HarMiddleware = {
  harEntryCallback?: (entry: HarEntry, routePath: string, routeConfig: UserTypes.RouteConfig) => { [key: string]: UserTypes.RouteConfig }
  harDbCallback?: (data: string | UserTypes.Db | { [key: string]: Omit<Object, "__config"> | any[] | string } | HAR, dbFromHAR: UserTypes.Db) => UserTypes.Db
}
export type KibanaMiddleware = {
  kibanaHitsCallback?: (hit: HIT, routePath: string, routeConfig: UserTypes.RouteConfig) => { [key: string]: UserTypes.RouteConfig }
  kibanaDbCallback?: (data: string | UserTypes.Db | { [key: string]: Omit<Object, "__config"> | any[] | string } | HAR, dbFromKibana: UserTypes.Db) => UserTypes.Db
}
export type MiddlewareNames = keyof Default_Middlewares

export type DbMode = 'mock' | 'fetch' | 'multi' | 'config';

export interface Locals {
  routePath: string;
  routeConfig: ValidTypes.RouteConfig;
  data: any;
  statusCode: number | undefined;
  headers: object | undefined;
  config: ValidTypes.Config;
  getStore: () => ValidTypes.Store;
  getDb: (routePath?: string | string[]) => ValidTypes.RouteConfig | ValidTypes.Db;
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
  middlewares?: ParamTypes.Middlewares,
  injectors?: ParamTypes.Injectors,
  store?: ParamTypes.Store,
  config?: ParamTypes.Config,
}

export type GetData = {
  db: ValidTypes.Db;
  middlewares: ValidTypes.Middlewares;
  injectors: ValidTypes.Injectors;
  rewriters: ValidTypes.Rewriters
  store: ValidTypes.Store;
  config: ValidTypes.Config;
}

export type Server = {
  app?: express.Application,
  routes?: string[],
  data?: GetData,
  getStore?: () => ValidTypes.Store
  getDb?: (routePath?: string | string[]) => ValidTypes.RouteConfig | ValidTypes.Db,
}

export type SetterOptions = {
  root?: string;
  merge?: boolean;
  log?: string | boolean;
}

export type DbSetterOptions = SetterOptions & {
  injectors?: ParamTypes.Injectors,
  reverse?: boolean,
  dbMode?: DbMode
}

export type ValidatorOptions = {
  root?: string;
  mockServer?: Server
}

export type DbValidatorOptions = ValidatorOptions & {
  injectors?: ParamTypes.Injectors,
  reverse?: boolean,
  dbMode?: DbMode
}

export type LaunchServerOptions = {
  middlewares?: ParamTypes.Middlewares,
  injectors?: ParamTypes.Injectors,
  rewriters?: ParamTypes.Rewriters,
  store?: ParamTypes.Store,
  router?: express.Router,
  app?: express.Application,
  log?: boolean
}

export type RewriterOptions = {
  root?: string;
  router?: express.Router,
  log?: boolean | string,
}

export type ResourceOptions = {
  reverse?: boolean,
  middlewares?: ParamTypes.Middlewares,
  injectors?: ParamTypes.Injectors,
  root?: string;
  router?: express.Router,
  dbMode?: DbMode,
  log?: boolean | string,
}

export type ResourceReturns = {
  router: express.Router,
  create: (routePath: string, ...middlewares: UserTypes.Middleware_Config[]) => RouteConfigSetters
}
