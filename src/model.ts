import { AxiosRequestConfig } from 'axios';
import * as express from "express";

export type UserRoutes = string | Routes;
export type UserConfig = string | User_Config | Config;
export type UserInjectors = string | Injectors;
export type UserMiddlewares = string | User_Middlewares;
export type defaultMiddlewaresName = 'loopMock' | 'groupMock' | 'crudMock';


export type Routes = {
  [key: string]: RouteConfig
}

export type RouteConfig = {
  statusCode?: number;
  delay?: number;
  fetch?: string | AxiosRequestConfig;
  mock?: any;
  mockFirst?: boolean;
  middlewares?: Array<defaultMiddlewaresName | string>;
}

export type User_Config = {
  port?: number;
  rootPath?: string;
  baseUrl?: string;
  staticUrl?: string;
  routeRewrite?: KeyValString;
  excludeRoutes?: string[];
  reverseRouteOrder?: boolean;
  throwError?: boolean;
}

export type Config = {
  port: number;
  rootPath: string;
  baseUrl: string;
  staticUrl: string;
  routeRewrite: KeyValString;
  excludeRoutes: string[];
  reverseRouteOrder: boolean;
  throwError: boolean;
}

export type Injectors = {
  [key: string]: InjectorConfig
}

export type InjectorConfig = RouteConfig & {
  override?: boolean;
  [key: string]: any
}

export type ExpressMiddleware = (req: express.Request,
  res: express.Response,
  next: express.NextFunction) => void | Promise<void>

export type User_Middlewares = {
  [x: string]: ExpressMiddleware;
}

export type Middlewares = {
  loopMock: ExpressMiddleware;
  groupMock: ExpressMiddleware;
  crudMock: ExpressMiddleware;
} & User_Middlewares


export type KeyValString = {
  [key: string]: string;
}

export interface Locals extends InjectorConfig {
  routePath: string;
  fetch: AxiosRequestConfig,
  fetchData?: any;
  fetchError?: any;
  data: any;
  store: {
    get: (key?: string) => any;
    set: (key: string, value: any) => void;
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

export type FileDetails = {
  fileName: string;
  extension: string;
  filePath: string;
  isFile: boolean;
}

export type GetData = {
  routes: Routes;
  config: Config;
  injectors: Injectors;
  middlewares: Middlewares;
}
