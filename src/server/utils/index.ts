import chalk from "chalk";
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import { nanoid } from 'nanoid';
import * as path from 'path';
import { match } from 'path-to-regexp';
import { Db, HarEntry, Injector, RouteConfig } from '../model';

export const validRoute = (route: string): string => {
  const trimmedRoute = "/" + route.split('/')
    .filter(x => x.trim())
    .map(x => x.trim())
    .join('/');
  return trimmedRoute;
}

export const normalizeRoutes = <T>(object: T, isInjector: boolean = false): T => {
  const flattenedRoutes = {} as T;
  Object.entries(object)
    .forEach(([routePath, routeConfig]: [string, RouteConfig]) => {
      const routesChunk = routePath.split(",");
      routesChunk.map(validRoute).forEach(r => {
        flattenedRoutes[r] = isInjector ? routeConfig : validRouteConfig(routeConfig);
      })
    })
  return flattenedRoutes;
}

const validRouteConfig = (routeConfig): RouteConfig => {
  if (!_.isPlainObject(routeConfig)) return { _config: true, mock: routeConfig, id: "id-" + nanoid(7) }

  if (!routeConfig._config) {
    return { _config: true, mock: routeConfig, id: "id-" + nanoid(7) }
  }
  routeConfig.id = routeConfig.id ?? "id-" + nanoid(7);
  return routeConfig
}

export const getInjectedDb = (db: Db, injectors: { [key: string]: Injector }): Db => {
  const injectedRoutes = {};
  Object.entries(injectors).forEach(([key, injectorRouteConfig]) => {
    const routeToMatch = injectorRouteConfig.routeToMatch || key;
    const matchedRoutes = getMatchedRoutesList(routeToMatch, db, injectorRouteConfig.exact);
    const injectorsMiddlewares = injectorRouteConfig.middlewareNames;
    matchedRoutes.forEach(r => {
      const existingMiddlewares = injectedRoutes[r]?.middlewareNames?.length ? injectedRoutes[r]?.middlewareNames : db[r]?.middlewareNames;
      if (injectorRouteConfig.override) {
        injectedRoutes[r] = {
          ...db[r], ...(injectedRoutes[r] || {}), ...injectorRouteConfig,
          middlewareNames: mergeArray(injectorsMiddlewares, existingMiddlewares)
        }
      } else {
        injectedRoutes[r] = {
          ...injectorRouteConfig, ...db[r], ...(injectedRoutes[r] || {}),
          middlewareNames: mergeArray(injectorsMiddlewares, existingMiddlewares)
        }
      }

      if (injectedRoutes[r].fetch === undefined) {
        delete injectedRoutes[r].fetchCount;
        delete injectedRoutes[r].skipFetchError;
      }
      delete injectedRoutes[r].routeToMatch;
      delete injectedRoutes[r].override;
      delete injectedRoutes[r].exact;
    })
  })

  return _.cloneDeep({ ...db, ...injectedRoutes }) as Db;
}

export const getMatchedRoutesList = (routeToMatch: string, db: Db, exact: boolean = false): string[] => {
  const matched = match(routeToMatch);
  return exact ?
    Object.keys(db).filter(r => r === routeToMatch) :
    Object.keys(db).filter(r => matched(r));
}

export const getDbFromEntries = (
  entries: HarEntry[],
  entryCallback?: (entry: object, routePath: string, routeConfig: RouteConfig) => Db,
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
      const iterateRoute1 = validRoute(routePath + "/" + "id-" + nanoid(7))
      const iterateRoute2 = validRoute(routePath + "/" + "id-" + nanoid(7))
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
      const iterateRoute = validRoute(routePath + "/" + "id-" + nanoid(7))
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


