import * as _ from 'lodash';
import { nanoid } from 'nanoid';
import { match } from 'path-to-regexp';
import { HarEntry, RouteConfig, Routes } from '../model';

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
    .forEach(([routes, routeConfig]: [string, RouteConfig]) => {
      const routesChunk = routes.split(",");
      routesChunk.map(validRoute).forEach(r => {
        flattenedRoutes[r] = validRouteConfig(routeConfig);
      })
    })
  return flattenedRoutes;
}

const validRouteConfig = (routeConfig): RouteConfig => {
  if (!_.isPlainObject(routeConfig)) return { mock: routeConfig, _id: "id-" + nanoid(7) }

  if (routeConfig.fetch === undefined && routeConfig.mock === undefined) {
    return { mock: routeConfig, _id: "id-" + nanoid(7) }
  }
  for (let key in routeConfig) {
    if (key.startsWith("_")) delete routeConfig[key];
  }
  routeConfig._id = "id-" + nanoid(7);
  return routeConfig
}

export const getInjectedRoutes = (routes: Routes, injectors: Routes): Routes => {
  const injectedRoutes = {} as Routes;
  Object.entries(injectors).forEach(([routeToMatch, injectorRouteConfig]) => {
    const matchedRoutes = getMatchedRoutesList(routeToMatch, routes);
    const injectorsMiddlewares = injectorRouteConfig.middlewares?.length ? injectorRouteConfig.middlewares : [];
    matchedRoutes.forEach(r => {
      if (injectorRouteConfig.override) {
        injectedRoutes[r] = {
          ...routes[r], ...injectorRouteConfig,
          middlewares: mergeArray(injectorsMiddlewares, routes[r].middlewares)
        }
      } else {
        injectedRoutes[r] = { ...injectorRouteConfig, ...routes[r] }
      }

      if (injectedRoutes[r].fetch === undefined) {
        delete injectedRoutes[r].fetchCount;
      }
    })
  })

  return _.cloneDeep({ ...routes, ...injectedRoutes }) as Routes;
}

export const getMatchedRoutesList = (routeToMatch: string, routes: Routes): string[] => {
  const matched = match(routeToMatch);
  return Object.keys(routes).filter(r => matched(r) || r === routeToMatch);
}

export const getRoutesFromEntries = (
  entries: HarEntry[],
  entryCallback?: (entry: object, routePath: string, routeConfig: RouteConfig) => Routes,
) => {

  let generatedRoutes: Routes = {};

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
      statusCode: statusCode == 304 ? 200 : statusCode,
      mock
    }

    if (entryCallback && _.isFunction(entryCallback)) {
      const routes = entryCallback(entry, routePath, routeConfig) || {};
      [routePath, routeConfig] = Object.entries(routes)[0] || [];
    }
    routePath && routeConfig && setRouteRedirects(generatedRoutes, routePath, routeConfig);
  });

  return generatedRoutes;
}

const setRouteRedirects = (routes: Routes, routePath: string, currentRouteConfig: RouteConfig) => {
  if (routes[routePath]) {
    const existingConfig = routes[routePath];
    if (routes[routePath].middlewares?.[0] !== "_IterateRoutes") {
      delete routes[routePath];
      const iterateRoute1 = validRoute(routePath + "/" + "id-" + nanoid(7))
      const iterateRoute2 = validRoute(routePath + "/" + "id-" + nanoid(7))
      routes[routePath] = {
        mock: [
          iterateRoute1,
          iterateRoute2
        ],
        middlewares: ["_IterateRoutes"]
      }
      routes[iterateRoute1] = existingConfig;
      routes[iterateRoute2] = currentRouteConfig;
    } else {
      const iterateRoute = validRoute(routePath + "/" + "id-" + nanoid(7))
      routes[routePath].mock.push(iterateRoute);
      routes[iterateRoute] = currentRouteConfig;
    }

  } else {
    routes[routePath] = currentRouteConfig;
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

export const getCleanedRoutes = (routes: Routes) => {
  const _routes = _.cloneDeep(routes);
  for (let routePath in _routes) {
    const routeConfig = _routes[routePath];
    _routes[routePath] = {
      ..._routes[routePath],
      mock: routeConfig._fetchData ?? routeConfig.mock
    };

    const keys = Object.keys(_routes[routePath]);
    keys.forEach(key => {
      if (key.startsWith("_")) delete _routes[routePath][key]
    })

    clean(_routes[routePath]);

    const remainingKeys = Object.keys(_routes[routePath]);
    if(remainingKeys.length === 1 && remainingKeys[0] === 'mock'){
      _routes[routePath] = _routes[routePath].mock;
    }
  }
  return _routes;
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


