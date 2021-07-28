import chalk from "chalk";
import * as _ from "lodash";
import pathToRegexp from 'path-to-regexp';
import Default_Config from './config';
import { Initials } from './initials';
import Default_Middlewares from './middlewares';
import {
  Config, HAR, HarEntry, KeyValString, Middlewares, RouteConfig, Routes, UserConfig,
  UserMiddlewares, UserRoutes, UserStore, User_Config
} from "./model";
import Sample_Routes from './sample-routes';
import {
  getInjectedRoutes, getRoutesFromEntries,
  normalizeRoutes, validRoute
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

  getValidMiddlewares = (middlewares?: UserMiddlewares): Middlewares => {
    const userMiddlewares = requireData(middlewares, this.config.root) as Middlewares;

    if (_.isEmpty(userMiddlewares)) {
      console.log(chalk.yellow("  Oops, Middlewares doesn't seem to exist."));
      return { ...Default_Middlewares }
    }

    const valid_middlewares = Object.keys(userMiddlewares)
      .filter(um => _.isFunction(userMiddlewares[um]))
      .reduce((result, um) => ({ ...result, [um]: userMiddlewares[um] }), {})
    return { ...Default_Middlewares, ...valid_middlewares };
  }

  getValidInjectors = (injectors?: UserRoutes): Routes => {
    const userInjectors = requireData(injectors, this.config.root) as Routes;

    if (_.isEmpty(userInjectors)) {
      console.log(chalk.yellow("  Oops, Injectors doesn't seem to exist."));
      return {}
    }

    const flattenedInjectors = normalizeRoutes(userInjectors);
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

  getValidRewriterRoutes = (rewriterRoutes?: UserStore): KeyValString => {
    const userRewriterRoutes = requireData(rewriterRoutes, this.config.root) as KeyValString;

    if (_.isEmpty(userRewriterRoutes)) {
      console.log(chalk.yellow("  Oops, RewriterRoutes doesn't seem to exist."));
      return {}
    }

    return userRewriterRoutes;
  };

  getValidRoutes = (
    routes?: UserRoutes | HAR,
    entryCallback?: (entry: object, routePath: string, routeConfig: RouteConfig, pathToRegexp) => Routes,
    finalCallback?: (harData: any, generatedMock: Routes, pathToRegexp) => Routes,
    options: { reverse: boolean } = this.config
  ): Routes => {
    let userRoutes = requireData(routes, this.config.root) as Routes | HAR;

    if (_.isEmpty(userRoutes)) {
      console.log(chalk.yellow("  Oops, Routes doesn't seem to exist."));
      console.log(chalk.yellow("  Using Sample Routes with some default data."));
      userRoutes = _.cloneDeep(Sample_Routes) as Routes;
    }

    const entries: HarEntry[] = (userRoutes as HAR)?.log?.entries;
    const routesFromEntries: Routes = entries ? getRoutesFromEntries(entries, entryCallback) : userRoutes as Routes;

    const normalizedRoutes = normalizeRoutes(routesFromEntries);
    const injectedRoutes = getInjectedRoutes(normalizedRoutes, this.injectors);

    const valid_routes = options.reverse
      ? _.fromPairs(Object.entries(injectedRoutes).reverse())
      : injectedRoutes;

    const generatedRoutes = _.cloneDeep(valid_routes) as Routes;

    if (finalCallback && _.isFunction(finalCallback)) {
      return finalCallback(routes, generatedRoutes, pathToRegexp) || {};
    }

    return generatedRoutes;
  };
}
