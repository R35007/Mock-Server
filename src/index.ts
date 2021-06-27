import chalk from "chalk";
import cors from "cors";
import express from "express";
import * as fs from "fs";
import { Server } from "http";
import * as _ from "lodash";
import * as path from "path";
import pathToRegexp, { match } from 'path-to-regexp';
import { default_Config, default_Injectors, default_Middlewares, default_Routes } from './defaults';
import { GettersSetters } from './getters-setters';
import {
  ExpressMiddleware,
  HAR,
  HarEntry,
  KeyValString,
  Methods,
  RouteConfig,
  Routes,
  UserConfig,
  UserInjectors,
  UserMiddlewares,
  UserRoutes,
  UserStore
} from "./model";

export class MockServer extends GettersSetters {

  constructor(
    routes?: UserRoutes,
    config?: UserConfig,
    middlewares?: UserMiddlewares,
    injectors?: UserInjectors,
    store?: UserStore
  ) {
    super(routes, config, middlewares, injectors, store);
  }

  launchServer = async () => {
    try {
      if (!this.isValidated) throw new Error("Please fix the Data error before Launching Server");
      if (this._isServerLaunched) return;
      this.createExpressApp();
      this.loadResources();
      this.createDefaultRoutes();
      await this.startServer();
      this._isServerLaunched = true;
    } catch (err) {
      console.error('launchServer : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
    }
  };

  createExpressApp = (): express.Application | undefined => {
    if (this._isExpressAppCreated) return this._app;
    try {
      this._app = express();
      if (this._app) {
        this._app.use(express.urlencoded({ extended: true }));
        this._app.use(express.json());
        this._app.use(this.#logResponseTime);
        this._app.use(this.#errorHandler);
        this._config.staticUrl && this._app.use(express.static(this._config.staticUrl));
        this._app.use(cors({ origin: true, credentials: true }));
        this._app.set("json spaces", 2);
        this._isExpressAppCreated = true;
        return this._app;
      }
    } catch (err) {
      console.error('createExpressApp : ' + chalk.red(err.message));
      this._isExpressAppCreated = false;
      if (this._config.throwError) throw new Error(err.message)
      return undefined;
    }
  };

  startServer = (port: number = this._config.port): Promise<Server | Error> => {
    if (!this._app) this.createExpressApp();
    if (this._isServerStarted) return Promise.resolve(this._server!);
    console.log("\n" + chalk.gray("Starting Server..."));

    return new Promise((resolve, reject) => {
      this._router && this._app?.use(this._config.baseUrl, this._router);
      this._server = this._app?.listen(port, () => {
        console.log(chalk.green.bold("Mock Server Started"));
        console.log(chalk.gray("watching...") + "\n");
        this._isServerStarted = true;
        resolve(this._server!);
      }).on("error", (err) => {
        console.error('startServer : ' + chalk.red(err.message));
        this._isServerStarted = false;
        reject(err);
        if (this._config.throwError) throw new Error(err.message);
      });
    })
  };

  stopServer = (): Promise<Boolean> => {
    if (!this._isServerStarted) return Promise.resolve(true);

    return new Promise((resolve) => {
      this._server?.close(() => {
        this.resetServer();
        console.log(chalk.gray("\n Mock Server Stopped"));
        resolve(true);
      }).on("error", (err) => {
        console.error('stopServer : ' + chalk.red(err.message));
        resolve(false);
        if (this._config.throwError) throw new Error(err.message);
      });
    });
  };

  loadResources = () => {
    try {
      if (!this._app) this.createExpressApp();
      if (!this.isValidated) throw new Error("Please fix the Data error before Launching Server");
      if (this._isResourcesLoaded) return;

      console.log("\n" + chalk.gray("Loading Resources..."));

      this._router = express.Router();
      Object.entries(this._routes).forEach(routes => this.createRoute(...routes))
      this._isResourcesLoaded = true;

      console.log(chalk.gray("Done. Resources Loaded."));
    } catch (err) {
      console.error('loadResources : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
    }
  };

  createRoute = (routePath: string, routeConfig: RouteConfig = {}) => {
    if (!this._routesList.includes(this.config.baseUrl + routePath)) {
      this._routesList.push(this.config.baseUrl + routePath);
      const middlewareList = this.#getMiddlewareList(routePath, routeConfig);
      this.#setRouterByMethod(routePath, middlewareList, routeConfig.methods);
    };
  }

  #setRouterByMethod = (routePath: string, middlewareList: ExpressMiddleware[], methods: Methods[] = ["ALL"]) => {
    let valid_methods = methods.filter(m =>
      ["GET", "POST", "PUT", "PATCH",
        "DELETE", "OPTIONS", "HEAD", "ALL"].includes(m.toUpperCase()))

    valid_methods = valid_methods.length ? valid_methods : ["ALL"];

    valid_methods.forEach((method: any) => {
      this._router?.[method.toLowerCase()](routePath, middlewareList)
    })
  }

  #getMiddlewareList = (routePath: string, routeConfig: RouteConfig) => {
    const userMiddlewares = (routeConfig.middlewares || [])
      .filter(m => _.isFunction(this._middlewares?.[m]))
      .map(m => this._middlewares?.[m]);

    const middlewareList: ExpressMiddleware[] = [this._initialMiddlewareWrapper(routePath)];
    userMiddlewares.length && middlewareList.push(...userMiddlewares);
    middlewareList.push(this._finalMiddleware);

    return middlewareList;
  }

  createDefaultRoutes = () => {
    if (!this._app) this.createExpressApp();
    if (this._isDefaultsCreated) return;
    const HOME = "/home",
      ROUTELIST = "/routesList",
      ROUTES = "/routes",
      CONFIG = "/config",
      STORE = "/store";
    const defaultRoutes: string[] = [];

    if (!this._routesList.includes("/")) {
      this.app?.get("/",(_req, res) => res.redirect(HOME))
    }

    if (!this._routesList.includes(HOME)) {
      defaultRoutes.push(HOME);
      this._app?.use(HOME, express.static(path.join(__dirname, "../public")));
    }

    if (!this._routesList.includes(ROUTELIST)) {
      defaultRoutes.push(ROUTELIST);
      this._routesList.push(ROUTELIST);
      this._app?.get(ROUTELIST, (_req, res) => {
        res.send(this._routesList);
      });
    }

    if (!this._routesList.includes(ROUTES)) {
      defaultRoutes.push(ROUTES);
      this._routesList.push(ROUTES);
      this._app?.get(ROUTES, (_req, res) => {
        res.send(this._routes);
      });
    }

    if (!this._routesList.includes(CONFIG)) {
      defaultRoutes.push(CONFIG);
      this._routesList.push(CONFIG);
      this._app?.get(CONFIG, (_req, res) => {
        res.send(this._config);
      });
    }

    if (!this._routesList.includes(STORE)) {
      defaultRoutes.push(STORE);
      this._routesList.push(STORE);
      this._app?.get(STORE, (_req, res) => {
        res.send(this._store);
      });
    }

    this.#defaultRoutesLog(defaultRoutes, this._config.port);
    this._isDefaultsCreated = true;
  };

  resetServer = () => {
    this._isServerLaunched = false;
    this._isServerStarted = false;
    this._isResourcesLoaded = false;
    this._isDefaultsCreated = false;
    this._isExpressAppCreated = false;

    this._app = undefined;
    this._server = undefined;
    this._router = undefined;
    this._routesList = [];

    this._routes = default_Routes;
    this._config = default_Config;
    this._middlewares = default_Middlewares;
    this._injectors = default_Injectors;
    this._store = {};
  };

  transformHar = (
    harData: HAR | string = <HAR>{},
    config: { routesToLoop?: string[], routesToGroup?: string[], routeRewrite?: KeyValString } = {},
    entryCallback?: (entry: object, routePath: string, routeConfig: RouteConfig, pathToRegexp) => Routes,
    finalCallback?: (generatedMock: Routes, pathToRegexp) => Routes
  ): Routes => {
    try {
      const { routesToLoop = [], routesToGroup = [], routeRewrite } = config;
      const har = _.isString(harData)
        ? JSON.parse(fs.readFileSync(this.parseUrl(harData), "utf-8"))
        : harData;
      const entries: HarEntry[] = har?.log?.entries || [];
      let generatedMock: Routes = {};

      entries.forEach((entry: HarEntry) => {
        const route = new URL(entry?.request?.url)?.pathname;
        const routePath: string = this.getValidRoutePath(route || '');
        const responseText = entry?.response?.content?.text || "";
        const statusCode = entry?.response?.status;

        let response;
        try {
          response = JSON.parse(responseText);
        } catch {
          response = responseText;
        }

        const routeConfig = {
          methods: [entry?.request?.method],
          statusCode,
          mock: response
        }

        let uRoutes: Routes = {
          [routePath]: routeConfig
        };

        if (_.isFunction(entryCallback)) {
          uRoutes = entryCallback(entry, routePath, routeConfig, pathToRegexp) || {};
        }

        const [uRoutePath, uRouteConfig] = Object.entries(uRoutes)[0] || []

        this.#setLoopedMock(generatedMock, routesToLoop, uRoutePath, uRouteConfig);

      });

      routesToGroup.length && this.#setGroupMock(generatedMock, routesToGroup);

      generatedMock = this.getRewrittenRoutes(generatedMock, routeRewrite);

      if (_.isFunction(finalCallback)) {
        return finalCallback(generatedMock, pathToRegexp);
      }

      return generatedMock;
    } catch (err) {
      console.error('transformHar : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
      return {} as Routes;
    }
  };

  #setLoopedMock = (generatedMock: Routes, routesToLoop: string[], uroutePath: string, routeConfig: RouteConfig) => {
    const routePath = this.getValidRoutePaths(uroutePath).join(',');

    const currentMock = routeConfig.mock || routeConfig;
    const currentMethods = routeConfig.methods || [];

    if (generatedMock[routePath] && (routesToLoop[0] === '*' || routesToLoop.includes(routePath))) {
      const existingMockValue = generatedMock[routePath].mock;
      const existingMethods = generatedMock[routePath].methods || [];
      if (generatedMock[routePath].middlewares?.[0] === "loopMock") {
        generatedMock[routePath].mock?.push(currentMock);
        generatedMock[routePath].methods = [...new Set(...existingMethods, ...currentMethods)] as Methods[]
      } else {
        generatedMock[routePath] = {
          mock: [
            existingMockValue,
            currentMock
          ],
          methods: [...new Set(...existingMethods, ...currentMethods)] as Methods[],
          middlewares: ["loopMock"]
        }
      }
    } else {
      generatedMock[routePath] = routeConfig;
    }
  }

  #setGroupMock = (generatedMock: Routes, routesToGroup: string[]) => {
    routesToGroup.forEach(routeToMatch => {
      const matched = match(routeToMatch);
      const matchedRoutes = Object.keys(generatedMock).filter(matched);
      matchedRoutes.length && (generatedMock[routeToMatch] = {
        mock: {},
        middlewares: ["groupMock"],
      })
      matchedRoutes.forEach(mr => this.#groupTogether(generatedMock, mr, routeToMatch))
    })
  }

  #groupTogether = (generatedMock: Routes, matchedRoute: string, routeToMatch: string) => {
    generatedMock[routeToMatch].mock[matchedRoute] = generatedMock[matchedRoute].mock;
    generatedMock[routeToMatch].methods = [...new Set(...generatedMock[routeToMatch].methods || [],
      ...generatedMock[matchedRoute].methods || [])] as Methods[]
    delete generatedMock[matchedRoute];
  }

  #defaultRoutesLog = (defaultRoutes: string[], port: number) => {
    if (defaultRoutes.length > 0) {
      console.log("\n" + chalk.white.bold("Default Routes : ") + "\n");
    }
    defaultRoutes.map((route) => {
      const name = route === "/" ? "HOME" : route.replace("/", "").toUpperCase();
      console.log(chalk.white.bold(name) + "  :  http://localhost:" + port + route);
    });
  };

  #logResponseTime = (req, res, next) => {
    const startHrTime = process.hrtime();

    res.on("finish", () => {
      const elapsedHrTime = process.hrtime(startHrTime);
      const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
      if (["/style.css", "/script.js", "/favicon.ico"].indexOf(req.path) < 0)
        console.log(`${req.method} ${req.path} ` + this.#getStatusCodeColor(res.statusCode) + ` ${elapsedTimeInMs} ms`);
    });

    next();
  };

  #errorHandler = (err, _req, _res, next) => {
    if (!err) return next();
    console.log(chalk.red("! Error.Something went wrong"));
  };

  #getStatusCodeColor = (statusCode: number) => {
    if (statusCode === 200) {
      return chalk.green(statusCode);
    } else if (statusCode >= 300 && statusCode < 400) {
      return chalk.blue(statusCode);
    } else if (statusCode >= 400 && statusCode < 500) {
      return chalk.red(statusCode);
    } else {
      return chalk.yellow(statusCode);
    }
  };
}