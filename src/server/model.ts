import { AxiosRequestConfig } from 'axios';
import * as express from "express";

export type UserRoutes = string | Routes;
export type UserConfig = string | User_Config;
export type UserMiddlewares = string | User_Middlewares;
export type UserStore = string | Object;
export type UserRewriter = string | Object;

export type Routes = {
  [key: string]: RouteConfig
}

export type RouteConfig = {
  statusCode?: number;
  delay?: number;
  fetch?: string | AxiosRequestConfig;
  fetchCount?: number;
  mock?: any;
  override?: boolean;
  middlewares?: string[];
  middleware?: express.RequestHandler;
  description?: string;
  
  _id?: string;
  _isFile?: boolean;
  _request?: AxiosRequestConfig,
  _isDefault?: boolean;
  _extension?: string;

  _fetchData?: any;
  _fetchError?: any;
  _store?: object;
}

export type Config = {
  port: number;
  host: string;
  root: string;
  base: string;
  static: string;
  noGzip: boolean;
  noCors: boolean;
  logger: boolean;
  readOnly: boolean;
  bodyParser: boolean;
  id: string;
  reverse: boolean;
}

export type User_Config = {
  port?: number;
  root?: string;
  base?: string;
  static?: string;
  noGzip?: boolean;
  noCors?: boolean;
  logger?: boolean;
  readOnly?: boolean;
  bodyParser?: boolean;
  id?: boolean;
  foreignKeySuffix?: boolean;
  reverse?: boolean;
} | Config;

export type ExpressMiddleware = (req: express.Request,
  res: express.Response,
  next: express.NextFunction) => void | Promise<void>

export type User_Middlewares = {
  [x: string]: ExpressMiddleware;
} | Middlewares

export type Middlewares = {
  _LoopResponse?: ExpressMiddleware;
  _GroupResponse?: ExpressMiddleware;
  _CrudResponse?: ExpressMiddleware;
  _FetchTillData?: ExpressMiddleware;
  _SetFetchDataToMock?: ExpressMiddleware;
} & {
  [x: string]: ExpressMiddleware;
}

export type KeyValString = {
  [key: string]: string;
}

export interface Locals {
  routePath: string;
  routeConfig: RouteConfig;
  data: any;
  store: object;
  config: Config
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
  injectors: Routes;
  middlewares: Middlewares;
}