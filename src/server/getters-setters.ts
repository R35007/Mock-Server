import chalk from "chalk";
import * as _ from 'lodash';
import { Db, GetData, HAR, RouteConfig, UserConfig, UserDb, UserMiddleware, UserRewriters, UserStore } from './model';
import { Validators } from './validators';

export class GettersSetters extends Validators {

  constructor(
    config?: UserConfig,
  ) {
    super();
    console.log("\n" + chalk.blueBright("{^_^}/~ Hi!"));
    this.setConfig(config);
  }

  setData(
    db?: UserDb,
    middleware?: UserMiddleware,
    injectors?: UserDb,
    rewriters?: UserRewriters,
    store?: UserStore,
    config?: UserConfig,
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

  setConfig(config?: UserConfig) {
    console.log("\n" + chalk.gray("Setting Config..."));
    this.config = this.getValidConfig(config);
    console.log(chalk.gray("Done."));
  }

  setMiddleware(middleware?: UserMiddleware) {
    console.log("\n" + chalk.gray("Setting Middleware..."));
    this.middleware = this.getValidMiddleware(middleware);
    console.log(chalk.gray("Done."));
  }

  setInjectors(injectors?: UserDb) {
    console.log("\n" + chalk.gray("Setting Injectors..."));
    this.injectors = this.getValidInjectors(injectors);
    console.log(chalk.gray("Done."));
  }

  setDb(db?: UserDb | HAR,
    injectors: UserDb = this.injectors,
    options: { reverse: boolean } = this.config,
    entryCallback?: (entry: object, routePath: string, routeConfig: RouteConfig) => Db,
    finalCallback?: (data: any, db: Db) => Db
  ) {
    console.log("\n" + chalk.gray("Setting Db..."));
    this.db = this.getValidDb(db, injectors, options, entryCallback, finalCallback);
    this.initialDb = _.cloneDeep(this.db);
    console.log(chalk.gray("Done."));
  }

  setStore(store?: UserStore) {
    console.log("\n" + chalk.gray("Setting Store..."));
    this.store = this.getValidStore(store);
    this.initialStore = _.cloneDeep(this.store);
    console.log(chalk.gray("Done."));
  }

  setRewriters(rewriters?: UserRewriters) {
    console.log("\n" + chalk.gray("Setting Rewriters..."));
    this.rewriters = this.getValidRewriters(rewriters);
    console.log(chalk.gray("Done."));
  }
}