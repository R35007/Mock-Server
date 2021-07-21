import chalk from "chalk";
import * as _ from "lodash";
import * as path from "path";
import pathToRegexp from 'path-to-regexp';
import { Initials } from './initials';
import {
  Config, HAR, HarEntry, Middlewares, RouteConfig, Routes, UserConfig,
  UserMiddlewares, UserRoutes, UserStore, User_Config
} from "./model";
import {
  getInjectedRoutes, getJSON, getRoutesFromEntries,
  getStats, isValidData, normalizeRoutes, parseUrl, validRoute
} from './utils';
import { Default_Config } from './utils/config';
import { Default_Middlewares } from './utils/middlewares';

export class Validators extends Initials {

  getValidConfig = (config?: UserConfig): Config => {

    if (!isValidData(config)) {
      console.log(chalk.gray("  Oops, Config not found. Using default Config"));
      return _.cloneDeep(Default_Config);
    }

    const userConfig = this.requireData(config, {}) as User_Config;

    const parsedRoot = parseUrl(userConfig.root, Default_Config.root);
    const root = getStats(parsedRoot)?.isDirectory ? parsedRoot : Default_Config.root

    const valid_Config = {
      ...userConfig,
      root,
      base: userConfig.base && validRoute(userConfig.base) !== "/" ? validRoute(userConfig.base) : Default_Config.base,
      static: !_.isEmpty(userConfig.static) && getStats(parseUrl(userConfig.static, root))?.isDirectory ? parseUrl(userConfig.static, root) : Default_Config.static,
    } as Config;

    return { ...Default_Config, ...valid_Config };
  };

  getValidMiddlewares = (middlewares?: UserMiddlewares): Middlewares => {
    if (!isValidData(middlewares)) return { ...Default_Middlewares };
    const userMiddlewares = this.requireData(middlewares, {}) as Middlewares;
    const valid_middlewares = Object.keys(userMiddlewares)
      .filter(um => _.isFunction(userMiddlewares[um]))
      .reduce((result, um) => ({ ...result, [um]: userMiddlewares[um] }), {})
    return { ...Default_Middlewares, ...valid_middlewares };
  }

  getValidInjectors = (injectors?: UserRoutes): Routes => {
    if (!isValidData(injectors)) return {} as Routes;
    const userInjectors = this.requireData(injectors, {}) as Routes;
    const flattenedInjectors = normalizeRoutes(userInjectors);
    return flattenedInjectors;
  };

  getValidStore = (store?: UserStore): Object => {
    if (!isValidData(store)) return {};
    const userStore = this.requireData(store, {}) as Object;
    return userStore;
  };

  getValidRewriter = (rewriter?: UserStore): { [key: string]: string } => {
    if (!isValidData(rewriter)) return {};
    const userRewriter = this.requireData(rewriter, {}) as { [key: string]: string };
    return userRewriter;
  };

  getValidRoutes = (
    routes?: UserRoutes | HAR,
    entryCallback?: (entry: object, routePath: string, routeConfig: RouteConfig, pathToRegexp) => Routes,
    finalCallback?: (harData: any, generatedMock: Routes, pathToRegexp) => Routes,
    options: { reverse: boolean } = this._config
  ): Routes => {
    let _routes = routes;
    if (!isValidData(routes)) {
      console.log(chalk.gray("  Oops, Routes not found. Using Sample Routes"));
      _routes = _.cloneDeep(this._sample_routes) as Routes;
    }

    const userRoutes = this.requireData(_routes, {}) as Routes | HAR;

    const entries: HarEntry[] = (userRoutes as HAR)?.log?.entries;
    const routesFromEntries: Routes = entries ? getRoutesFromEntries(entries, entryCallback) : userRoutes as Routes;

    const normalizedRoutes = normalizeRoutes(routesFromEntries);
    const injectedRoutes = getInjectedRoutes(normalizedRoutes, this._injectors);

    const valid_routes = options.reverse
      ? _.fromPairs(Object.entries(injectedRoutes).reverse())
      : injectedRoutes;

    const generatedRoutes = _.cloneDeep(valid_routes) as Routes;

    if (finalCallback && _.isFunction(finalCallback)) {
      return finalCallback(routes, generatedRoutes, pathToRegexp) || {};
    }

    return generatedRoutes;
  };

  requireData = (data: any, defaults: object): object => {
    if (_.isString(data)) {
      const parsedUrl = parseUrl(data, this._config.root);
      const stats = getStats(parsedUrl);
      if (!stats) return defaults;

      if (path.extname(parsedUrl) === '.js') {
        delete require.cache[parsedUrl];
        return require(parsedUrl);
      }
      return getJSON(parsedUrl);
    } else if (_.isPlainObject(data)) {
      return data
    }
    return _.cloneDeep(defaults);
  }
}
