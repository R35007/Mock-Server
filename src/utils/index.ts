import * as cjson from 'comment-json';
import * as _ from 'lodash';
import { nanoid } from 'nanoid';
import { match } from 'path-to-regexp';
import * as Defaults from '../defaults';
import type { DbMode, HAR, HarEntry, HarMiddleware, HIT, KIBANA, KibanaMiddleware } from '../types/common.types';
import type * as UserTypes from '../types/user.types';
import type * as ValidTypes from '../types/valid.types';
import { getValidRoute, getValidRouteConfig } from './validators';

// { "/route1,/route2": { ... } } -> { "/route1": {...}, "/route2": { ... } }
export const normalizeDb = (object: UserTypes.Db, dbMode: DbMode = Defaults.Config.dbMode): UserTypes.Db => {
  const normalizedDbEntries = Object.entries(object)
    .map(([routePath, routeConfig]) => {
      return routePath.split(',').map((route) => {
        const validRoute = getValidRoute(route);
        return [validRoute, getValidRouteConfig(validRoute, routeConfig, dbMode)];
      });
    })
    .flat();
  return _.fromPairs(normalizedDbEntries) as UserTypes.Db;
};

// Combines Injector Configs with the Db Configs
export const getInjectedDb = (db: UserTypes.Db, injectors: ValidTypes.Injectors): ValidTypes.Db => {
  const injectedDb = {};

  const injectConfig = (route: string, currInjectorConfig: ValidTypes.InjectorConfig) => {
    const prevDbConfig = (db[route] || {}) as ValidTypes.RouteConfig;
    const prevInjectorConfig = (injectedDb[route] || {}) as ValidTypes.RouteConfig;

    const prevMiddlewares = prevInjectorConfig.middlewares?.length ? prevInjectorConfig.middlewares : prevDbConfig.middlewares;
    const currMiddlewares = currInjectorConfig.middlewares;

    injectedDb[route] = {
      ...currInjectorConfig,
      ...prevDbConfig,
      ...prevInjectorConfig,
      ...(currInjectorConfig.override ? currInjectorConfig : {}),
    };

    const mergedMiddlewares = mergeMiddlewares(prevMiddlewares, currMiddlewares);
    injectedDb[route].middlewares = mergedMiddlewares;
    if (!mergedMiddlewares?.length) {
      delete injectedDb[route].middlewares;
    }

    delete injectedDb[route].routes;
    delete injectedDb[route].override;
    delete injectedDb[route].exact;
  };

  injectors.forEach((currInjectorConfig) => {
    const matchedRoutes = _.flatten(currInjectorConfig.routes.map((route) => getMatchedRoutesList(route, db, currInjectorConfig.exact)));
    matchedRoutes.forEach((route) => injectConfig(route, currInjectorConfig));
  });

  return _.cloneDeep({ ...db, ...injectedDb }) as ValidTypes.Db;
};

export const getMatchedRoutesList = (routeToMatch: string, db: UserTypes.Db, exact = false): string[] => {
  const matched = match(routeToMatch);
  return exact ? Object.keys(db).filter((r) => r === routeToMatch) : Object.keys(db).filter((r) => matched(r));
};

export const flatQuery = (data: any, isNumber?: boolean) => {
  const filterNumbers = (val) => !isNaN(val) && val !== undefined && val !== null;
  const result = _.flattenDeep(
    []
      .concat(data)
      .filter(Boolean)
      .map((s: string) => s.split(','))
  )
    .map((s: string) => (isNumber ? parseInt(s) : s))
    .filter(isNumber ? filterNumbers : Boolean);
  return result;
};

export const replaceObj = (oldObj: object, newObj: object) => {
  for (const key in oldObj) {
    delete oldObj[key]; // clearing all existing Route Config values.
  }
  for (const key in newObj) {
    oldObj[key] = newObj[key]; // adding updated Route Config values
  }
};

export const cleanObject = (obj: any) => {
  try {
    for (const key in obj) {
      if (obj[key] === null || obj[key] === undefined) delete obj[key]; // delete if null or undefined
      if (obj[key] !== undefined && !_.toString(obj[key]).trim()) delete obj[key]; // delete if empty string
      if (obj[key] !== undefined && _.toString(obj[key]) === 'NaN') delete obj[key]; // delete if NaN
      if (obj[key] !== undefined && typeof obj[key] === 'object' && _.isEmpty(obj[key])) delete obj[key]; // delete If empty object
      if (obj[key] !== undefined && !_.isEmpty(obj[key]) && _.isPlainObject(obj[key])) cleanObject(obj[key]); // cleanObject if the value is object
    }
  } catch (err: any) {}
};

