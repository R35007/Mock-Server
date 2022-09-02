import { AxiosRequestConfig } from 'axios';
import { DbMode, Default_Middlewares, Global_Middlweares, HarMiddleware, KibanaMiddleware, RoutePairs, User_Middlweares } from './common.types';
import * as UserTypes from "./user.types";

export type Config = {
  root: string;
  port: number;
  host: string;
  base: string;
  id: string;
  dbMode: DbMode
  static: string;
  reverse: boolean;
  logger: boolean;
  noGzip: boolean;
  noCors: boolean;
  readOnly: boolean;
  bodyParser: boolean;
  cookieParser: boolean;
  quiet: boolean;
};
export type Db = { [key: string]: RouteConfig }
export type Injectors = InjectorConfig[];
export type Middlewares = Default_Middlewares & Global_Middlweares & HarMiddleware & KibanaMiddleware & User_Middlweares
export type Rewriters = RoutePairs;
export type Store = Object;

export type RouteConfig = UserTypes.RouteConfig & {
  id: string;
  middlewares?: UserTypes.Middleware_Config[]
  fetchData?: FetchData

  // fetchData Utils
  _isFile?: boolean;
  _request?: AxiosRequestConfig,
  _extension?: string;
}

export type InjectorConfig = {
  routes: string[];
  override?: boolean;
  exact?: boolean;
} & Partial<RouteConfig>;

export type FetchData = UserTypes.FetchData
