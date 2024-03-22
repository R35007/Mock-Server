import * as path from 'path';
import { HelperMiddlewares } from './middlewares';
import type * as ValidTypes from './types/valid.types';

/**
 * Configuration object for the server.
 * @type {ValidTypes.Config}
 */
export const Config: ValidTypes.Config = {
  root: process.cwd(), // Root path of the server. All paths refereed in db data will be relative to this path
  port: 3000, // Set Port to 0 to pick a random available port.
  host: 'localhost', // Set custom host. Set empty string to set your Local Ip Address
  base: '', // Mount db on a base url
  id: 'id', // Set db id attribute.
  dbMode: 'mock', // Give one of 'multi', 'fetch', 'mock'
  static: path.join(process.cwd(), 'public'), // Path to host a static files
  reverse: false, // Generate routes in reverse order
  noGzip: false, // Disable data compression
  noCors: false, // Disable CORS
  noCache: true, // Disable cache
  readOnly: false, // Allow only GET calls
  bodyParser: true, // Enable body-parser
  cookieParser: true, // Enable cookie-parser
  logger: true, // Enable api logger
  quiet: false, // Prevent from console logs
  log: false, // Prevent from setter logs
  homePage: true, // Enable Mock Server Home page
};

export const Db: ValidTypes.Db = {};
export const Middlewares: ValidTypes.Middlewares = HelperMiddlewares;
export const Injectors: ValidTypes.Injectors = [];
export const Rewriters: ValidTypes.Rewriters = {};
export const Store: ValidTypes.Store = {};
