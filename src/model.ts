import { AxiosRequestConfig } from 'axios';
import * as express from "express";

export type UserRoutes = string | Routes;
export type UserConfig = string | User_Config | Config;
export type UserInjectors = string | Injectors;
export type UserGlobals = string | Globals;
export type UserMiddlewares = string | User_Middlewares | Middlewares;
export type defaultMiddlewaresName = 'loopMock' | 'groupMock' | 'crudMock';


export type Routes = {
  [key: string]: RouteConfig
}

export type RouteConfig = {
  statusCode?: number;
  delay?: number;
  initialMock?: string | UrlRequestConfig;
  mock?: any;
  alternateMock?: string | UrlRequestConfig;
  middleware?: defaultMiddlewaresName | string;
}

export type User_Config = {
  port?: number;
  rootPath?: string;
  baseUrl?: string;
  staticUrl?: string;
  proxy?: KeyValString;
  excludeRoutes?: string[];
  reverseRouteOrder?: boolean;
  throwError?: boolean;
}

export type Config = {
  port: number;
  rootPath: string;
  baseUrl: string;
  staticUrl: string;
  proxy: KeyValString;
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

export type Globals = {
  [key: string]: any;
}

export type User_Middlewares = {
  [key: string]: Middleware;
}

export type Middlewares = {
  loopMock: Middleware;
  groupMock: Middleware;
  crudMock: Middleware;
} & User_Middlewares

export type UrlRequestConfig = AxiosRequestConfig & { isFile?: boolean }


export type KeyValString = {
  [key: string]: string;
}

export type MiddlewareParams = {
  req: express.Request;
  res: express.Response;
  next: express.NextFunction;
  data: any;
  globals: Globals;
  locals: Locals;
}

export type Middleware = (params: MiddlewareParams) => void;

export type Locals = InjectorConfig & {
  routePath: string;
  initialMockData: any;
  data: any;
  alternateMockData: any;
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
  globals: Globals;
  middlewares: User_Middlewares;
}
