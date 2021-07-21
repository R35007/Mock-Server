import axios, { AxiosRequestConfig } from 'axios';
import chalk from 'chalk';
import * as fs from 'fs';
import * as _ from 'lodash';
import { nanoid } from 'nanoid';
import * as path from 'path';
import pathToRegexp, { match } from 'path-to-regexp';
import { HarEntry, PathDetails, RouteConfig, Routes } from '../model';

export const validRoute = (route: string): string => {
  const trimmedRoute = "/" + route.split('/')
    .filter(x => x.trim())
    .map(x => x.trim())
    .join('/');
  return trimmedRoute;
}

export const isValidData = (data: any): boolean => {
  return !_.isEmpty(data) && (_.isString(data) || _.isPlainObject(data));
}

export const normalizeRoutes = <T>(object: T): T => {
  const flattenedRoutes = {} as T;
  Object.entries(object)
    .filter(([_routes, routeConfig]: [string, RouteConfig]) => !routeConfig._isDefault)
    .forEach(([routes, routeConfig]: [string, RouteConfig]) => {
      const routesChunk = routes.split(",");
      routesChunk.map(validRoute).forEach(r => {
        flattenedRoutes[r] = validRouteConfig(routeConfig);
      })
    })
  return flattenedRoutes;
}

const validRouteConfig = (routeConfig: RouteConfig): RouteConfig => {
  if (routeConfig.fetch === undefined && routeConfig.mock === undefined) {
    return { mock: routeConfig }
  }
  for (let key in routeConfig) {
    if (key.startsWith("_")) delete routeConfig[key];
  }
  routeConfig._id = nanoid(7);
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
  entryCallback?: (entry: object, routePath: string, routeConfig: RouteConfig, pathToRegexp) => Routes,
  routesToLoop: string[] = [],
) => {

  let generatedRoutes: Routes = {};

  entries.forEach((entry: HarEntry) => {
    const route = new URL(entry?.request?.url)?.pathname;
    const responseText = entry?.response?.content?.text || "";

    let response;
    try {
      response = JSON.parse(responseText);
    } catch {
      response = responseText;
    }

    let routePath: string = validRoute(route || '');
    let routeConfig: RouteConfig = {
      statusCode: entry?.response?.status,
      mock: response
    }

    if (entryCallback && _.isFunction(entryCallback)) {
      const routes = entryCallback(entry, routePath, routeConfig, pathToRegexp) || {};
      [routePath, routeConfig] = Object.entries(routes)[0];
    }
    routePath && routeConfig && setLoopedMock(generatedRoutes, routesToLoop, routePath, routeConfig);
  });

  return generatedRoutes;
}

export const setLoopedMock = (routes: Routes, routesToLoop: string[], routePath: string, routeConfig: RouteConfig) => {
  const currentMock = routeConfig.mock;
  const currentMiddlewares = routeConfig.middlewares || [];

  if (routes[routePath] && (routesToLoop[0] === '*' || routesToLoop.includes(routePath))) {
    const existingMockValue = routes[routePath].mock;
    const existingMiddlewares = routes[routePath].middlewares || [];

    if (routes[routePath].middlewares?.[0] === "loopMock") {
      routes[routePath].mock?.push(currentMock);
      routes[routePath].middlewares = [...new Set(...existingMiddlewares, ...currentMiddlewares)] as string[];
    } else {
      routeConfig.mock = [existingMockValue, currentMock].filter(Boolean);
      routeConfig.middlewares = [...new Set(...["loopMock", ...existingMiddlewares, ...currentMiddlewares])];

      routes[routePath] = { ...routes[routePath], ...routeConfig };
    }
  } else {
    routes[routePath] = routeConfig;
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

export const getJSON = (directoryPath: string, excludeFolders: string[] = [], recursive: boolean = true): object => {
  const filesList = getFilesList(directoryPath, excludeFolders, recursive);
  const onlyJson = filesList.filter((f) => f.extension === ".json" || f.extension === ".har");

  const mockData = onlyJson.reduce((mock, file) => {
    const obj = JSON.parse(fs.readFileSync(file.filePath, "utf-8"));
    return { ...mock, ...obj };
  }, {});
  return mockData;
};

export const getFilesList = (directoryPath: string, foldersToExclude: string[] = [], recursive: boolean = true): PathDetails[] => {
  const stats = getStats(directoryPath);
  if (stats?.isFile) {
    return [stats];
  } else if (stats?.isDirectory && foldersToExclude.indexOf(directoryPath) < 0) {
    const files = fs.readdirSync(directoryPath);
    const filteredFiles = files.filter((file) => foldersToExclude.indexOf(file) < 0);
    const filesList = filteredFiles.reduce((res: PathDetails[], file: string) => {
      if (recursive) {
        return res.concat(getFilesList(`${directoryPath}/${file}`, foldersToExclude, true));
      }
      return res.concat(getStats(`${directoryPath}/${file}`) || []);
    }, []);

    return filesList;
  }
  return [];
};

export const getStats = (directoryPath: string): PathDetails | undefined => {
  if (fs.existsSync(directoryPath)) {
    const stats = fs.statSync(directoryPath);
    const extension = path.extname(directoryPath);
    const fileName = path.basename(directoryPath, extension);
    return { fileName, extension, filePath: directoryPath, isFile: stats.isFile(), isDirectory: stats.isDirectory() };
  }
  return;
};

export const getFileData = (filePath: string, extension: string): { fetchData?: any, fetchError?: any } => {
  let fetchData, fetchError;
  try {
    if (extension === ".json" || extension === ".har") {
      console.log(chalk.gray("Fetch request : "), filePath);
      fetchData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } else if (extension === ".txt") {
      console.log(chalk.gray("Fetch request : "), filePath);
      fetchData = fs.readFileSync(filePath, "utf8");
    }
  } catch (error) {
    fetchError = error;
  }

  return { fetchData, fetchError }
}

export const getUrlData = async (request: AxiosRequestConfig) => {
  let fetchData, fetchError;
  console.log(chalk.gray("Fetch request : "), request);
  try {
    const response = await axios(request);
    fetchData = response.data;
  } catch (err) {
    fetchError = err
  }

  return { fetchData, fetchError };
}

export const flatQuery = (data) => {
  return _.flattenDeep([].concat(data).filter(Boolean).map((s: string) => s.split(","))).filter(Boolean);
}

export const parseUrl = (relativeUrl?: string, root: string = process.cwd()): string => {
  if (!relativeUrl || !_.isString(relativeUrl) || !relativeUrl?.trim().length) return '';
  if (relativeUrl.startsWith("http")) return relativeUrl;
  const parsedUrl = decodeURIComponent(path.resolve(root, relativeUrl));
  return parsedUrl;
};