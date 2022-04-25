import chalk from "chalk";
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import { nanoid } from 'nanoid';
import * as path from 'path';
import { match } from 'path-to-regexp';
import { Db, HarEntry, Injectors, RouteConfig } from '../model';

export const validRoute = (route: string): string => {
  const trimmedRoute = "/" + route.split('/')
    .filter(x => x.trim())
    .map(x => x.trim())
    .join('/');
  return trimmedRoute;
}

// { "/route1,/route2": { ... } } -> { "/route1": {...}, "/route2": { ... } }
export const normalizeRoutes = <T>(object: T): T => {
  const flattenedRoutes = {} as T;
  let index = 0;
  Object.entries(object)
    .forEach(([routePath, routeConfig]: [string, RouteConfig]) => {
      const routesChunk = routePath.split(",");
      routesChunk.map(validRoute).forEach(r => {
        index++;
        flattenedRoutes[r] = validRouteConfig(routeConfig, index);
      })
    })
  return flattenedRoutes;
}

// { "/route1": { ...mock } } -> { "/route1": { _config:true, id: "1", mock: { ...mock } } } 
const validRouteConfig = (routeConfig: RouteConfig, index: number): RouteConfig => {
  if (!_.isPlainObject(routeConfig)) return { _config: true, mock: routeConfig, id: `${index}` }

  if (!routeConfig._config) {
    return { _config: true, mock: routeConfig, id: `${index}` }
  }
  routeConfig.id = `${routeConfig.id || ''}` || `${index}`;
  return routeConfig
}

// Combines Injector Configs with the Db Configs
export const getInjectedDb = (db: Db, injectors: Injectors): Db => {
  const injectedDb = {};
  injectors.forEach((currentInjectorConfig) => {
    const matchedRoutes = _.flatten(currentInjectorConfig.routes.map(route => getMatchedRoutesList(route, db, currentInjectorConfig.exact)));
    const currentInjectorMiddlewareNames = currentInjectorConfig.middlewareNames;
    matchedRoutes.forEach(r => {
      const existingDbConfig = db[r] || {} as RouteConfig;
      const existingInjectorConfig = injectedDb[r] || {} as RouteConfig;
      const existingMiddlewareNames = existingInjectorConfig.middlewareNames?.length ? existingInjectorConfig.middlewareNames : existingDbConfig.middlewareNames || [];

      if (currentInjectorConfig.override) {
        injectedDb[r] = {
          ...existingDbConfig, ...existingInjectorConfig, ...currentInjectorConfig,
          middlewareNames: mergeArray(currentInjectorMiddlewareNames, existingMiddlewareNames)
        }
      } else {
        injectedDb[r] = {
          ...currentInjectorConfig, ...existingDbConfig, ...existingInjectorConfig,
          middlewareNames: mergeArray(currentInjectorMiddlewareNames, existingMiddlewareNames)
        }
      }

      if (injectedDb[r].fetch === undefined) {
        delete injectedDb[r].fetchCount;
        delete injectedDb[r].skipFetchError;
      }
      delete injectedDb[r].routes;
      delete injectedDb[r].override;
      delete injectedDb[r].exact;
      !injectedDb[r].middlewareNames.length && (delete injectedDb[r].middlewareNames)
    })
  })

  return _.cloneDeep({ ...db, ...injectedDb }) as Db;
}

export const getMatchedRoutesList = (routeToMatch: string, db: Db, exact: boolean = false): string[] => {
  const matched = match(routeToMatch);
  return exact ?
    Object.keys(db).filter(r => r === routeToMatch) :
    Object.keys(db).filter(r => matched(r));
}

export const getDbFromEntries = (
  entries: HarEntry[],
  entryCallback?: (entry: HarEntry, routePath: string, routeConfig: RouteConfig) => Db,
) => {

  let generatedDb: Db = {};

  entries.forEach((entry: HarEntry) => {
    const route = new URL(entry?.request?.url)?.pathname;
    const responseText = entry?.response?.content?.text || "";

    let mock;
    try {
      mock = JSON.parse(responseText);
    } catch {
      mock = responseText;
    }

    let routePath: string = validRoute(route || '');
    let routeConfig: RouteConfig = {
      _config: true,
      mock
    }

    if (entryCallback && _.isFunction(entryCallback)) {
      const routes = entryCallback(entry, routePath, routeConfig) || {};
      [routePath, routeConfig] = Object.entries(routes)[0] || [];
    }
    routePath && routeConfig && setRouteRedirects(generatedDb, routePath, routeConfig);
  });

  return generatedDb;
}

