import * as yargs from 'yargs';

interface Options {
  [x: string]: unknown;
  config: string;
  id: string;
  port: number;
  host: string;
  routes: string;
  middlewares: string;
  injectors: string;
  store: string;
  rewriter: string;
  base: string;
  staticDir: string;
  readOnly: boolean;
  noCors: boolean;
  noGzip: boolean;
  logger: boolean;
  _: (string)[];
  $0: string;
}

export default () => {

  const options = yargs.config('config').options({
    port: { alias: 'p', description: 'Set port', default: 3000 },
    host: { alias: 'H', description: 'Set host', default: 'localhost' },
    routes: { alias: 'r', description: 'Path to routes file', type: "string" },
    middlewares: { alias: 'm', description: 'Paths to middlewares file', type: "string" },
    injectors: { alias: "ij", description: "Path to Injectors file", type: "string" },
    store: { alias: 'st', description: 'Path to Store file', type: "string" },
    rewriter: { alias: 'rw', description: 'Path to Rewriter file', type: "string" },
    staticDir: { alias: 's', description: 'Set static files directory', type: "string" },
    base: { alias: 'b', description: 'Set base route path', type: "string" },
    config: { alias: 'c', description: 'Path to config file', type: "string" },
    readOnly: { alias: 'ro', description: 'Allow only GET requests' },
    noCors: { alias: 'nc', description: 'Disable Cross-Origin Resource Sharing' },
    noGzip: { alias: 'ng', description: 'Disable GZIP Content-Encoding' },
    logger: { alias: 'l', description: 'Enable logger', default: true },
    id: { alias: 'i', description: 'Set database id property (e.g. _id)', default: 'id', type: "string" },
  }).boolean('readOnly').boolean('noCors').boolean('noGzip').boolean('logger')
    .help('help').alias('help', 'h')
    .example('$0 --r=routes.json', '')
    .example('$0 --r=https://jsonplaceholder.typicode.com/db', '')
    .epilog('https://r35007.github.io/Mock-Server/')
    .version("3.0.2").alias('version', 'v').argv as Options;

  return options;
}
