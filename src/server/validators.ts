import chalk from "chalk";
import * as _ from "lodash";
import Default_Config from './config';
import { Initials } from './initials';
import Default_Middlewares from './middlewares';
import {
  Config, Db, HAR, HarEntry, Injectors, Middlewares, Rewriters, RouteConfig, Store
} from "./model";
import { getDbFromEntries as getDbFromHAREntries, getDbSnapShot, getInjectedDb, isCollection, normalizeRoutes as normalizeDb, validRoute } from './utils';
import {
  getStats, parseUrl, requireData
} from './utils/fetch';

export class Validators extends Initials {

  getValidConfig = (config?: string | Partial<Config>): Config => {
    const userConfig = requireData(config, Default_Config.root) as Partial<Config>;

    if (_.isEmpty(userConfig) || !_.isPlainObject(userConfig)) {
      console.log(chalk.yellow("  Oops, Config doesn't seem to exist."));
      console.log(chalk.yellow("  Using default Config."));
      return _.cloneDeep(Default_Config);
    }

    const parsedRoot = parseUrl(userConfig.root, Default_Config.root);
    const root = getStats(parsedRoot)?.isDirectory ? parsedRoot.replace(/\\/g, "/") : Default_Config.root;
    const isPortNaN = isNaN(parseInt(userConfig.port as any));

    const valid_Config = {
      ...userConfig,
      root,
      port: isPortNaN ? Default_Config.port : parseInt(userConfig.port as any),
      host: userConfig.host && _.isString(userConfig.host) ? userConfig.host : Default_Config.host,
      base: userConfig.base && validRoute(userConfig.base) !== "/" ? validRoute(userConfig.base) : Default_Config.base,
      staticDir: userConfig.staticDir && getStats(parseUrl(userConfig.staticDir, root))?.isDirectory ? parseUrl(userConfig.staticDir, root).replace(/\\/g, "/") : Default_Config.staticDir,
    };

    return { ...Default_Config, ...valid_Config } as Config;
  };

  getValidMiddleware = (middleware?: string | Partial<Middlewares>): Middlewares => {
    const userMiddlewares = requireData(middleware, this.config.root) as Partial<Middlewares>;

    if (_.isEmpty(userMiddlewares) || !_.isPlainObject(userMiddlewares)) {
      console.log(chalk.yellow("  Oops, Middlewares doesn't seem to exist."));
      return { ...Default_Middlewares }
    }

    const valid_middlewares = {};

    const middlewareNames = Object.keys(userMiddlewares);

    for (let name of middlewareNames) {
      if (_.isFunction(userMiddlewares[name])) {
        valid_middlewares[name] = userMiddlewares[name];
      } else if (_.isArray(userMiddlewares[name])) {
        const validMiddlewaresList = (userMiddlewares[name] as []).filter(m => _.isFunction(m));
        validMiddlewaresList.length && (valid_middlewares[name] = validMiddlewaresList);
      }
    }

    return { ...Default_Middlewares, ...valid_middlewares };
  }

  getValidInjectors = (injectors?: string | Injectors): Injectors => {
    const userInjectors = requireData(injectors, this.config.root, true) as Injectors;

    if (_.isEmpty(userInjectors) || !_.isArray(userInjectors) || !isCollection(userInjectors)) {
      console.log(chalk.yellow("  Oops, Injectors doesn't seem to exist."));
      return []
    }

    return userInjectors;
  };

  getValidStore = (store?: string | Store): Store => {
    const userStore = requireData(store, this.config.root) as Object;

    if (_.isEmpty(userStore) || !_.isPlainObject(userStore)) {
      console.log(chalk.yellow("  Oops, Store doesn't seem to exist."));
      return {}
    }

    return userStore;
  };

  getValidRewriters = (rewriters?: string | Rewriters): Rewriters => {
    const userRewriters = requireData(rewriters, this.config.root) as Rewriters;

    if (_.isEmpty(userRewriters) || !_.isPlainObject(userRewriters)) {
      console.log(chalk.yellow("  Oops, Route Rewriters doesn't seem to exist."));
      return {}
    }

    return userRewriters;
  };

  getValidDb = (
    data?: string | Db | { [key: string]: Omit<Object, "__config"> | any[] | string } | HAR,
    injectors: string | Injectors = this.injectors,
    options?: { reverse?: boolean, isSnapshot?: boolean },
    entryCallback?: (entry: HarEntry, routePath: string, routeConfig: RouteConfig) => Db,
    finalCallback?: (data: any, db: Db) => Db,
  ): Db => {
    let userData = requireData(data, this.config.root) as Db | HAR;

    if (_.isEmpty(userData) || !_.isPlainObject(userData)) {
      console.log(chalk.yellow("  Oops, Db doesn't seem to exist."));
      return {}
    }

    const _entryCallback = (entryCallback || this.middleware["_entryCallback"]);
    const _finalCallback = (finalCallback || this.middleware["_finalCallback"]);

    const entries: HarEntry[] = (userData as HAR)?.log?.entries;
    const dataFromEntries: Db = entries ? getDbFromHAREntries(entries, _entryCallback) : userData as Db;

    const normalizedDb = normalizeDb(dataFromEntries);
    const injectedDb = getInjectedDb(normalizedDb, this.getValidInjectors(injectors));

    const reverse = options ? options.reverse : this.config.reverse;

    const validDb = reverse
      ? _.fromPairs(Object.entries(injectedDb).reverse())
      : injectedDb;

    const generatedDb = options?.isSnapshot ? getDbSnapShot(validDb) : _.cloneDeep(validDb) as Db;

    if (_finalCallback && _.isFunction(_finalCallback)) {
      return _finalCallback(data!, generatedDb) || {};
    }

    return generatedDb;
  };
}
