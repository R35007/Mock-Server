import chalk from "chalk";
import * as _ from "lodash";
import Default_Config from './config';
import { Initials } from './initials';
import Default_Middlewares from './middlewares';
import {
  Config, Db, HAR, HarEntry, Injector, KeyValString, Middleware,
  RouteConfig, UserConfig, UserDb, UserInjectors, UserMiddleware, UserStore, User_Config
} from "./model";
import {
  getInjectedDb, getDbFromEntries, getDbSnapShot,
  normalizeRoutes as normalizeDb, validRoute
} from './utils';
import {
  getStats, parseUrl, requireData
} from './utils/fetch';

export class Validators extends Initials {

  getValidConfig = (config?: UserConfig): Config => {
    const userConfig = requireData(config, Default_Config.root) as User_Config;

    if (_.isEmpty(userConfig)) {
      console.log(chalk.yellow("  Oops, Config doesn't seem to exist."));
      console.log(chalk.yellow("  Using default Config."));
      return _.cloneDeep(Default_Config);
    }

    const parsedRoot = parseUrl(userConfig.root, Default_Config.root);
    const root = getStats(parsedRoot)?.isDirectory ? parsedRoot : Default_Config.root

    const valid_Config = {
      ...userConfig,
      root,
      base: userConfig.base && validRoute(userConfig.base) !== "/" ? validRoute(userConfig.base) : Default_Config.base,
      staticDir: userConfig.staticDir && getStats(parseUrl(userConfig.staticDir, root))?.isDirectory ? parseUrl(userConfig.staticDir, root) : Default_Config.staticDir,
    };

    return { ...Default_Config, ...valid_Config } as Config;
  };

  getValidMiddleware = (middleware?: UserMiddleware): Middleware => {
    const userMiddlewares = requireData(middleware, this.config.root) as Middleware;

    if (_.isEmpty(userMiddlewares)) {
      console.log(chalk.yellow("  Oops, Middlewares doesn't seem to exist."));
      return { ...Default_Middlewares }
    }

    const valid_middlewares = Object.keys(userMiddlewares)
      .filter(um => _.isFunction(userMiddlewares[um]))
      .reduce((result, um) => ({ ...result, [um]: userMiddlewares[um] }), {})
    return { ...Default_Middlewares, ...valid_middlewares };
  }

  getValidInjectors = (injectors?: UserInjectors): { [key: string]: Injector } => {
    const userInjectors = requireData(injectors, this.config.root) as Db;

    if (_.isEmpty(userInjectors)) {
      console.log(chalk.yellow("  Oops, Injectors doesn't seem to exist."));
      return {}
    }

    const flattenedInjectors = normalizeDb(userInjectors, true) as { [key: string]: Injector };
    return flattenedInjectors;
  };

  getValidStore = (store?: UserStore): Object => {
    const userStore = requireData(store, this.config.root) as Object;

    if (_.isEmpty(userStore)) {
      console.log(chalk.yellow("  Oops, Store doesn't seem to exist."));
      return {}
    }

    return userStore;
  };

  getValidRewriters = (rewriters?: UserStore): KeyValString => {
    const userRewriters = requireData(rewriters, this.config.root) as KeyValString;

    if (_.isEmpty(userRewriters)) {
      console.log(chalk.yellow("  Oops, Route Rewriters doesn't seem to exist."));
      return {}
    }

    return userRewriters;
  };

  getValidDb = (
    data?: UserDb | HAR,
    injectors: UserInjectors = this.injectors,
    options?: { reverse?: boolean, isSnapshot?: boolean },
    entryCallback?: (entry: object, routePath: string, routeConfig: RouteConfig) => Db,
    finalCallback?: (data: any, db: Db) => Db,
  ): Db => {
    let userData = requireData(data, this.config.root) as Db | HAR;

    if (_.isEmpty(userData)) {
      console.log(chalk.yellow("  Oops, Db doesn't seem to exist."));
      return {}
    }

    const entries: HarEntry[] = (userData as HAR)?.log?.entries;
    const dataFromEntries: Db = entries ? getDbFromEntries(entries, entryCallback) : userData as Db;

    const normalizedDb = normalizeDb(dataFromEntries);
    const injectedDb = getInjectedDb(normalizedDb, this.getValidInjectors(injectors));

    const reverse = options ? options.reverse : this.config.reverse;

    const validDb = reverse
      ? _.fromPairs(Object.entries(injectedDb).reverse())
      : injectedDb;

    const generatedDb = options?.isSnapshot ? getDbSnapShot(validDb) : _.cloneDeep(validDb) as Db;

    if (finalCallback && _.isFunction(finalCallback)) {
      return finalCallback(data, generatedDb) || {};
    }

    return generatedDb;
  };
}
