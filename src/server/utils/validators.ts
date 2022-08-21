import chalk from "chalk";
import express from "express";
import * as _ from "lodash";
import { getInjectedDb, isCollection, normalizeDb, toBase64 } from '.';
import * as Defaults from '../defaults';
import { DbMode, GetValidDbOptions, HAR } from '../types/common.types';
import * as ParamTypes from "../types/param.types";
import * as UserTypes from "../types/user.types";
import * as ValidTypes from "../types/valid.types";
import { getStats, parseUrl, requireData } from './fetch';

export const getValidConfig = (config?: ParamTypes.Config, rootPath: string = Defaults.Config.root): ValidTypes.Config => {
  const userConfig = requireData(config, rootPath) as UserTypes.Config;

  if (_.isEmpty(userConfig) || !_.isPlainObject(userConfig)) {
    console.log(chalk.yellow("  Oops, Config doesn't seem to exist."));
    console.log(chalk.yellow("  Using default Config."));
    return _.cloneDeep(Defaults.Config);
  }

  const parsedRoot = parseUrl(userConfig.root, Defaults.Config.root);
  const root = getStats(parsedRoot)?.isDirectory ? parsedRoot : Defaults.Config.root;
  const isPortNaN = isNaN(parseInt(userConfig.port as any));

  const validConfig = {
    ...userConfig,
    root,
    dbMode: ['multi', 'fetch', 'mock'].includes(userConfig.dbMode || '') ? userConfig.dbMode : Defaults.Config.dbMode,
    port: isPortNaN ? Defaults.Config.port : parseInt(userConfig.port as any),
    host: userConfig.host && _.isString(userConfig.host) ? userConfig.host : Defaults.Config.host,
    base: userConfig.base && getValidRoute(userConfig.base) !== "/" ? getValidRoute(userConfig.base) : Defaults.Config.base,
    staticDir: typeof userConfig.staticDir !== 'undefined' ? parseUrl(userConfig.staticDir, root) : Defaults.Config.staticDir,
  };

  return { ...Defaults.Config, ...validConfig } as ValidTypes.Config;
};

export const getValidMiddlewares = (middlewares?: ParamTypes.Middlewares, rootPath: string = Defaults.Config.root): ValidTypes.Middlewares => {
  const userMiddlewares = requireData(middlewares, rootPath) as UserTypes.Middlewares;

  if (_.isEmpty(userMiddlewares) || !_.isPlainObject(userMiddlewares)) {
    console.log(chalk.yellow("  Oops, Middlewares doesn't seem to exist."));
    return _.cloneDeep(Defaults.Middlewares);
  }

  const validMiddlewares: ValidTypes.Middlewares = {} as ValidTypes.Middlewares;

  const middlewareNames = Object.keys(userMiddlewares);
  for (let name of middlewareNames) {
    if (_.isFunction(userMiddlewares[name])) {
      validMiddlewares[name] = userMiddlewares[name]!;
    } else if (_.isArray(userMiddlewares[name])) {
      const validMiddlewaresList = (userMiddlewares[name] as []).filter(m => _.isFunction(m));
      validMiddlewaresList.length && (validMiddlewares[name] = validMiddlewaresList);
    }
  }

  if (_.isFunction(validMiddlewares._globals)) {
    validMiddlewares._globals = [validMiddlewares._globals]
  }

  return { ...Defaults.Middlewares, ...validMiddlewares };
}

export const getValidInjectors = (injectors?: ParamTypes.Injectors, rootPath: string = Defaults.Config.root): ValidTypes.Injectors => {
  const userInjectors = requireData(injectors, rootPath, true) as UserTypes.Injectors;

  if (_.isEmpty(userInjectors) || !_.isArray(userInjectors) || !isCollection(userInjectors)) {
    console.log(chalk.yellow("  Oops, Injectors doesn't seem to exist."));
    return _.cloneDeep(Defaults.Injectors);
  }

  const validInjectors = userInjectors.map(getValidInjectorConfig);

  return validInjectors;
};

