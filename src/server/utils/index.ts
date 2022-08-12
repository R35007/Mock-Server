import chalk from "chalk";
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import { nanoid } from 'nanoid';
import * as path from 'path';
import { match } from 'path-to-regexp';
import * as Defaults from '../defaults';
import { DbMode, HAR, HarEntry, HarMiddleware, HIT, KIBANA, KibanaMiddleware } from '../types/common.types';
import * as UserTypes from '../types/user.types';
import * as ValidTypes from '../types/valid.types';
import { getValidRoute, getValidRouteConfig } from './validators';

// { "/route1,/route2": { ... } } -> { "/route1": {...}, "/route2": { ... } }
export const normalizeDb = <T>(object: T, mode: DbMode = Defaults.Config.mode): T => {
  const flattenedRoutes = {} as T;
  Object.entries(object)
    .forEach(([routePath, routeConfig]: [string, UserTypes.RouteConfig]) => {
      const routesChunk = routePath.split(",");
      routesChunk.map(getValidRoute).forEach(route => {
        flattenedRoutes[route] = getValidRouteConfig(route, routeConfig, mode);
      })
    })
  return flattenedRoutes;
}

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
    }

    const mergedMiddlewares = mergeMiddlewares(prevMiddlewares, currMiddlewares);
    injectedDb[route].middlewares = mergedMiddlewares;
    if (!mergedMiddlewares?.length) { delete injectedDb[route].middlewares; }

    delete injectedDb[route].routes;
    delete injectedDb[route].override;
    delete injectedDb[route].exact;
  }

  injectors.forEach((currInjectorConfig) => {
    const matchedRoutes = _.flatten(currInjectorConfig.routes.map(route => getMatchedRoutesList(route, db, currInjectorConfig.exact)));
    matchedRoutes.forEach(route => injectConfig(route, currInjectorConfig))
  })

  return _.cloneDeep({ ...db, ...injectedDb }) as ValidTypes.Db;
}

export const getMatchedRoutesList = (routeToMatch: string, db: UserTypes.Db, exact: boolean = false): string[] => {
  const matched = match(routeToMatch);
  return exact ?
    Object.keys(db).filter(r => r === routeToMatch) :
    Object.keys(db).filter(r => matched(r));
}

export const flatQuery = (data: any, isNumber?: boolean) => {
  const filterNumbers = (val) => !isNaN(val) && val !== undefined && val !== null;
  const result = _.flattenDeep([].concat(data).filter(Boolean).map((s: string) => s.split(",")))
    .map((s: string) => isNumber ? parseInt(s) : s)
    .filter(isNumber ? filterNumbers : Boolean);
  return result
}

export const replaceObj = (oldObj: object, newObj: object) => {
  for (let key in oldObj) {
    delete oldObj[key] // clearing all existing Route Config values.
  }
  for (let key in newObj) {
    oldObj[key] = newObj[key] // adding updated Route Config values
  }
}

export const createSampleFiles = (root: string = process.cwd()) => {
  console.log(chalk.gray('\nCreating Samples...'));
  fs.copySync(path.join(__dirname, '../../../samples'), root)
  console.log(chalk.gray('Sample files created!'));
}

export const cleanObject = (obj: any) => {
  try {
    for (let key in obj) {
      if (obj[key] === null || obj[key] === undefined) delete obj[key]; // delete if null or undefined
      if (obj[key] !== undefined && !_.toString(obj[key]).trim()) delete obj[key]; // delete if empty string
      if (obj[key] !== undefined && _.toString(obj[key]) === 'NaN') delete obj[key]; // delete if NaN
      if (obj[key] !== undefined && typeof obj[key] === 'object' && _.isEmpty(obj[key])) delete obj[key]; // delete If empty object 
      if (obj[key] !== undefined && !_.isEmpty(obj[key]) && _.isPlainObject(obj[key])) cleanObject(obj[key]); // cleanObject if the value is object
    }
  } catch (err) { }
}

export const cleanDb = (db: ValidTypes.Db | UserTypes.Db) => {
  for (let routePath in db) {
    db[routePath] = cleanRouteConfig(db[routePath] as UserTypes.RouteConfig);
  }
}

// Removes id, _config ( if only mock is available ) and all other empty values in route configs
export const cleanRouteConfig = (routeConfig: ValidTypes.RouteConfig | UserTypes.RouteConfig): UserTypes.RouteConfig => {
  if (!routeConfig._config) return routeConfig; // clean routeConfig only if _config is set to true

  let userTypeRouteConfig = routeConfig as any;
  delete userTypeRouteConfig.id;

  // Remove all empty list and objects
  cleanObject(userTypeRouteConfig);

  const routeConfigKeys = Object.keys(userTypeRouteConfig);
  if (routeConfigKeys.length === 1 && routeConfigKeys[0] === '_config') { delete userTypeRouteConfig._config; }
  if (routeConfigKeys.length === 2 && (routeConfigKeys.includes("_config") && routeConfigKeys.includes("mock"))) { userTypeRouteConfig = userTypeRouteConfig.mock; }

  return userTypeRouteConfig as UserTypes.RouteConfig;
}

export const isCollection = (arr: any[]): boolean => {
  if (!_.isArray(arr)) return false;
  if (!arr.every(i => _.isPlainObject(i))) return false;
  return true;
}

const getURLPathName = (url = '') => {
  try {
    return new URL(url)?.pathname || '';
  } catch (error) {
    return '';
  }
}

const getParsedJSON = (json = '') => {
  try {
    return JSON.parse(json)
  } catch (error) {
    return json;
  }
}

