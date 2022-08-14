import * as fs from "fs";
import * as path from "path";
import DefaultMiddlewares from './middlewares';
import * as ValidTypes from './types/valid.types';

const userDir = path.join(process.cwd(), 'public');
const defaultDir = path.join(__dirname, '../../public');
const staticDir = fs.existsSync(userDir) ? userDir : defaultDir;

export const Config: ValidTypes.Config = {
  port: 3000, // Set Port to 0 to pick a random available port.
  host: "localhost", // Set custom host 
  root: process.cwd(), // Root path of the server. All paths refereed in db data will be relative to this path
  base: "", // Mount db on a base url
  id: "id", // Set db id attribute.
  mode: 'mock', // Use direct route value as a mock. If mode: "fetch" then direct route value will be set to fetch
  staticDir, // Path to host a static files
  reverse: false, // Generate routes in reverse order
  logger: true, // Enable api logger
  noCors: false, // Disable CORS
  noGzip: false, // Disable data compression
  readOnly: false, // Allow only GET calls
  bodyParser: true, // Enable body-parser
  cookieParser: true, // Enable cookie-parser
};

export const Middlewares: ValidTypes.Middlewares = DefaultMiddlewares;
export const Injectors: ValidTypes.Injectors = [];
export const Rewriters: ValidTypes.Rewriters = {};
export const Store: ValidTypes.Store = {};
export const Db: ValidTypes.Db = {};