export const getValidStore = (store?: ParamTypes.Store, rootPath: string = Defaults.Config.root): ValidTypes.Store => {
  const userStore = requireData(store, rootPath) as UserTypes.Store;

  if (_.isEmpty(userStore) || !_.isPlainObject(userStore)) {
    console.log(chalk.yellow("  Oops, Store doesn't seem to exist."));
    return _.cloneDeep(Defaults.Store);
  }

  return userStore as ValidTypes.Store;
};

export const getValidRewriters = (rewriters?: ParamTypes.Rewriters, rootPath: string = Defaults.Config.root): ValidTypes.Rewriters => {
  const userRewriters = requireData(rewriters, rootPath) as UserTypes.Rewriters;

  if (_.isEmpty(userRewriters) || !_.isPlainObject(userRewriters)) {
    console.log(chalk.yellow("  Oops, Route Rewriters doesn't seem to exist."));
    return _.cloneDeep(Defaults.Rewriters);
  }

  return userRewriters as ValidTypes.Rewriters;
};

export const getValidDb = (
  data?: ParamTypes.Db, 
  injectors: UserTypes.Injectors = Defaults.Injectors,
  rootPath: string = Defaults.Config.root,
  { reverse = Defaults.Config.reverse, dbMode = Defaults.Config.dbMode }: GetValidDbOptions = {},
): ValidTypes.Db => {
  const userData = requireData(data, rootPath) as HAR;

  if (_.isEmpty(userData) || !_.isPlainObject(userData)) {
    console.log(chalk.yellow("  Oops, Db doesn't seem to exist."));
    return _.cloneDeep(Defaults.Db);
  }

  const normalizedDb = normalizeDb(userData, dbMode);
  const injectedDb = getInjectedDb(normalizedDb, getValidInjectors(injectors));

  const validDb = reverse
    ? _.fromPairs(Object.entries(injectedDb).reverse())
    : injectedDb;

  return validDb;
};

export const getValidRouteConfig = <T extends UserTypes.RouteConfig>(route: string, routeConfig: T, dbMode: DbMode = Defaults.Config.dbMode): ValidTypes.RouteConfig => {
  if (_.isFunction(routeConfig)) return { _config: true, id: toBase64(route), middlewares: [routeConfig as express.RequestHandler], ignoreMiddlewareWrappers: true };

  if (!_.isPlainObject(routeConfig) || !routeConfig._config) {
    if (dbMode === 'multi' && _.isString(routeConfig)) return { _config: true, id: toBase64(route), fetch: routeConfig }
    if (dbMode === 'multi' && !_.isString(routeConfig)) return { _config: true, id: toBase64(route), mock: routeConfig }
    if (dbMode === 'mock') return { _config: true, id: toBase64(route), mock: routeConfig }
    if (dbMode === 'fetch') return { _config: true, id: toBase64(route), fetch: routeConfig as object }
  };

  routeConfig.id = `${routeConfig.id || ''}` || toBase64(route)

  if (routeConfig.middlewares) {
    routeConfig.middlewares = ([] as UserTypes.Middleware_Config[]).concat(routeConfig.middlewares as UserTypes.Middleware_Config || []);
    if (!routeConfig.middlewares.length) delete routeConfig.middlewares
  }
  return routeConfig as ValidTypes.RouteConfig
}

export const getValidInjectorConfig = (routeConfig: UserTypes.InjectorConfig): ValidTypes.InjectorConfig => {
  routeConfig.routes = ([] as string[]).concat(routeConfig.routes as string).map(getValidRoute);
  if (routeConfig.middlewares) {
    routeConfig.middlewares = ([] as UserTypes.Middleware_Config[]).concat(routeConfig.middlewares as UserTypes.Middleware_Config || []);
  }
  return routeConfig as ValidTypes.InjectorConfig
}

export const getValidRoute = (route: string): string => {
  const trimmedRoute = "/" + route.split('/')
    .filter(x => x.trim())
    .map(x => x.trim())
    .join('/');
  return trimmedRoute;
}