const getDbFromHarEntries = (entries: HarEntry[], _harEntryCallback?: HarMiddleware["_harEntryCallback"], iterateDuplicateRoutes: boolean = false) => {

  let generatedDb = {};

  entries.forEach((entry: HarEntry) => {
    const route = getURLPathName(entry?.request?.url);
    const mock = getParsedJSON(entry?.response?.content?.text);

    if (!route) return;

    let routePath: string = getValidRoute(route || '');
    let routeConfig: UserTypes.RouteConfig = {
      _config: true,
      mock
    }

    if (_.isFunction(_harEntryCallback)) {
      const routes = _harEntryCallback(entry, routePath, routeConfig) || {};
      [routePath, routeConfig] = Object.entries(routes)[0] || [];
      routeConfig = getValidRouteConfig(routePath, routeConfig, Defaults.Config.mode);
    }
    routePath && routeConfig && setRouteRedirects(generatedDb, routePath, routeConfig, iterateDuplicateRoutes);
  });

  cleanDb(generatedDb as UserTypes.Db);

  return generatedDb as UserTypes.Db;
}

const getDbFromKibanaHits = (hits: HIT[], _kibanaHitCallback?: KibanaMiddleware["_kibanaHitsCallback"], iterateDuplicateRoutes: boolean = false) => {

  let generatedDb = {};

  hits.forEach((hit: HIT) => {
    const route = getURLPathName(hit?._source?.requestURI);
    const mock = getParsedJSON(hit?._source?.response);

    if (!route) return;

    let routePath: string = getValidRoute(route || '');
    let routeConfig: UserTypes.RouteConfig = {
      _config: true,
      mock
    }

    if (_.isFunction(_kibanaHitCallback)) {
      const routes = _kibanaHitCallback(hit, routePath, routeConfig) || {};
      [routePath, routeConfig] = Object.entries(routes)[0] || [];
      routeConfig = getValidRouteConfig(routePath, routeConfig, Defaults.Config.mode);
    }
    routePath && routeConfig && setRouteRedirects(generatedDb, routePath, routeConfig, iterateDuplicateRoutes);
  });

  cleanDb(generatedDb as UserTypes.Db);

  return generatedDb as UserTypes.Db;
}

const setRouteRedirects = (db: object, routePath: string, currentRouteConfig: UserTypes.RouteConfig, iterateDuplicateRoutes: boolean = false) => {
  if (iterateDuplicateRoutes && db[routePath]) {
    const existingConfig = db[routePath];
    if (db[routePath].middlewares?.[0] !== "_IterateRoutes") {
      const iterateRoute1 = getValidRoute(routePath + "/" + nanoid(5))
      const iterateRoute2 = getValidRoute(routePath + "/" + nanoid(5))
      db[routePath] = {
        _config: true,
        mock: [iterateRoute1, iterateRoute2],
        middlewares: ["_IterateRoutes"]
      }
      db[iterateRoute1] = existingConfig;
      db[iterateRoute2] = currentRouteConfig;
    } else {
      const iterateRoute = getValidRoute(routePath + "/" + nanoid(5))
      db[routePath].mock.push(iterateRoute);
      db[iterateRoute] = currentRouteConfig;
    }
  } else {
    db[routePath] = currentRouteConfig;
  }
}

const mergeMiddlewares = (prevMiddlewares?: UserTypes.Middleware_Config[], currMiddlewares?: UserTypes.Middleware_Config[]): UserTypes.Middleware_Config[] | undefined => {

  if (!currMiddlewares) return prevMiddlewares;

  const mergedMiddlewares = currMiddlewares
    .reduce((result: UserTypes.Middleware_Config[], middleware) => middleware === "..."
      ? [...result, ...(prevMiddlewares || [])]
      : [...result, middleware], [])

  return [...new Set(mergedMiddlewares)];
}

export const extractDbFromHAR = (
  har: HAR,
  _harEntryCallback: HarMiddleware["_harEntryCallback"],
  _harDbCallback: HarMiddleware["_harDbCallback"],
  allowDuplicates: boolean = false,
) => {
  try {
    const entries: HarEntry[] = har?.log?.entries;
    const isHAR: boolean = entries?.length > 0;
    if (!isHAR) return;
    const dbFromHar: UserTypes.Db = getDbFromHarEntries(entries, _harEntryCallback, allowDuplicates);
    return _harDbCallback?.(har, dbFromHar) || dbFromHar
  } catch (err) {
    console.log(err);
    return
  }
}

export const extractDbFromKibana = (
  kibana: KIBANA,
  _kibanaHitsCallback: KibanaMiddleware["_kibanaHitsCallback"],
  _KibanaDbCallback: KibanaMiddleware["_kibanaDbCallback"],
  allowDuplicates: boolean = false
) => {
  try {
    const hits: HIT[] = kibana?.rawResponse?.hits?.hits;
    const isKibana: boolean = hits?.length > 0;
    if (!isKibana) return;
    const dbFromHits: UserTypes.Db = getDbFromKibanaHits(hits, _kibanaHitsCallback, allowDuplicates);
    return _KibanaDbCallback?.(kibana, dbFromHits) || dbFromHits
  } catch (err) {
    console.log(err);
    return
  }
}

export const toBase64 = (value: string = '') => { try { return Buffer.from(value).toString("base64") } catch { return value } };

// Helps to convert template literal strings to applied values.
// Ex : Object = { config: { host: "localhost", port: 3000 } } , format = "${config.host}:${config.port}" -> "localhost:3000"
export const interpolate = (object: Object, format: string = "") => {
  try {
    const keys = _.keys(object);
    const values = _.values(object);
    return new Function(...keys, `return \`${format}\`;`)(...values);
  } catch (error) {
    console.log(error);
    return format;
  }
};


