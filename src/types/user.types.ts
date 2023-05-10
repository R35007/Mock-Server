import type { AxiosRequestConfig } from 'axios';
import type * as express from 'express';
import type { DefaultMiddlewares, GlobalMiddlweares, MiddlewareNames, RoutePairs, UserMiddlweares } from './common.types';
import type * as ValidTypes from './valid.types';

export type FetchData = {
  isError: boolean;
  message?: string;
  response?: any;
  stack?: any;
  headers?: any;
  statusCode?: number;
  isImage?: boolean;
};

export type Middlewares = Partial<DefaultMiddlewares & GlobalMiddlweares & UserMiddlweares>;
export type Middleware_Config = express.RequestHandler | MiddlewareNames | string;

export type RouteConfig = {
  _config: boolean;
  id?: string | number;
  description?: string;
  mock?: any;
  fetch?: string | AxiosRequestConfig;
  fetchData?: FetchData;
  store?: { [key: string]: any };
  statusCode?: number;
  delay?: number;
  fetchCount?: number;
  skipFetchError?: boolean;
  mockFirst?: boolean;
  middlewares?: Middleware_Config | Middleware_Config[];
  directUse?: boolean;
  headers?: { [key: string]: any };
};

export type InjectorConfig = {
  routes: string | string[];
  override?: boolean;
  exact?: boolean;
} & Partial<RouteConfig>;

export type Config = Partial<ValidTypes.Config>;
export type Db =
  | { [key: string]: RouteConfig }
  | { [key: string]: express.RequestHandler }
  | { [key: string]: Omit<object, '_config'> }
  | { [key: string]: any[] }
  | { [key: string]: string };
export type Injectors = InjectorConfig[];
export type Rewriters = RoutePairs;
export type Store = { [key: string]: any };
