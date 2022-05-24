import * as express from "express";
import DefaultMiddlewares from '../middlewares';
import * as UserTypes from './user.types';
import * as ValidTypes from './valid.types';

export type RoutePairs = { [key: string]: string }

export type Default_Options = Partial<Omit<ValidTypes.Config, 'port' | 'host' | 'root' | 'id' | 'reverse'>>

export type Default_Middlewares = typeof DefaultMiddlewares;
export type User_Middlweares = { [x: string]: express.RequestHandler | Array<express.RequestHandler> }
export type Global_Middlweares = { _globals?: express.RequestHandler | Array<express.RequestHandler> }
export type HarMiddleware = {
  _harEntryCallback?: (entry: HarEntry, routePath: string, routeConfig: UserTypes.RouteConfig) => { [key: string]: UserTypes.RouteConfig }
  _harDbCallback?: (data: string | UserTypes.Db | { [key: string]: Omit<Object, "__config"> | any[] | string } | HAR, dbFromHAR: UserTypes.Db) => UserTypes.Db
}
export type MiddlewareNames = keyof Default_Middlewares

export type GetValidDbOptions = {
  reverse?: boolean,
  _harEntryCallback?: HarMiddleware["_harEntryCallback"],
  _harDbCallback?: HarMiddleware["_harDbCallback"]
}

export interface Locals {
  routePath: string;
  routeConfig: ValidTypes.RouteConfig;
  data: any;
  config: ValidTypes.Config;
  getStore: () => ValidTypes.Store;
  getDb: () => ValidTypes.Db;
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

export type GetData = {
  db: ValidTypes.Db;
  middlewares: ValidTypes.Middlewares;
  injectors: ValidTypes.Injectors;
  rewriters: ValidTypes.Rewriters
  store: ValidTypes.Store;
  config: ValidTypes.Config;
}

