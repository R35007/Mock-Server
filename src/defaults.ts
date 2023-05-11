import * as path from 'path';
import { HelperMiddlewares } from './middlewares';
import type * as ValidTypes from './types/valid.types';

export const Config: ValidTypes.Config = {
  base: '', // Mount db on a base url
  bodyParser: true, // Enable body-parser
  cookieParser: true, // Enable cookie-parser
  dbMode: 'mock', // Give one of 'multi', 'fetch', 'mock'
  homePage: true, // Enable Mock Server Home page
  host: 'localhost', // Set custom host. Set empty string to set your Local Ip Address
  id: 'id', // Set db id attribute.
  log: false, // Prevent from setter logs
  logger: true, // Enable api logger
  noCache: true, // Disable cache
  noCors: false, // Disable CORS
  noGzip: false, // Disable data compression
  port: 3000, // Set Port to 0 to pick a random available port.
  quiet: false, // Prevent from console logs
  readOnly: false, // Allow only GET calls
  reverse: false, // Generate routes in reverse order
  root: process.cwd(), // Root path of the server. All paths refereed in db data will be relative to this path
  static: path.join(process.cwd(), 'public'), // Path to host a static files
};

export const Db: ValidTypes.Db = {};
export const Middlewares: ValidTypes.Middlewares = HelperMiddlewares;
export const Injectors: ValidTypes.Injectors = [];
export const Rewriters: ValidTypes.Rewriters = {};
export const Store: ValidTypes.Store = {};
