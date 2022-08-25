import * as yargs from 'yargs';
interface Options {
  [x: string]: unknown;
  config: string;
  id: string;
  port: number;
  host: string;
  db: string;
  middleware: string;
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
    port: { alias: 'P', description: 'Set port', default: 3000 },
    host: { alias: 'H', description: 'Set host', default: 'localhost' },
    db: { alias: 'db', description: 'Path to routes file', type: "string" },
    middleware: { alias: 'm', description: 'Paths to middlewares file', type: "string" },
    injectors: { alias: "i", description: "Path to Injectors file", type: "string" },
    store: { alias: 's', description: 'Path to Store file', type: "string" },
    rewriters: { alias: 'r', description: 'Path to Rewriter file', type: "string" },
    staticDir: { alias: 'sd', description: 'Set static files directory', type: "string" },
    base: { alias: 'b', description: 'Set base route path', type: "string" },
    config: { alias: 'c', description: 'Path to config file', type: "string" },
    readOnly: { alias: 'ro', description: 'Allow only GET requests' },
    noCors: { alias: 'nc', description: 'Disable Cross-Origin Resource Sharing' },
    noGzip: { alias: 'ng', description: 'Disable GZIP Content-Encoding' },
    logger: { alias: 'l', description: 'Enable logger', default: true },
    bodyParser: { alias: 'bp', description: 'Enable body-parser', default: true },
    cookieParser: { alias: 'cp', description: 'Enable cookie-parser', default: true },
    sample: { alias: 'ex', description: 'Create Sample', default: false },
    watch: { alias: 'w', description: 'Watch file(s)', default: false },
    snapshots: { alias: 'S', description: 'Set snapshots directory', default: '.' },
    id: { alias: 'id', description: 'Set database id property (e.g. _id)', default: 'id', type: "string" },
  }).boolean('readOnly').boolean('noCors').boolean('noGzip').boolean('logger').boolean('sample').boolean('watch')
    .help('help').alias('help', 'h')
    .example('$0 db.json', '')
    .example('$0 --watch db.json', '')
    .example('$0 http://jsonplaceholder.typicode.com/db', '')
    .epilog('https://r35007.github.io/Mock-Server/')
    .version("9.2.0").alias('version', 'v').argv as Options;
  return options;
}