const setRouteRedirects = (db: Db, routePath: string, currentRouteConfig: RouteConfig) => {
  if (db[routePath]) {
    const existingConfig = db[routePath];
    if (db[routePath].middlewareNames?.[0] !== "_IterateRoutes") {
      delete db[routePath];
      const iterateRoute1 = validRoute(routePath + "/" + nanoid(7))
      const iterateRoute2 = validRoute(routePath + "/" + nanoid(7))
      db[routePath] = {
        _config: true,
        mock: [
          iterateRoute1,
          iterateRoute2
        ],
        middlewareNames: ["_IterateRoutes"]
      }
      db[iterateRoute1] = existingConfig;
      db[iterateRoute2] = currentRouteConfig;
    } else {
      const iterateRoute = validRoute(routePath + "/" + nanoid(7))
      db[routePath].mock.push(iterateRoute);
      db[iterateRoute] = currentRouteConfig;
    }

  } else {
    db[routePath] = currentRouteConfig;
  }
}

const mergeArray = (newList: string[] = [], existingList: string[] = []): string[] => {
  if (!newList.length) return existingList;
  return newList.reduce((result, im) => {
    if (im === "...") {
      return [...new Set([...result, ...existingList])]
    }
    return [...new Set([...result, im])]
  }, [] as string[]).filter(Boolean)
}

export const flatQuery = (data) => {
  return _.flattenDeep([].concat(data).filter(Boolean).map((s: string) => s.split(","))).filter(Boolean);
}

export const getDbSnapShot = (db: Db) => {
  const _db = _.cloneDeep(db);
  for (let routePath in _db) {
    cleanRouteConfig(_db[routePath]);
    delete _db[routePath].id;
    delete _db[routePath]._config;
    const remainingKeys = Object.keys(_db[routePath]);
    if (!remainingKeys.length) {
      _db[routePath] = _.cloneDeep(db[routePath]?.mock || {});
    } else if (remainingKeys.length === 1 && remainingKeys[0] === 'mock') {
      _db[routePath] = _db[routePath].mock;
    } else {
      _db[routePath]._config = true;
    }
  }
  return _db;
}

export const cleanRouteConfig = (obj: RouteConfig) => {
  for (var key in obj) {
    if (['fetchData', 'store'].includes(key)) cleanRouteConfig(obj[key]);
    if ((!obj[key] && obj[key] != '0') ||
      obj[key] === false ||
      (obj[key] + "") === 'NaN' ||
      key.startsWith('_') ||
      (_.isArray(obj[key]) && _.isEmpty(obj[key])) ||
      (_.isPlainObject(obj[key]) && _.isEmpty(obj[key])) ||
      (_.isString(obj[key]) && !obj[key].length)
    ) {
      !['mock', 'response'].includes(key) && key !== "_config" && delete obj[key];
    }
    if (!obj.fetch) {
      delete obj.fetchData;
      delete obj.fetchCount;
      delete obj.skipFetchError;
    }
  }
  return obj;
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

export const cleanObject = (obj: object) => {
  for (let key in obj) {
    if (_.isPlainObject(obj[key])) cleanObject(obj[key]);
    if ((!obj[key] && obj[key] != '0') ||
      obj[key] === false ||
      (obj[key] + "") === 'NaN' ||
      (_.isArray(obj[key]) && _.isEmpty(obj[key])) ||
      (_.isPlainObject(obj[key]) && _.isEmpty(obj[key])) ||
      (_.isString(obj[key]) && !obj[key].length)
    ) {
      delete obj[key];
    }
  }
}

export const isCollection = (arr: any[]): boolean => {
  if (!_.isArray(arr)) return false;
  if (!arr.every(i => _.isPlainObject(i))) return false;
  return true;
}


