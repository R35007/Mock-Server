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
  /** Root path of the server. All paths refereed in db data will be relative to this path */
  root: string;
  /** Set Port to 0 to pick a random available port. */
  port: number;
  /** Set custom host. Set empty string to set your Local Ip Address */
  host: string;
  /** Mount db on a base url */
  base: string;
  /** Set db id attribute. */
  id: string;
  /** Give one of 'multi', 'fetch', 'mock' */
  dbMode: DbMode;
  /** Path to host a static files */
  static: string;
  /** Generate routes in reverse order */
  reverse: boolean;
  /** Disable data compression */
  noGzip: boolean;
  /** Disable CORS */
  noCors: boolean;
  /** Disable cache */
  noCache: boolean;
  /** Allow only GET calls */
  readOnly: boolean;
  /** Enable body-parser */
  bodyParser: boolean;
  /** Enable cookie-parser */
  cookieParser: boolean;
  /** Enable api logger */
  logger: boolean;
  /** Prevent from console logs */
  quiet: boolean;
  /** Prevent from setter logs */
  log: boolean;
  /** Enable Mock Server Home page */
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
