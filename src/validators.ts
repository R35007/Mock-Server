import chalk from "chalk";
import * as fs from "fs";
import * as _ from "lodash";
import * as path from "path";
import { compile, match, MatchResult } from 'path-to-regexp';
import { default_Config, default_Injectors, default_Middlewares, default_Routes, default_Store } from "./defaults";
import {
  Config, FileDetails, InjectorConfig, Injectors,
  KeyValString, Middlewares, RouteConfig, Routes, UserConfig,
  UserInjectors, UserMiddlewares, UserRoutes, UserStore, User_Config
} from "./model";

export class Validators {

  _routes: Routes = default_Routes;
  _config: Config = default_Config;
  _injectors: Injectors = default_Injectors;
  _middlewares: Middlewares = default_Middlewares;
  _store: object = default_Store;

  _isValidated = true;

  getValidConfig = (config: UserConfig): Config => {

    if (_.isEmpty(config)) {
      console.log(chalk.yellow("  Oops, Config not found. Using default Config"));
      return default_Config;
    }

    try {

      const userConfig: User_Config = this.#requireData(config) as User_Config;

      const { port, rootPath, baseUrl, routeRewrite: pathRewrite, excludeRoutes, staticUrl } = default_Config;
      const valid_Config = <Config>{};

      valid_Config.port = userConfig.port || port;
      valid_Config.baseUrl = userConfig.baseUrl && userConfig.baseUrl.trim() !== "/" ? this.getValidRoutePath(userConfig.baseUrl) : baseUrl;
      valid_Config.rootPath = userConfig.rootPath && this.isDirectoryExist(userConfig.rootPath) ? userConfig.rootPath : rootPath;
      valid_Config.staticUrl = userConfig.staticUrl && this.isDirectoryExist(userConfig.staticUrl) ? this.parseUrl(userConfig.staticUrl) : staticUrl;
      valid_Config.routeRewrite = userConfig.routeRewrite ? this.getValidPathRewrite(userConfig.routeRewrite) : pathRewrite;
      valid_Config.excludeRoutes = userConfig.excludeRoutes ? this.getValidRoutePaths(userConfig.excludeRoutes) : excludeRoutes;
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

  getValidInjectors = (injectors: UserInjectors): Injectors => {

    if (_.isEmpty(injectors)) return default_Injectors;

    try {

      const userInjectors: Injectors = this.#requireData(injectors) as Injectors;

      const flattenedInjectors = this.#flattenRoutes(userInjectors);
      return { ...default_Injectors, ...flattenedInjectors };
    } catch (err) {
      this._isValidated = false;
      console.error('getValidInjectors : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
      return default_Injectors;
    }
  };

  getValidMiddlewares = (middlewares: UserMiddlewares): Middlewares => {

    if (_.isEmpty(middlewares)) return default_Middlewares;

    try {
      const userMiddlewares: Middlewares = this.#requireData(middlewares) as Middlewares;

      const valid_middlewares = Object.keys(userMiddlewares)
        .filter(um => _.isFunction(userMiddlewares[um]))
        .reduce((result, um) => ({ ...result, [um]: userMiddlewares[um] }), {})

      return { ...default_Middlewares, ...valid_middlewares };
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
      const userRoutes: Routes = this.#requireData(routes) as Routes;

      const flattenedRoutes = this.#flattenRoutes(userRoutes);

      const construct_valid_routes = this.#formValidRoutes(flattenedRoutes);
      const routesWithInjectors = this.#mergeRoutesWithInjectors(construct_valid_routes);
      const finalRoutes = this.getRewrittenRoutes(routesWithInjectors);
      const excludedRoutes = this.excludeRoutes(finalRoutes)

      const valid_routes = this._config.reverseRouteOrder
        ? _.fromPairs(Object.entries(excludedRoutes).reverse())
        : excludedRoutes;

      return { ...default_Routes, ...valid_routes };
    } catch (err) {
      this._isValidated = false;
      console.error('getValidRoutes : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
      return default_Routes;
    }
  };

  getValidStore = (store: UserStore): Object => {
    if (_.isEmpty(store)) return default_Store;

    try {
      const userStore: Object = this.#requireData(store) as Object;

      return { ...default_Store, ...userStore };
    } catch (err) {
      this._isValidated = false;
      console.error('getValidStore : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
      return default_Store;
    }
  };

  #requireData = (data: any): object => {
    if (_.isString(data) && this.isFileExist(data)) {
      const parsedUrl = this.parseUrl(data)
      delete require.cache[parsedUrl];
      return path.extname(parsedUrl) === '.js' ? require(parsedUrl) : this.getJSON(data);
    } else if (_.isPlainObject(data)) {
      return data
    }
    return {}
  }

  getValidPathRewrite = (proxy: KeyValString): KeyValString => {
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
    const routeStr = route.trim();
    if (routeStr === "/") return routeStr;
    const addedSlashAtFirst = routeStr.startsWith("/") ? routeStr : "/" + routeStr;
    const removedSlashAtLast = addedSlashAtFirst.endsWith("/") ? addedSlashAtFirst.slice(0, -1) : addedSlashAtFirst;
    return removedSlashAtLast;
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
    const rootPath = _.get(this, "_config.rootPath", default_Config.rootPath);
    const parsedUrl = decodeURIComponent(path.resolve(rootPath, _.toString(relativeUrl)));
    return parsedUrl;
  };

  isPathExist = (value?: string): boolean => {
    try {
      if (!value?.length) return false;
      return _.isString(value) && fs.existsSync(this.parseUrl(value));
    } catch (err) {
      return false
    }
  }

  isDirectoryExist = (value?: string): boolean => {
    try {
      if (!value?.length) return false;
      const isPathExist = this.isPathExist(value);
      const isDirectory = isPathExist && fs.statSync(this.parseUrl(value!)).isDirectory();
      return isPathExist && isDirectory;
    } catch (err) {
      return false
    }
  };

  isFileExist = (value?: string): boolean => {
    try {
      if (!value?.length) return false;
      const isPathExist = this.isPathExist(value);
      const isDirectory = isPathExist && fs.statSync(this.parseUrl(value!)).isDirectory();
      return isPathExist && !isDirectory;
    } catch (err) {
      return false
    }
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
      const injectorsMiddlewares = injectorRouteConfig.middlewares?.length ? injectorRouteConfig.middlewares : [];
      if (injectorRouteConfig.override) {
        matchedRoutes.forEach(r => {
          injectedRoutes[r] = {
            ...routes[r],
            ...injectorRouteConfig,
            middlewares: this.#mergeMiddlewares(injectorsMiddlewares, routes, r)
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

  #mergeMiddlewares = (injectorsMiddlewares: string[], routes: Routes, routePath: string): string[] => {
    return injectorsMiddlewares.reduce((result, im) => {
      if (im === "...") {
        return [...result, ...routes[routePath].middlewares || []]
      }
      return [...result, im]
    }, []).filter(Boolean)
  }

  getRewrittenRoutes = (routes: Routes, routeRewrite: KeyValString = this._config.routeRewrite): Routes => {
    const rewrittenRoutes = {} as Routes;

    Object.entries(routeRewrite).forEach(([routePath, pathRewrite]) => {
      const matched = match(routePath);
      const toPath = compile(pathRewrite);
      const matchedRoutes = this.getRouteMatchList(routePath, routes);
      matchedRoutes.forEach(mr => {
        try {
          const paramsAttachedRoute = toPath((matched(mr) as MatchResult).params);
          rewrittenRoutes[paramsAttachedRoute] = routes[mr];
        } catch (error) {
          rewrittenRoutes[pathRewrite] = routes[mr];
        }
      })

    })

    return { ...routes, ...rewrittenRoutes }
  }

  excludeRoutes = (routes: Routes, routesToExclude: string[] = this._config.excludeRoutes): Routes => {
    const _routesToExclude = routesToExclude
      .reduce((res: string[], routeToExclude: string) =>
        res.concat(this.getRouteMatchList(routeToExclude, routes)), []);

    const excludedRouteEntries = Object.entries(routes)
      .filter(([routePath]) => !_routesToExclude.includes(routePath));

    return _.fromPairs(excludedRouteEntries);
  }

  getRouteMatchList = (routeToMatch: string, routes: Routes = this._routes): string[] => {
    const matched = match(routeToMatch);
    return Object.keys(routes).filter(r => matched(r) || r === routeToMatch);
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

  #formValidRoutes = (routes: Routes): Routes => {
    const valiedRouteEntries = Object.entries(routes).map(([routePath, routeConfig]) => {
      if (routeConfig.fetch === undefined && routeConfig.mock === undefined) {
        return [routePath, { mock: routeConfig }]
      }
      return [routePath, routeConfig]
    })
    return _.fromPairs(valiedRouteEntries)
  }

}
