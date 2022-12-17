import * as path from "path";
import HelperMiddlewares from './middlewares';
import * as ValidTypes from './types/valid.types';

export const Config: ValidTypes.Config = {
  port: 3000, // Set Port to 0 to pick a random available port.
  host: "localhost", // Set custom host. Set empty string to set your Local Ip Address
  root: process.cwd(), // Root path of the server. All paths refereed in db data will be relative to this path
  base: "", // Mount db on a base url
  id: "id", // Set db id attribute.
  dbMode: 'mock', // Give one of 'multi', 'fetch', 'mock'
  static: path.join(process.cwd(), 'public'), // Path to host a static files
  reverse: false, // Generate routes in reverse order
  logger: true, // Enable api logger
  noCors: false, // Disable CORS
  noGzip: false, // Disable data compression
  readOnly: false, // Allow only GET calls
  bodyParser: true, // Enable body-parser
  cookieParser: true, // Enable cookie-parser
  quiet: false, // Prevent from console logs
  log: false, // Prevent from setter logs
};

export const Middlewares: ValidTypes.Middlewares = HelperMiddlewares;
export const Injectors: ValidTypes.Injectors = [];
export const Rewriters: ValidTypes.Rewriters = {};
export const Store: ValidTypes.Store = {};
export const Db: ValidTypes.Db = {};