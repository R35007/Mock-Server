import * as yargs from 'yargs';

export type Paths = {
  root: string;
  db: string;
  middlewares: string;
  injectors: string;
  rewriters: string;
  store: string;
  static: string;
  snapshots: string;
};

export type Configs = {
  port: number;
  host: string;
  base: string;
  id: string;
  dbMode: 'mock' | 'fetch' | 'multi' | 'config';
  reverse: boolean;
  readOnly: boolean;
  noCors: boolean;
  noGzip: boolean;
  noCache: boolean;
  logger: boolean;
  bodyParser: boolean;
  cookieParser: boolean;
  watch: boolean;
  quiet: boolean;
  log: boolean;
  homePage: boolean;
};

export type CliOptions = Paths &
  Configs & {
    config: string;
    _: string[];
  };

export default (pkg) => {
  const options = yargs
    .config('config')
    .usage('mock-server [options] <source>')
    .options({
      base: { alias: 'b', default: '', description: 'Set base route path', type: 'string' },
      bodyParser: { alias: 'bp', default: true, description: 'Enable body-parser', type: 'boolean' },
      config: { alias: 'c', default: 'mock-server-config', description: 'Path to config file', type: 'string' },
      cookieParser: { alias: 'cp', default: true, description: 'Enable cookie-parser', type: 'boolean' },
      db: { alias: '', description: 'Path to database file', type: 'string' },
      dbMode: { alias: 'dm', choices: ['mock', 'fetch', 'multi', 'config'], default: 'mock', description: 'Set Db mode', type: 'string' },
      homePage: { alias: 'hp', default: true, description: 'Enable Home Page', type: 'boolean' },
      host: { alias: 'H', default: 'localhost', description: 'Set host', type: 'string' },
      id: { alias: '', default: 'id', description: 'Set database id property', type: 'string' },
      injectors: { alias: 'in', description: 'Path to Injectors file', type: 'string' },
      log: { alias: 'log', default: false, description: 'Prevent setters logs', type: 'boolean' },
      logger: { alias: 'l', default: true, description: 'Enable logger', type: 'boolean' },
      middlewares: { alias: 'md', description: 'Path to middlewares file', type: 'string' },
      noCache: { alias: 'nch', default: true, description: 'Disable Cache', type: 'boolean' },
      noCors: { alias: 'nc', default: false, description: 'Disable Cross-Origin Resource Sharing', type: 'boolean' },
      noGzip: { alias: 'ng', default: false, description: 'Disable GZIP Content-Encoding', type: 'boolean' },
      port: { alias: 'P', default: 3000, description: 'Set port', type: 'number' },
      quiet: { alias: 'q', default: false, description: 'Prevent console logs', type: 'boolean' },
      readOnly: { alias: 'ro', default: false, description: 'Allow only GET requests', type: 'boolean' },
      reverse: { alias: 'rv', default: false, description: 'Generate routes in reverse order', type: 'boolean' },
      rewriters: { alias: 'rw', description: 'Path to Rewriter file', type: 'string' },
      root: { alias: 'r', default: './', description: 'Set root directory.', type: 'string' },
      snapshots: { alias: 'ss', default: './', description: 'Set snapshots directory', type: 'string' },
      static: { alias: 's', default: 'public', description: 'Set static files directory', type: 'string' },
      store: { alias: 'st', description: 'Path to Store file', type: 'string' },
      watch: { alias: 'w', default: false, description: 'Watch for changes', type: 'boolean' },
    })
    .boolean('reverse')
    .boolean('readOnly')
    .boolean('noCors')
    .boolean('noGzip')
    .boolean('noCache')
    .boolean('logger')
    .boolean('bodyParser')
    .boolean('cookieParser')
    .boolean('watch')
    .boolean('quiet')
    .boolean('log')
    .boolean('homePage')
    .help('help')
    .alias('help', 'h')
    .example('mock-server db.json', '')
    .example('mock-server --watch db.json', '')
    .example('mock-server http://jsonplaceholder.typicode.com/db', '')
    .epilog('https://r35007.github.io/Mock-Server/')
    .version(pkg.version)
    .alias('version', 'v').argv as CliOptions;
  return options;
};