export const getCleanDb = (db: ValidTypes.Db, dbMode: DbMode = 'mock'): UserTypes.Db => {
  for (const routePath in db) {
    db[routePath] = getDataByDbMode(db[routePath], dbMode);
  }
  return db;
};

export const getDbConfig = (db: ValidTypes.Db, dbMode: DbMode = 'mock'): UserTypes.Db => {
  for (const routePath in db) {
    if (!db[routePath]._config) return {};

    if (dbMode === 'multi') {
      delete db[routePath].fetch;
      delete db[routePath].mock;
    } else {
      if (dbMode === 'mock') delete db[routePath].mock;
      if (dbMode === 'fetch') delete db[routePath].fetch;
    }
  }
  return db;
};

const getDataByDbMode = (routeConfig, dbMode: DbMode = 'mock') => {
  const routeConfigKeys = Object.keys(routeConfig);

  if (!routeConfig._config) return routeConfig;

  if (dbMode === 'multi') {
    if (routeConfigKeys.includes('fetch') && _.isString(routeConfig.fetch)) return routeConfig.fetch;
    if (routeConfigKeys.includes('fetch') && !_.isString(routeConfig.fetch)) return routeConfig;
    if (routeConfigKeys.includes('mock') && _.isString(routeConfig.mock)) return routeConfig;
    if (routeConfigKeys.includes('mock') && !_.isString(routeConfig.mock)) return routeConfig.mock;
    return routeConfig;
  } else {
    if (dbMode === 'mock' && routeConfigKeys.includes('mock')) return routeConfig.mock;
    if (dbMode === 'fetch' && routeConfigKeys.includes('fetch')) return routeConfig.fetch;
    return routeConfig;
  }
};

export const isCollection = (arr: any[]): boolean => {
  if (!_.isArray(arr)) return false;
  if (!arr.every((i) => _.isPlainObject(i))) return false;
  return true;
};

export const getURLPathName = (url = '') => {
  try {
    return new URL(url)?.pathname || '';
  } catch (error: any) {
    return '';
  }
};

export const getParsedJSON = (json = '') => {
  try {
    return cjson.parse(json, undefined, true);
  } catch (error: any) {
    return json;
  }
};

const getDbFromHarEntries = (entries: HarEntry[], harEntryCallback?: HarMiddleware['harEntryCallback'], iterateDuplicateRoutes = false) => {
  const generatedDb = {};

  entries.forEach((entry: HarEntry) => {
    const route = getURLPathName(entry?.request?.url);
    const mock = getParsedJSON(entry?.response?.content?.text);

    if (!route) return;

    let routePath: string = getValidRoute(route || '');
    let routeConfig: UserTypes.RouteConfig = {
      _config: true,
      mock,
    };

    if (_.isFunction(harEntryCallback)) {
      const routes = harEntryCallback(entry, routePath, routeConfig) || {};
      [routePath, routeConfig] = Object.entries(routes)[0] || [];
      routeConfig = getValidRouteConfig(routePath, routeConfig, Defaults.Config.dbMode);
    }
    routePath && routeConfig && setRouteRedirects(generatedDb, routePath, routeConfig, iterateDuplicateRoutes);
  });

  return generatedDb as UserTypes.Db;
};

const getDbFromKibanaHits = (hits: HIT[], kibanaHitCallback?: KibanaMiddleware['kibanaHitsCallback'], iterateDuplicateRoutes = false) => {
  const generatedDb = {};

  hits.forEach((hit: HIT) => {
    const route = getURLPathName(hit?._source?.requestURI);
    const mock = getParsedJSON(hit?._source?.response);

    if (!route) return;

    let routePath: string = getValidRoute(route || '');
    let routeConfig: UserTypes.RouteConfig = {
      _config: true,
      mock,
    };

    if (_.isFunction(kibanaHitCallback)) {
      const routes = kibanaHitCallback(hit, routePath, routeConfig) || {};
      [routePath, routeConfig] = Object.entries(routes)[0] || [];
      routeConfig = getValidRouteConfig(routePath, routeConfig, Defaults.Config.dbMode);
    }
    routePath && routeConfig && setRouteRedirects(generatedDb, routePath, routeConfig, iterateDuplicateRoutes);
  });

  return generatedDb as UserTypes.Db;
};

