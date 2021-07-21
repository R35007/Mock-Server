import * as path from "path";
import * as fs from "fs";
import { Config } from '../model';

const userDir = path.join(process.cwd(), 'public');
const defaultDir = path.join(__dirname, '../../../public');
const staticDir = fs.existsSync(userDir) ? userDir : defaultDir;

export const Default_Config: Config = {
  port: 3000,
  host: "localhost",
  root: process.cwd(),
  base: "",
  static: staticDir,
  reverse: false,
  bodyParser: true,
  id: "id",
  logger: true,
  noCors: false,
  noGzip: false,
  readOnly: false
}