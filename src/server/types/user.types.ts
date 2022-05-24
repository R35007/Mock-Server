import { AxiosRequestConfig } from 'axios';
import * as express from "express";
import { Default_Middlewares, Global_Middlweares, HarMiddleware, MiddlewareNames, RoutePairs, User_Middlweares } from './common.types';
import * as ValidTypes from './valid.types';

export type Config = Partial<ValidTypes.Config>;
export type Db = { [key: string]: RouteConfig } | { [key: string]: Omit<Object, "__config"> | any[] | string };
export type Injectors = InjectorConfig[];
export type Middlewares = Partial<Default_Middlewares & Global_Middlweares & HarMiddleware & User_Middlweares>
export type Rewriters = RoutePairs;
export type Store = Object;


export type Middleware_Config = express.RequestHandler | MiddlewareNames | string;
export type RouteConfig = {
  id?: string | number;
  _config: boolean;
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
  middlewares?: Middleware_Config | Middleware_Config[];
}

export type InjectorConfig = {
  routes: string | string[];
  override?: boolean;
  exact?: boolean;
} & Partial<RouteConfig>;

export type FetchData = {
  isError: boolean;
  message?: string;
  response?: any;
  stack?: any;
  headers?: any;
  status?: number;
}

