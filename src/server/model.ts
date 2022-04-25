import { AxiosRequestConfig } from 'axios';
import * as express from "express";

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
export type Db = { [key: string]: RouteConfig }
export type Injectors = InjectorConfig[];
export type Middlewares = Partial<Default_Middlewares & Global_Middlweares & HarMiddleware & User_Middlweares>

export type Rewriters = KeyValString;
export type Store = Object;

export type Default_Options = Partial<Omit<Config, 'port' | 'host' | 'root' | 'id' | 'reverse'>>

type Global_Middlweares = { _globals: express.RequestHandler | Array<express.RequestHandler> }
type User_Middlweares = { [x: string]: express.RequestHandler | Array<express.RequestHandler> }
type HarMiddleware = {
  _entryCallback?: (entry: HarEntry, routePath: string, routeConfig: RouteConfig) => Db
  _finalCallback?: (data: string | Db | { [key: string]: Omit<Object, "__config"> | any[] | string } | HAR, dbFromHAR: Db) => Db
}
export type Default_Middlewares = {
  _IterateResponse: express.RequestHandler;
  _IterateRoutes: express.RequestHandler;
  _CrudOperation: express.RequestHandler;
  _AdvancedSearch: express.RequestHandler;
  _FetchTillData: express.RequestHandler;
  _SetFetchDataToMock: express.RequestHandler;
  _SetStoreDataToMock: express.RequestHandler;
  _MockOnly: express.RequestHandler;
  _FetchOnly: express.RequestHandler;
  _ReadOnly: express.RequestHandler;
}

export type MiddlewareNames =
  "_IterateResponse" |
  "_IterateRoutes" |
  "_CrudOperation" |
  "_AdvancedSearch" |
  "_FetchTillData" |
  "_SetFetchDataToMock" |
  "_SetStoreDataToMock" |
  "_MockOnly" |
  "_FetchOnly" |
  "_ReadOnly"

export type RouteConfig = {
  _config: boolean;
  id?: string;
  description?: string;
  mock?: any;
  fetch?: string | AxiosRequestConfig;
  fetchData?: FetchData;
  store?: object;
  statusCode?: number;
  delay?: number;
  fetchCount?: number;
  skipFetchError?: boolean;
  mockFirst?: boolean;
  middlewareNames?: Array<MiddlewareNames> | string[];
  middlewares?: Array<express.RequestHandler>;

  _isFile?: boolean;
  _request?: AxiosRequestConfig,
  _extension?: string;
}

export type InjectorConfig = {
  routes: string[];
  override?: boolean;
  exact?: boolean;
} & Partial<RouteConfig>


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
  middleware: Middlewares;
  injectors: Injectors;
  rewriters: KeyValString
  store: Object;
  config: Config;
}

export type FetchData = {
  status?: number;
  message?: string;
  isError?: boolean;
  headers?: any;
  response?: any;
  stack?: any;
}