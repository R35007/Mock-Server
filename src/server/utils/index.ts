import chalk from "chalk";
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import { nanoid } from 'nanoid';
import * as path from 'path';
import { match } from 'path-to-regexp';
import { Db, HarEntry, RouteConfig } from '../model';

export const validRoute = (route: string): string => {
  const trimmedRoute = "/" + route.split('/')
    .filter(x => x.trim())
    .map(x => x.trim())
    .join('/');
  return trimmedRoute;
}

export const normalizeRoutes = <T>(object: T): T => {
  const flattenedRoutes = {} as T;
  Object.entries(object)
    .forEach(([routePath, routeConfig]: [string, RouteConfig]) => {
      const routesChunk = routePath.split(",");
      routesChunk.map(validRoute).forEach(r => {
        flattenedRoutes[r] = validRouteConfig(routeConfig);
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

export const getInjectedRoutes = (db: Db, injectors: Db): Db => {
  const injectedRoutes = {} as Db;
  Object.entries(injectors).forEach(([routeToMatch, injectorRouteConfig]) => {
    const matchedRoutes = getMatchedRoutesList(routeToMatch, db);
    const injectorsMiddlewares = injectorRouteConfig.middlewares?.length ? injectorRouteConfig.middlewares : [];
    matchedRoutes.forEach(r => {
      if (injectorRouteConfig.override) {
        injectedRoutes[r] = {
          ...db[r], ...injectorRouteConfig,
          middlewares: mergeArray(injectorsMiddlewares, db[r].middlewares)
        }
      } else {
        injectedRoutes[r] = { ...injectorRouteConfig, ...db[r] }
      }

      if (injectedRoutes[r].fetch === undefined) {
        delete injectedRoutes[r].fetchCount;
      }
    })
  })

  return _.cloneDeep({ ...db, ...injectedRoutes }) as Db;
}

export const getMatchedRoutesList = (routeToMatch: string, routes: Db): string[] => {
  const matched = match(routeToMatch);
  return Object.keys(routes).filter(r => matched(r) || r === routeToMatch);
}

export const getRoutesFromEntries = (
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

    const statusCode = entry?.response?.status;
    let routePath: string = validRoute(route || '');
    let routeConfig: RouteConfig = {
      _config: true,
      statusCode: statusCode == 304 ? 200 : statusCode,
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
    if (db[routePath].middlewares?.[0] !== "_IterateRoutes") {
      delete db[routePath];
      const iterateRoute1 = validRoute(routePath + "/" + "id-" + nanoid(7))
      const iterateRoute2 = validRoute(routePath + "/" + "id-" + nanoid(7))
      db[routePath] = {
        _config: true,
        mock: [
          iterateRoute1,
          iterateRoute2
        ],
        middlewares: ["_IterateRoutes"]
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
  return newList.reduce((result, im) => {
    if (im === "...") {
      return [...result, ...existingList]
    }
    return [...result, im]
  }, []).filter(Boolean)
}

export const flatQuery = (data) => {
  return _.flattenDeep([].concat(data).filter(Boolean).map((s: string) => s.split(","))).filter(Boolean);
}

export const getDbSnapShot = (db: Db) => {
  const _db = _.cloneDeep(db);
  for (let routePath in _db) {
    const keys = Object.keys(_db[routePath]);
    keys.forEach(key => {
      if (key.startsWith("_")) delete _db[routePath][key]
    })
    clean(_db[routePath]);
    const remainingKeys = Object.keys(_db[routePath]);
    if (remainingKeys.length === 2 && remainingKeys.includes('mock') && remainingKeys.includes('id')) {
      _db[routePath] = _db[routePath].mock;
    } else {
      _db[routePath]._config = true;
    }
  }
  return _db;
}

export const clean = (obj: object) => {
  for (var propName in obj) {
    if (
      obj[propName] === null ||
      obj[propName] === undefined ||
      (_.isArray(obj[propName]) && !obj[propName].length) ||
      (_.isPlainObject(obj[propName]) && !Object.keys(obj[propName]).length) ||
      _.isNaN(obj[propName]) ||
      !(obj[propName].toString().trim())?.length
    ) {
      delete obj[propName];
    }
  }
  return obj
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


