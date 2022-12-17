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
  { root = Defaults.Config.root, mockServer }: ValidatorOptions = {}
): ValidTypes.Config => {
  const requiredData = requireData(config, { root });
  const userConfig: UserTypes.Config = _.isFunction(requiredData) ? requiredData(mockServer) : requiredData;

  if (_.isEmpty(userConfig) || !_.isPlainObject(userConfig)) return _.cloneDeep(Defaults.Config);

  const parsedRoot = parseUrl(userConfig.root, Defaults.Config.root);
  const _root = getStats(parsedRoot)?.isDirectory ? parsedRoot : Defaults.Config.root;

  const validConfig = {
    ...userConfig,
    root: _root,
    dbMode: ['multi', 'fetch', 'mock'].includes(userConfig.dbMode || '') ? userConfig.dbMode : Defaults.Config.dbMode,
    port: _.isNaN(parseInt(userConfig.port as any)) ? Defaults.Config.port : parseInt(userConfig.port as any),
    host: (`${userConfig.host}`).trim() === '' ? ip.address() : _.isEmpty(userConfig.host) ? Defaults.Config.host : userConfig.host,
    base: userConfig.base && getValidRoute(userConfig.base) !== "/" ? getValidRoute(userConfig.base) : Defaults.Config.base,
    static: typeof userConfig.static !== 'undefined' ? parseUrl(userConfig.static, _root) : Defaults.Config.static,
  };

  return { ...Defaults.Config, ...validConfig } as ValidTypes.Config;
};

export const getValidMiddlewares = (
  middlewares?: ParamTypes.Middlewares,
  { root = Defaults.Config.root, mockServer }: ValidatorOptions = {}
): ValidTypes.Middlewares => {
  const requiredData = requireData(middlewares, { root });
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

  if (_.isFunction(validMiddlewares.globals)) {
    validMiddlewares.globals = [validMiddlewares.globals]
  }

  if (_.isEmpty(validMiddlewares.globals)) {
    validMiddlewares.globals = [(_rq, _res, next) => { next() }]
  }

  return { ...Defaults.Middlewares, ...validMiddlewares };
}

export const getValidInjectors = (
  injectors?: ParamTypes.Injectors,
  { root = Defaults.Config.root, mockServer }: ValidatorOptions = {}
): ValidTypes.Injectors => {
  const requiredData = requireData(injectors, { root, isList: true });
  const userInjectors: UserTypes.InjectorConfig = _.isFunction(requiredData) ? requiredData(mockServer) : requiredData;

  if (_.isEmpty(userInjectors) || !_.isArray(userInjectors) || !isCollection(userInjectors)) return _.cloneDeep(Defaults.Injectors);

  const validInjectors = userInjectors.map(getValidInjectorConfig);

  return validInjectors;
};

export const getValidStore = (
  store?: ParamTypes.Store,
  { root = Defaults.Config.root, mockServer }: ValidatorOptions = {}
): ValidTypes.Store => {
  const requiredData = requireData(store, { root });
  const userStore: UserTypes.Store = _.isFunction(requiredData) ? requiredData(mockServer) : requiredData;

  if (_.isEmpty(userStore) || !_.isPlainObject(userStore)) return _.cloneDeep(Defaults.Store);

  return userStore as ValidTypes.Store;
};

export const getValidRewriters = (
  rewriters?: ParamTypes.Rewriters,
  { root = Defaults.Config.root, mockServer }: ValidatorOptions = {}
): ValidTypes.Rewriters => {
  const requiredData = requireData(rewriters, { root });
  const userRewriters: UserTypes.Rewriters = _.isFunction(requiredData) ? requiredData(mockServer) : requiredData;

  if (_.isEmpty(userRewriters) || !_.isPlainObject(userRewriters)) return _.cloneDeep(Defaults.Rewriters);

  return userRewriters as ValidTypes.Rewriters;
};

export const getValidDb = (
  data?: ParamTypes.Db,
  {
    mockServer,
    injectors = Defaults.Injectors,
    root = Defaults.Config.root,
    reverse = Defaults.Config.reverse,
    dbMode = Defaults.Config.dbMode
  }: DbValidatorOptions = {}
): ValidTypes.Db => {
  const requiredData = requireData(data, { root });
  const userData: UserTypes.Db = _.isFunction(requiredData) ? requiredData(mockServer) : requiredData;

  if (_.isEmpty(userData) || !_.isPlainObject(userData)) return _.cloneDeep(Defaults.Db);

  const normalizedDb = normalizeDb(userData, dbMode);
  const validInjectors = getValidInjectors(injectors, { root, mockServer });
  const injectedDb = getInjectedDb(normalizedDb, validInjectors);

  const validDb = reverse
    ? _.fromPairs(Object.entries(injectedDb).reverse())
    : injectedDb;

  return validDb;
};

export const getValidRouteConfig = (route: string, routeConfig: any, dbMode: DbMode = Defaults.Config.dbMode): ValidTypes.RouteConfig => {
  if (_.isFunction(routeConfig)) return { _config: true, id: toBase64(route), middlewares: [routeConfig as express.RequestHandler], directUse: true };

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