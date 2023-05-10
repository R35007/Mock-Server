import * as path from 'path';
import HelperMiddlewares from './middlewares';
import type * as ValidTypes from './types/valid.types';

export const Config: ValidTypes.Config = {
  // Root path of the server. All paths refereed in db data will be relative to this path
  base: '',

  // Allow only GET calls
  bodyParser: true,

  // Enable body-parser
  cookieParser: true,

  // Set db id attribute.
  dbMode: 'mock',

  // Prevent from setter logs
  homePage: true,

  // Set Port to 0 to pick a random available port.
  host: 'localhost',

  // Mount db on a base url
  id: 'id',

  // Prevent from console logs
  log: false,

  // Generate routes in reverse order
  logger: true,

  // Disable data compression
  noCache: true,

  // Enable api logger
  noCors: false,

  // Disable CORS
  noGzip: false,

  port: 3000,

  // Enable cookie-parser
  quiet: false,

  // Disable cache
  readOnly: false,

  // Path to host a static files
  reverse: false,

  // Set custom host. Set empty string to set your Local Ip Address
  root: process.cwd(),

  // Give one of 'multi', 'fetch', 'mock'
  static: path.join(process.cwd(), 'public'), // Enable Mock Server Home page
};

export const Db: ValidTypes.Db = {};
export const Middlewares: ValidTypes.Middlewares = HelperMiddlewares;
export const Injectors: ValidTypes.Injectors = [];
export const Rewriters: ValidTypes.Rewriters = {};
export const Store: ValidTypes.Store = {};
