import type { AxiosRequestConfig } from 'axios';
import type {
  DbMode,
  DefaultMiddlewares,
  GlobalMiddlweares,
  HarMiddleware,
  KibanaMiddleware,
  RoutePairs,
  UserMiddlweares,
} from './common.types';
import type * as UserTypes from './user.types';

export type Config = {
  root: string;
  port: number;
  host: string;
  base: string;
  id: string;
  dbMode: DbMode;
  static: string;
  reverse: boolean;
  logger: boolean;
  noGzip: boolean;
  noCors: boolean;
  noCache: boolean;
  readOnly: boolean;
  bodyParser: boolean;
  cookieParser: boolean;
  quiet: boolean;
  log: boolean;
  homePage: boolean;
};

export type FetchData = UserTypes.FetchData;

export type RouteConfig = UserTypes.RouteConfig & {
  id: string;
  middlewares?: UserTypes.MiddlewareConfig[];
  fetchData?: FetchData;

  // fetchData Utils
  _isFile?: boolean;
  _request?: AxiosRequestConfig;
  _extension?: string;
};

export type InjectorConfig = {
  routes: string[];
  override?: boolean;
  exact?: boolean;
} & Partial<RouteConfig>;

export type Db = { [key: string]: RouteConfig };
export type Middlewares = DefaultMiddlewares & GlobalMiddlweares & HarMiddleware & KibanaMiddleware & UserMiddlweares;
export type Injectors = InjectorConfig[];
export type Rewriters = RoutePairs;
export type Store = object;