const setRouteRedirects = (db: object, routePath: string, currentRouteConfig: UserTypes.RouteConfig, iterateDuplicateRoutes = false) => {
  if (iterateDuplicateRoutes && db[routePath]) {
    const existingConfig = db[routePath];
    if (db[routePath].middlewares?.[0] !== '_IterateRoutes') {
      const iterateRoute1 = getValidRoute(routePath + '/' + nanoid(5));
      const iterateRoute2 = getValidRoute(routePath + '/' + nanoid(5));
      db[routePath] = {
        _config: true,
        middlewares: ['_IterateRoutes'],
        mock: [iterateRoute1, iterateRoute2],
      };
      db[iterateRoute1] = existingConfig;
      db[iterateRoute2] = currentRouteConfig;
    } else {
      const iterateRoute = getValidRoute(routePath + '/' + nanoid(5));
      db[routePath].mock.push(iterateRoute);
      db[iterateRoute] = currentRouteConfig;
    }
  } else {
    db[routePath] = currentRouteConfig;
  }
};

const mergeMiddlewares = (
  prevMiddlewares?: UserTypes.MiddlewareConfig[],
  currMiddlewares?: UserTypes.MiddlewareConfig[]
): UserTypes.MiddlewareConfig[] | undefined => {
  if (!currMiddlewares) return prevMiddlewares;

  const mergedMiddlewares = currMiddlewares.reduce(
    (result: UserTypes.MiddlewareConfig[], middleware) =>
      middleware === '...' ? [...result, ...(prevMiddlewares || [])] : [...result, middleware],
    []
  );

  return [...new Set(mergedMiddlewares)];
};

export const extractDbFromHAR = (
  har: HAR,
  harEntryCallback: HarMiddleware['harEntryCallback'],
  harDbCallback: HarMiddleware['harDbCallback'],
  iterateDuplicateRoutes = false
): UserTypes.Db | undefined => {
  try {
    const entries: HarEntry[] = har?.log?.entries;
    const isHAR: boolean = entries?.length > 0;
    if (!isHAR) return;
    const dbFromHar: UserTypes.Db = getDbFromHarEntries(entries, harEntryCallback, iterateDuplicateRoutes);
    return harDbCallback?.(har, dbFromHar) || dbFromHar;
  } catch (err: any) {
    console.error(err.message);
  }
};

export const extractDbFromKibana = (
  kibana: KIBANA,
  kibanaHitsCallback: KibanaMiddleware['kibanaHitsCallback'],
  KibanaDbCallback: KibanaMiddleware['kibanaDbCallback'],
  iterateDuplicateRoutes = false
): UserTypes.Db | undefined => {
  try {
    const hits: HIT[] = kibana?.rawResponse?.hits?.hits;
    const isKibana: boolean = hits?.length > 0;
    if (!isKibana) return;
    const dbFromHits: UserTypes.Db = getDbFromKibanaHits(hits, kibanaHitsCallback, iterateDuplicateRoutes);
    return KibanaDbCallback?.(kibana, dbFromHits) || dbFromHits;
  } catch (err: any) {
    console.error(err.message);
  }
};

export const toBase64 = (value = '') => {
  try {
    return Buffer.from(value).toString('base64');
  } catch {
    return value;
  }
};

// Helps to convert template literal strings to applied values.
// Ex : Object = { config: { host: "localhost", port: 3000 } } , format = "${config.host}:${config.port}" -> "localhost:3000"
export const interpolate = (object: object, format = '') => {
  try {
    const keys = _.keys(object);
    const values = _.values(object);
    // eslint-disable-next-line no-new-func
    return new Function(...keys, `return \`${format}\`;`)(...values);
  } catch (error: any) {
    console.error(error.message);
    return format;
  }
};

export const prefixed = (prefix: string, object: object): object => {
  const entries = Object.entries(object).map(([route, routeConfig]) => {
    const prefixedRoute = getValidRoute(`${getValidRoute(prefix)}/${getValidRoute(route)}`);
    return [prefixedRoute, routeConfig];
  });
  return _.fromPairs(entries);
};
