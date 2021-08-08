import chalk from "chalk";
import * as _ from 'lodash';
import {
  GetData, UserConfig, UserMiddleware, UserRewriters, UserDb, UserStore
} from './model';
import { Validators } from './validators';

export class GettersSetters extends Validators {

  constructor(
    config?: UserConfig,
    store?: UserStore,
  ) {
    super();
    console.log("\n" + chalk.blueBright("{^_^}/~ Hi!"));
    this.setConfig(config);
    !_.isEmpty(store) && this.setStore(store);
  }

  setData(
    db?: UserDb,
    middleware?: UserMiddleware,
    injectors?: UserDb,
    rewriters?: UserRewriters,
    config?: UserConfig,
    store?: UserStore
  ) {
    !_.isEmpty(config) && this.setConfig(config);
    !_.isEmpty(middleware) && this.setMiddleware(middleware);
    !_.isEmpty(injectors) && this.setInjectors(injectors);
    !_.isEmpty(store) && this.setStore(store);
    !_.isEmpty(db) && this.setDb(db);
    !_.isEmpty(rewriters) && this.setRewriters(rewriters);
  };

  get data(): GetData {
    return {
      db: this.db,
      injectors: this.injectors,
      middleware: this.middleware,
      rewriters: this.rewriters,
      config: this.config,
      store: this.store
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

  setDb(db?: UserDb) {
    console.log("\n" + chalk.gray("Setting Db..."));
    this.db = this.getValidDb(db);
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