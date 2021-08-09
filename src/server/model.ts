import { AxiosRequestConfig } from 'axios';
import * as express from "express";

export type UserDb = string | User_Db | Db;
export type UserConfig = string | User_Config | Config;
export type UserMiddleware = string | User_Middleware | Middleware;
export type UserStore = string | Object;
export type UserRewriters = string | KeyValString;

export type User_Db = {
  [key: string]: RouteConfig | any[] | string;
}

export type Db = {
  [key: string]: RouteConfig
}

export type RouteConfig = {
  _config?: boolean;
  id?: string;
  description?: string;
  mock?: any;
  fetch?: string | AxiosRequestConfig;
  fetchData?: any;
  fetchError?: any;
  store?: object;
  statusCode?: number;
  delay?: number;
  fetchCount?: number;
  skipFetchError?: boolean;
  middlewares?: string[];
  middleware?: express.RequestHandler;
  
  _isFile?: boolean;
  _request?: AxiosRequestConfig,
  _extension?: string;
  _override?: boolean;

  [key: string]: any;
}

export type Config = {
  port: number;
  host: string;
  root: string;
  base: string;
  id: string;
  reverse: boolean;
  staticDir: string;
  noGzip: boolean;
  noCors: boolean;
  logger: boolean;
  readOnly: boolean;
  bodyParser: boolean;
}

export type Default_Options = {
  base?: string;
  staticDir?: string;
  noGzip?: boolean;
  noCors?: boolean;
  logger?: boolean;
  readOnly?: boolean;
  bodyParser?: boolean;
}

export type User_Config = {
  port?: number;
  host?: string;
  root?: string;
  base?: string;
  id?: string;
  reverse?: boolean;
} & Default_Options;

export type User_Middleware = {
  [x: string]: express.RequestHandler;
}

export type Middleware = {
  _IterateResponse?: express.RequestHandler;
  _IterateRoutes?: express.RequestHandler;
  _CrudOperation?: express.RequestHandler;
  _ReadOperation?: express.RequestHandler;
  _FetchTillData?: express.RequestHandler;
  _SetFetchDataToMock?: express.RequestHandler;
  _SetStoreDataToMock?: express.RequestHandler;
  _SendOnlyMock?: express.RequestHandler;
} & {
  [x: string]: express.RequestHandler;
}

export type KeyValString = {
  [key: string]: string;
}

export interface Locals {
  routePath: string;
  routeConfig: RouteConfig;
  data: any;
  store: object;
  getDb: (ids?: string[], routePaths?: string[]) => Db;
  config: Config;
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
  db: Db;
  middleware: Middleware;
  injectors: Db;
  rewriters: KeyValString
  store: Object;
  config: Config;
}