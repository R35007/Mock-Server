import express from "express";
import ip from 'ip';
import * as _ from "lodash";
import { getInjectedDb, isCollection, normalizeDb, toBase64 } from '.';
import * as Defaults from '../defaults';
import { DbMode, DbValidatorOptions, ValidatorOptions } from '../types/common.types';
import * as ParamTypes from "../types/param.types";
import * as UserTypes from "../types/user.types";
import * as ValidTypes from "../types/valid.types";
import { getStats, parseUrl, requireData } from './fetch';

export const getValidConfig = (
  config?: ParamTypes.Config,
  { rootPath = Defaults.Config.rootPath, mockServer }: ValidatorOptions = {}
): ValidTypes.Config => {
  const requiredData = requireData(config, { rootPath });
  const userConfig: UserTypes.Config = _.isFunction(requiredData) ? requiredData(mockServer) : requiredData;

  if (_.isEmpty(userConfig) || !_.isPlainObject(userConfig)) return _.cloneDeep(Defaults.Config);

  const parsedRoot = parseUrl(userConfig.rootPath, Defaults.Config.rootPath);
  const root = getStats(parsedRoot)?.isDirectory ? parsedRoot : Defaults.Config.rootPath;

  const validConfig = {
    ...userConfig,
    rootPath: root,
    dbMode: ['multi', 'fetch', 'mock'].includes(userConfig.dbMode || '') ? userConfig.dbMode : Defaults.Config.dbMode,
    port: _.isNaN(parseInt(userConfig.port as any)) ? Defaults.Config.port : parseInt(userConfig.port as any),
    host: (`${userConfig.host}`).trim() === '' ? ip.address() : _.isEmpty(userConfig.host) ? Defaults.Config.host : userConfig.host,
    base: userConfig.base && getValidRoute(userConfig.base) !== "/" ? getValidRoute(userConfig.base) : Defaults.Config.base,
    staticDir: typeof userConfig.staticDir !== 'undefined' ? parseUrl(userConfig.staticDir, root) : Defaults.Config.staticDir,
  };

  return { ...Defaults.Config, ...validConfig } as ValidTypes.Config;
};

export const getValidMiddlewares = (
  middlewares?: ParamTypes.Middlewares,
  { rootPath = Defaults.Config.rootPath, mockServer }: ValidatorOptions = {}
): ValidTypes.Middlewares => {
  const requiredData = requireData(middlewares, { rootPath });
  const userMiddlewares: UserTypes.Middlewares = _.isFunction(requiredData) ? requiredData(mockServer) : requiredData;

  if (_.isEmpty(userMiddlewares) || !_.isPlainObject(userMiddlewares)) return _.cloneDeep(Defaults.Middlewares);

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

export const getValidInjectors = (
  injectors?: ParamTypes.Injectors,
  { rootPath = Defaults.Config.rootPath, mockServer }: ValidatorOptions = {}
): ValidTypes.Injectors => {
  const requiredData = requireData(injectors, { rootPath, isList: true });
  const userInjectors: UserTypes.InjectorConfig = _.isFunction(requiredData) ? requiredData(mockServer) : requiredData;

  if (_.isEmpty(userInjectors) || !_.isArray(userInjectors) || !isCollection(userInjectors)) return _.cloneDeep(Defaults.Injectors);

  const validInjectors = userInjectors.map(getValidInjectorConfig);

  return validInjectors;
};

export const getValidStore = (
  store?: ParamTypes.Store,
  { rootPath = Defaults.Config.rootPath, mockServer }: ValidatorOptions = {}
): ValidTypes.Store => {
  const requiredData = requireData(store, { rootPath });
  const userStore: UserTypes.Store = _.isFunction(requiredData) ? requiredData(mockServer) : requiredData;

  if (_.isEmpty(userStore) || !_.isPlainObject(userStore)) return _.cloneDeep(Defaults.Store);

  return userStore as ValidTypes.Store;
};

export const getValidRewriters = (
  rewriters?: ParamTypes.Rewriters,
  { rootPath = Defaults.Config.rootPath, mockServer }: ValidatorOptions = {}
): ValidTypes.Rewriters => {
  const requiredData = requireData(rewriters, { rootPath });
  const userRewriters: UserTypes.Rewriters = _.isFunction(requiredData) ? requiredData(mockServer) : requiredData;

  if (_.isEmpty(userRewriters) || !_.isPlainObject(userRewriters)) return _.cloneDeep(Defaults.Rewriters);

  return userRewriters as ValidTypes.Rewriters;
};

export const getValidDb = (
  data?: ParamTypes.Db,
  {
    mockServer,
    injectors = Defaults.Injectors,
    rootPath = Defaults.Config.rootPath,
    reverse = Defaults.Config.reverse,
    dbMode = Defaults.Config.dbMode
  }: DbValidatorOptions = {}
): ValidTypes.Db => {
  const requiredData = requireData(data, { rootPath });
  const userData: UserTypes.Db = _.isFunction(requiredData) ? requiredData(mockServer) : requiredData;

  if (_.isEmpty(userData) || !_.isPlainObject(userData)) return _.cloneDeep(Defaults.Db);

  const normalizedDb = normalizeDb(userData, dbMode);
  const injectedDb = getInjectedDb(normalizedDb, getValidInjectors(injectors, { rootPath, mockServer }));

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