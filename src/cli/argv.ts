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
  dbMode: "mock" | "fetch" | "multi",
  root: string;
  static: string;
  snapshots: string;
  reverse: boolean;
  readOnly: boolean;
  noCors: boolean;
  noGzip: boolean;
  logger: boolean;
  bodyParser: boolean;
  cookieParser: boolean;
  watch: boolean;
  quiet: boolean;
  log: boolean;
  _: (string)[];
  $0: string;
}

export default (pkg) => {
  const options = yargs.config('config')
  .usage('mock-server [options] <source>')
  .options({
    config:       { alias: 'c',  description: 'Path to config file',                   type: "string",  default: "mock-server-config"                         },
    port:         { alias: 'P',  description: 'Set port',                              type: "number",  default: 3000                                       },
    host:         { alias: 'H',  description: 'Set host',                              type: "string",  default: 'localhost'                                },
    root:         { alias: 'r',  description: 'Set root directory.',                   type: "string",  default: './'                                       },
    static:       { alias: 's',  description: 'Set static files directory',            type: "string",  default: "public"                                   },
    base:         { alias: 'b',  description: 'Set base route path',                   type: "string",  default: ""                                         },
    db:           { alias: '',   description: 'Path to database file',                 type: "string",                                                      },
    middlewares:  { alias: 'md', description: 'Path to middlewares file',              type: "string",                                                      },
    injectors:    { alias: 'in', description: "Path to Injectors file",                type: "string",                                                      },
    store:        { alias: 'st', description: 'Path to Store file',                    type: "string",                                                      },
    rewriters:    { alias: 'rw', description: 'Path to Rewriter file',                 type: "string",                                                      },
    id:           { alias: '',   description: 'Set database id property',              type: "string",  default: 'id'                                       },
    dbMode:       { alias: 'dm', description: 'Set Db mode',                           type: "string",  default:"mock", choices: ['mock', 'fetch', 'multi'] },
    snapshots:    { alias: 'ss', description: 'Set snapshots directory',               type: "string",  default: './'                                       },
    reverse:      { alias: 'rv', description: 'Generate routes in reverse order',      type: "boolean", default: false                                      },
    readOnly:     { alias: 'ro', description: 'Allow only GET requests',               type: "boolean", default: false                                      },
    noCors:       { alias: 'nc', description: 'Disable Cross-Origin Resource Sharing', type: "boolean", default: false                                      },
    noGzip:       { alias: 'ng', description: 'Disable GZIP Content-Encoding',         type: "boolean", default: false                                      },
    bodyParser:   { alias: 'bp', description: 'Enable body-parser',                    type: "boolean", default: true                                       },
    cookieParser: { alias: 'cp', description: 'Enable cookie-parser',                  type: "boolean", default: true                                       },
    logger:       { alias: 'l',  description: 'Enable logger',                         type: "boolean", default: true                                       },
    watch:        { alias: 'w',  description: 'Watch for changes',                     type: "boolean", default: false                                      },
    quiet:        { alias: 'q',  description: 'Prevent console logs',                  type: "boolean", default: false                                      },
    log:          { alias: 'log',description: 'Prevent setters logs',                  type: "boolean", default: false                                      },
  })
  .boolean('reverse')
  .boolean('readOnly')
  .boolean('noCors')
  .boolean('noGzip')
  .boolean('logger')
  .boolean('bodyParser')
  .boolean('cookieParser')
  .boolean('watch')
  .boolean('quiet')
  .boolean('log')
  .help('help').alias('help', 'h')
  .example('mock-server db.json', '')
  .example('mock-server --watch db.json', '')
  .example('mock-server http://jsonplaceholder.typicode.com/db', '')
  .epilog('https://r35007.github.io/Mock-Server/')
  .version(pkg.version).alias('version', 'v').argv as Options;
  return options;
}
