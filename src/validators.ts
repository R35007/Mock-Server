import chalk from "chalk";
import * as fs from "fs";
import * as _ from "lodash";
import * as path from "path";
import { compile, match, MatchResult } from 'path-to-regexp';
import { default_Config, default_Globals, default_Injectors, default_Middlewares, default_Routes } from "./defaults";
import {
  Config, FileDetails, Globals, InjectorConfig, Injectors,
  KeyValString, Middlewares, RouteConfig, Routes, UserConfig,
  UserGlobals, UserInjectors, UserMiddlewares, UserRoutes, User_Config, User_Middlewares
} from "./model";

export class Validators {

  _routes: Routes = default_Routes;
  _config: Config = default_Config;
  _globals: Globals = default_Globals;
  _injectors: Injectors = default_Injectors;
  _middlewares: Middlewares = default_Middlewares;

  _isValidated = true;

  getValidConfig = (config: UserConfig): Config => {

    if (_.isEmpty(config)) {
      console.log(chalk.yellow("  Oops, Config not found. Using default Config"));
      return default_Config;
    }

    try {

      const userConfig: User_Config = _.isString(config) ? this.isFileExist(config)
        ? this.getJSON(config) as User_Config : {} : config as User_Config;

      const { port, rootPath, baseUrl, proxy, excludeRoutes, staticUrl } = default_Config;
      const valid_Config = <Config>{};

      valid_Config.port = userConfig.port || port;
      valid_Config.rootPath = userConfig.rootPath && this.isDirectoryExist(userConfig.rootPath) ? userConfig.rootPath : rootPath;
      valid_Config.staticUrl = userConfig.staticUrl && this.isDirectoryExist(userConfig.staticUrl) ? this.parseUrl(userConfig.staticUrl) : staticUrl;
      valid_Config.proxy = userConfig.proxy ? this.getValidProxy(userConfig.proxy) : proxy;
      valid_Config.excludeRoutes = userConfig.excludeRoutes ? this.getValidRoutePaths(userConfig.excludeRoutes) : excludeRoutes;
      valid_Config.baseUrl = userConfig.baseUrl ? this.getValidRoutePath(userConfig.baseUrl) : baseUrl;
      valid_Config.throwError = userConfig.throwError == true;
      valid_Config.reverseRouteOrder = userConfig.reverseRouteOrder == true;

      return valid_Config;
    } catch (err) {
      this._isValidated = false;
      console.error('getValidConfig : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
      return default_Config;
    }
  };

  getValidGlobals = (globals: UserGlobals): Globals => {

    if (_.isEmpty(globals)) return default_Globals;

    try {
      const userGlobals: User_Config = _.isString(globals) ? this.isFileExist(globals)
        ? this.getJSON(globals) as User_Config : {} : globals as User_Config
      return { ...default_Globals, ...userGlobals };
    } catch (err) {
      this._isValidated = false;
      console.error('getValidGlobals : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
      return default_Globals;
    }

  };

  getValidInjectors = (injectors: UserInjectors): Injectors => {

    if (_.isEmpty(injectors)) return default_Injectors;

    try {
      const userInjectors: Injectors = _.isString(injectors) ? this.isPathExist(injectors)
        ? this.getJSON(injectors) as Injectors : {} : injectors as Injectors;
      const flattenedInjectors = this.#flattenRoutes(userInjectors);
      return { ...default_Injectors, ...flattenedInjectors };
    } catch (err) {
      this._isValidated = false;
      console.error('getValidInjectors : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
      return default_Injectors;
    }
  };

  getValidMiddlewares = (middleawres: UserMiddlewares): Middlewares => {

    if (_.isEmpty(middleawres)) return default_Middlewares;

    try {
      const userMiddlewares: User_Middlewares = _.isString(middleawres) ? this.isFileExist(middleawres)
        ? require(this.parseUrl(middleawres)) as User_Middlewares : {} : middleawres as User_Middlewares
      return { ...default_Middlewares, ...userMiddlewares };
    } catch (err) {
      this._isValidated = false;
      console.error('getValidMiddlewares : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
      return default_Middlewares;
    }

  }

  getValidRoutes = (routes: UserRoutes): Routes => {
    if (_.isEmpty(routes)) return default_Routes;

    try {
      const userRoutes: Routes = _.isString(routes) ? this.isPathExist(routes)
        ? this.getJSON(routes) as Routes : {} : routes as Routes;

      const flattenedRoutes = this.#flattenRoutes(userRoutes);

      const routesWithInjectors = this.#mergeRoutesWithInjectors(flattenedRoutes);
      const proxyedRoutes = this.#getProxyedRoutes(routesWithInjectors);

      const excludedRouteEntries = Object.entries(proxyedRoutes)
        .filter(([routePath]) => !this._config.excludeRoutes.includes(routePath));

      const valid_routes = this._config.reverseRouteOrder
        ? _.fromPairs(excludedRouteEntries.reverse())
        : _.fromPairs(excludedRouteEntries);

      return { ...default_Routes, ...valid_routes };
    } catch (err) {
      this._isValidated = false;
      console.error('getValidRoutes : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
      return default_Routes;
    }
  };

  getValidProxy = (proxy: KeyValString): KeyValString => {
    const valid_Proxy_Entries = Object.entries(proxy).map(([key, data]: [string, string]) => {
      return [this.getValidRoutePath(key), this.getValidRoutePath(data)]
    });
    return _.fromPairs(valid_Proxy_Entries) as KeyValString
  };

  getValidRoutePaths = (routes: string | string[]): string[] => {
    if (!_.isEmpty(routes)) {
      if (_.isString(routes)) {
        return routes.split(',').map(this.getValidRoutePath)
      } else if (_.isArray(routes)) {
        return routes.map(this.getValidRoutePath);
      }
      return [];
    }
    return [];
  };

  getValidRoutePath = (route: string): string => {
    const baseUrl = _.get(this, "config.baseUrl", "");
    const routeStr = route.trim();
    const addedSlashAtFirst = routeStr.startsWith("/") ? routeStr : "/" + routeStr;
    const removedSlashAtLast = addedSlashAtFirst.endsWith("/") ? addedSlashAtFirst.slice(0, -1) : addedSlashAtFirst;
    const withBaseUrl = !_.isEmpty(baseUrl) && !removedSlashAtLast.startsWith(baseUrl) ? baseUrl + removedSlashAtLast : removedSlashAtLast;
    const validRoute = withBaseUrl.replace("//", "/");
    return validRoute;
  };

  getJSON = (directoryPath: string = "./", excludeFolders: string[] = [], recursive: boolean = true): object => {
    try {
      const filesList = this.getFilesList(directoryPath, excludeFolders, recursive);
      const onlyJson = filesList.filter((f) => f.extension === ".json");

      const mockData = onlyJson.reduce((mock, file) => {
        const obj = JSON.parse(fs.readFileSync(file.filePath, "utf-8"));
        return { ...mock, ...obj };
      }, {});
      return mockData;
    } catch (err) {
      this._isValidated = false;
      console.error('getJSON : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
      return {};
    }
  };

  getFilesList = (directoryPath: string = "./", excludeFolders: string[] = [], recursive: boolean = true): FileDetails[] => {
    try {
      const parsedUrl = this.parseUrl(directoryPath);
      const stats = fs.statSync(parsedUrl);
      if (stats.isFile()) {
        return this.#getFileDetail(parsedUrl);
      } else if (stats.isDirectory() && excludeFolders.indexOf(parsedUrl) < 0) {
        const files = fs.readdirSync(parsedUrl);
        const filteredFiles = files.filter((file) => excludeFolders.indexOf(file) < 0);
        const filesList = filteredFiles.reduce((res: FileDetails[], file: string) => {
          if (recursive) {
            return res.concat(this.getFilesList(`${parsedUrl}/${file}`, excludeFolders, true));
          }
          return res.concat(this.#getFileDetail(`${parsedUrl}/${file}`));
        }, []);

        return filesList;
      }
      return [];
    } catch (err) {
      this._isValidated = false;
      console.error('getFilesList : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
      return [];
    }
  };

  parseUrl = (relativeUrl: string): string => {
    const rootPath = _.get(this, "config.rootPath", default_Config.rootPath);
    const parsedUrl = decodeURIComponent(path.resolve(rootPath, _.toString(relativeUrl)));
    return parsedUrl;
  };

  isPathExist = (value: string): boolean => {
    return _.isString(value) && fs.existsSync(this.parseUrl(value));
  }

  isDirectoryExist = (value: string): boolean => {
    return this.isPathExist(value) && fs.statSync(this.parseUrl(value)).isDirectory();
  };

  isFileExist = (value: string): boolean => {
    return this.isPathExist(value) && !fs.statSync(this.parseUrl(value)).isDirectory();
  };

  #getFileDetail = (filePath: string): FileDetails[] => {
    const stats = fs.statSync(filePath);
    const extension = path.extname(filePath);
    const fileName = path.basename(filePath, extension);
    return [{ fileName, extension, filePath, isFile: stats.isFile() }];
  };

  #mergeRoutesWithInjectors = (routes: Routes): Routes => {
    const injectedRoutes = {} as Routes;
    Object.entries(this._injectors).forEach(([routePath, injectorRouteConfig]) => {
      const matched = match(routePath);
      const matchedRoutes = Object.keys(routes).filter(matched);
      if (injectorRouteConfig.override) {
        matchedRoutes.forEach(r => {
          injectedRoutes[r] = {
            ...routes[r],
            ...injectorRouteConfig
          }
        })
      } else {
        matchedRoutes.forEach(r => {
          injectedRoutes[r] = {
            ...injectorRouteConfig,
            ...routes[r]
          }
        })
      }
    })

    return { ...routes, ...injectedRoutes };
  }

  #getProxyedRoutes = (routes: Routes): Routes => {
    const proxyedRoutes = {} as Routes;

    Object.entries(this._config.proxy).forEach(([routePath, proxyPath]) => {
      const matched = match(routePath);
      const toPath = compile(proxyPath);
      const matchedRoutes = Object.keys(routes).filter(matched);
      matchedRoutes.forEach(mr => {
        try {
          const proxyedPath = toPath((matched(mr) as MatchResult).params);
          proxyedRoutes[proxyedPath] = routes[mr];
        } catch (error) {
          proxyedRoutes[proxyPath] = routes[mr];
        }
      })

    })

    return { ...routes, ...proxyedRoutes }
  }

  #flattenRoutes = <T>(object: T): T => {

    const flattenedRoutes = {} as T;

    Object.entries(object).forEach(([routes, routeConfig]: [string, RouteConfig | InjectorConfig]) => {
      this.getValidRoutePaths(routes).forEach(r => {
        flattenedRoutes[r] = routeConfig;
      })
    })

    return flattenedRoutes;
  }

}
