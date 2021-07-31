import { AxiosRequestConfig } from 'axios';
import * as express from "express";

export type UserRoutes = string | User_Routes | Routes;
export type UserConfig = string | User_Config | Config;
export type UserMiddlewares = string | User_Middlewares | Middlewares;
export type UserStore = string | Object;
export type UserRewriter = string | KeyValString;

export type User_Routes = {
  [key: string]: RouteConfig | any[] | string;
}

export type Routes = {
  [key: string]: RouteConfig
}

export type RouteConfig = {
  statusCode?: number;
  delay?: number;
  fetch?: string | AxiosRequestConfig;
  fetchCount?: number;
  skipFetchError?: boolean;
  mock?: any;
  override?: boolean;
  middlewares?: string[];
  middleware?: express.RequestHandler;
  store?: object;
  description?: string;

  _id?: string;
  _isFile?: boolean;
  _request?: AxiosRequestConfig,
  _extension?: string;

  _fetchData?: any;
  _fetchError?: any;
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
  root?: string;
  base?: string;
  id?: string;
  reverse?: boolean;
} & Default_Options;

export type User_Middlewares = {
  [x: string]: express.RequestHandler;
}

export type Middlewares = {
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
  getRoutes: (_ids?: string[], routePaths?: string[]) => Routes;
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
  routes: Routes;
  config: Config;
  middlewares: Middlewares;
  injectors: Routes;
  store: Object;
  routeRewriters: KeyValString
}