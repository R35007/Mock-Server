import * as fs from "fs";
import * as path from "path";
import DefaultMiddlewares from './middlewares';
import * as ValidTypes from './types/valid.types';

const userDir = path.join(process.cwd(), 'public');
const defaultDir = path.join(__dirname, '../../public');
const staticDir = fs.existsSync(userDir) ? userDir : defaultDir;

export const Config: ValidTypes.Config = {
  port: 3000,
  host: "localhost",
  root: process.cwd(),
  base: "",
  staticDir,
  reverse: false,
  bodyParser: true,
  id: "id",
  logger: true,
  noCors: false,
  noGzip: false,
  readOnly: false
};
export const Middlewares: ValidTypes.Middlewares = DefaultMiddlewares;
export const Injectors: ValidTypes.Injectors = [];
export const Rewriters: ValidTypes.Rewriters = {};
export const Store: ValidTypes.Store = {};
export const Db: ValidTypes.Db = {};