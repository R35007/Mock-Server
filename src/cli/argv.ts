import * as yargs from 'yargs';
interface Options {
  [x: string]: unknown;
  config: string;
  id: string;
  port: number;
  host: string;
  db: string;
  middlewares: string;
  injectors: string;
  store: string;
  rewriters: string;
  base: string;
  staticDir: string;
  snapshots: string;
  readOnly: boolean;
  noCors: boolean;
  noGzip: boolean;
  logger: boolean;
  sample: boolean;
  watch: boolean;
  _: (string)[];
  $0: string;
}

export default () => {
  const options = yargs.config('config').options({
    port: { alias: 'p', description: 'Set port', default: 3000 },
    host: { alias: 'h', description: 'Set host', default: 'localhost' },
    db: { alias: 'db', description: 'Path to routes file', type: "string" },
    middlewares: { alias: 'm', description: 'Paths to middlewares file', type: "string" },
    injectors: { alias: "i", description: "Path to Injectors file", type: "string" },
    store: { alias: 's', description: 'Path to Store file', type: "string" },
    rewriters: { alias: 'r', description: 'Path to Rewriter file', type: "string" },
    staticDir: { alias: 'sd', description: 'Set static files directory', type: "string" },
    base: { alias: 'b', description: 'Set base route path', type: "string" },
    config: { alias: 'c', description: 'Path to config file', type: "string" },
    dbMode: { alias: 'dm', description: 'Set Db mode', type: "string" },
    readOnly: { alias: 'ro', description: 'Allow only GET requests' },
    noCors: { alias: 'nc', description: 'Disable Cross-Origin Resource Sharing' },
    noGzip: { alias: 'ng', description: 'Disable GZIP Content-Encoding' },
    logger: { alias: 'l', description: 'Enable logger', default: true },
    bodyParser: { alias: 'bp', description: 'Enable body-parser', default: true },
    cookieParser: { alias: 'cp', description: 'Enable cookie-parser', default: true },
    watch: { alias: 'w', description: 'Watch file(s)', default: false },
    snapshots: { alias: 's', description: 'Set snapshots directory', default: '.' },
    id: { alias: 'id', description: 'Set database id property (e.g. _id)', default: 'id', type: "string" },
  }).boolean('readOnly').boolean('noCors').boolean('noGzip').boolean('logger').boolean('sample').boolean('watch')
    .help('help').alias('help', 'h')
    .example('mock-server db.json', '')
    .example('mock-server --watch db.json', '')
    .example('mock-server http://jsonplaceholder.typicode.com/db', '')
    .epilog('https://r35007.github.io/Mock-Server/')
    .version("10.0.0").alias('version', 'v').argv as Options;
  return options;
}
