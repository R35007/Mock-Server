import chalk from "chalk";
import * as _ from 'lodash';
import { Config, Db, GetData, HAR, Injectors, Middlewares, Rewriters, RouteConfig, Store } from './model';
import { Validators } from './validators';

export class GettersSetters extends Validators {

  constructor(
    config?: string | Partial<Config>,
  ) {
    super();
    console.log("\n" + chalk.blueBright("{^_^}/~ Hi!"));
    this.setConfig(config);
  }

  setData(
    db?: string | Db | { [key: string]: Omit<Object, "__config"> | any[] | string },
    middleware?: string | Partial<Middlewares>,
    injectors?: string | Injectors,
    rewriters?: string | Rewriters,
    store?: string | Store,
    config?: string | Partial<Config>,
  ) {
    !_.isEmpty(config) && this.setConfig(config);
    !_.isEmpty(rewriters) && this.setRewriters(rewriters);
    !_.isEmpty(middleware) && this.setMiddleware(middleware);
    !_.isEmpty(injectors) && this.setInjectors(injectors);
    !_.isEmpty(store) && this.setStore(store);
    !_.isEmpty(db) && this.setDb(db);
  };

  get data(): GetData {
    return {
      db: this.db,
      injectors: this.injectors,
      middleware: this.middleware,
      rewriters: this.rewriters,
      store: this.store,
      config: this.config
    } as GetData;
  };

  setConfig(config?: string | Partial<Config>) {
    console.log("\n" + chalk.gray("Setting Config..."));
    this.config = this.getValidConfig(config);
    console.log(chalk.gray("Done."));
  }

  setMiddleware(middleware?: string | Partial<Middlewares>) {
    console.log("\n" + chalk.gray("Setting Middleware..."));
    this.middleware = this.getValidMiddleware(middleware);
    console.log(chalk.gray("Done."));
  }

  setInjectors(injectors?: string | Injectors) {
    console.log("\n" + chalk.gray("Setting Injectors..."));
    this.injectors = this.getValidInjectors(injectors);
    console.log(chalk.gray("Done."));
  }

  setDb(db?: string | Db | { [key: string]: Omit<Object, "__config"> | any[] | string } | HAR,
    injectors: string | Injectors = this.injectors,
    options: { reverse?: boolean, isSnapshot?: boolean } = this.config,
    entryCallback?: (entry: object, routePath: string, routeConfig: RouteConfig) => Db,
    finalCallback?: (data: any, db: Db) => Db
  ) {
    console.log("\n" + chalk.gray("Setting Db..."));
    this.db = this.getValidDb(db, injectors, options, entryCallback, finalCallback);
    this.initialDb = _.cloneDeep(this.db);
    console.log(chalk.gray("Done."));
  }

  getDb = (ids: string[] = [], routePaths: string[] = []): Db => {
    if (!ids.length && !routePaths.length) return _.cloneDeep(this.db) as Db;
    const _routePaths = ids.map(id => Object.keys(this.db).find(r => this.db[r].id == id)).filter(Boolean) as string[];
    const routePathsList = [..._routePaths, ...routePaths];
    return _.cloneDeep(routePathsList.reduce((res, rp) => ({ ...res, [rp]: this.db[rp] }), {})) as Db;
  }

  setStore(store?: string | Store) {
    console.log("\n" + chalk.gray("Setting Store..."));
    this.store = this.getValidStore(store);
    this.initialStore = _.cloneDeep(this.store);
    console.log(chalk.gray("Done."));
  }

  setRewriters(rewriters?: string | Rewriters) {
    console.log("\n" + chalk.gray("Setting Rewriters..."));
    this.rewriters = this.getValidRewriters(rewriters);
    console.log(chalk.gray("Done."));
  }
}