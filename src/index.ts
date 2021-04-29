import chalk from "chalk";
import cors from "cors";
import express from "express";
import * as _ from "lodash";
import * as path from "path";
import { GettersSetters } from './getters-setters';
import {
  HAR,
  HarEntry,
  RouteConfig,
  Routes,
  UserConfig,
  UserGlobals,
  UserInjectors,
  UserMiddlewares, UserRoutes
} from "./model";

export class MockServer extends GettersSetters {

  constructor(
    routes?: UserRoutes,
    config?: UserConfig,
    injectors?: UserInjectors,
    globals?: UserGlobals,
    middlewares?: UserMiddlewares
  ) {
    super(routes, config, injectors, globals, middlewares);
    console.log("\n" + chalk.blue("/{^_^}/ Hi!"));
  }

  launchServer = async () => {
    try {
      if (!this.isValidated) throw new Error("Please fix the Data error before Launching Server");
      if (this._isServerLaunched) return;
      this.createExpressApp();
      await this.startServer();
      this.loadResources();
      this.createDefaultRoutes();
      console.log("\n" + chalk.gray("watching...") + "\n");
      this._isServerLaunched = true;
    } catch (err) {
      console.error('launchServer : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
    }
  };

  createExpressApp = () => {
    if (this._isExpressAppCreated) return;
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
      }
    } catch (err) {
      console.error('createExpressApp : ' + chalk.red(err.message));
      this._isExpressAppCreated = false;
      if (this._config.throwError) throw new Error(err.message)
    }
  };

  startServer = (port: number = this._config.port): Promise<Boolean> => {
    if (!this._app) this.createExpressApp();
    if (this._isServerStarted) return Promise.resolve(true);
    console.log("\n" + chalk.gray("Starting Server..."));

    return new Promise((resolve) => {
      this._server = this._app?.listen(port, () => {
        console.log(chalk.green.bold("Mock Server Started"));
        this._isServerStarted = true;
        resolve(true);
      }).on("error", (err) => {
        console.error('startServer : ' + chalk.red(err.message));
        this._isServerStarted = false;
        resolve(false);
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

      Object.entries(this._routes).forEach(
        (routes) => {
          this._app?.all(routes[0], [
            this._initialMiddlewareWrapper(...routes),
            this._userMiddlewareWrapper(),
            this._finalMiddleware,
          ]);
        }
      )
      this._isResourcesLoaded = true;

      console.log(chalk.gray("Done. Resources Loaded."));
    } catch (err) {
      console.error('loadResources : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
    }
  };

  createDefaultRoutes = () => {
    if (!this._app) this.createExpressApp();
    if (this._isDefaultsCreated) return;
    const HOME = "/",
      ROUTES = "/routes",
      GLOBALS = "/globals",
      ROUTELIST = "/routesList";
    const defaultRoutes: string[] = [];

    const availableRoutes = Object.keys(this._routes);

    if (availableRoutes.indexOf(HOME) < 0) {
      defaultRoutes.push(HOME);
      this._app?.use(express.static(path.join(__dirname, "../public")));
    }
    if (availableRoutes.indexOf(ROUTES) < 0) {
      defaultRoutes.push(ROUTES);
      this._app?.all(ROUTES, (_req, res) => {
        res.send(this._routes);
      });
    }
    if (availableRoutes.indexOf(GLOBALS) < 0) {
      defaultRoutes.push(GLOBALS);
      this._app?.all(GLOBALS, (_req, res) => {
        res.send(this._globals);
      });
    }
    if (availableRoutes.indexOf(ROUTELIST) < 0) {
      defaultRoutes.push(ROUTELIST);
      this._app?.all(ROUTELIST, (_req, res) => {
        res.send(availableRoutes);
      });
    }
    this.#defaultRoutesLog(defaultRoutes, this._config.port);
    this._isDefaultsCreated = true;
  };

  transformHar = (
    harData: HAR = <HAR>{},
    entryCallback?: (entry: object, statusCode: number, routePath: string, response: any) => Routes,
    finalCallback?: (generatedMock: Routes) => Routes
  ): Routes => {
    try {
      const entries: HarEntry[] = harData?.log?.entries || [];

      const generatedMock: Routes = {};

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

        let uRoutes: Routes = {
          [routePath]: {
            statusCode,
            mock: response
          }
        };

        if (_.isFunction(entryCallback)) {
          uRoutes = entryCallback(entry, statusCode, routePath, response) || {};
        }

        const [uRoutePath, uRouteConfig] = Object.entries(uRoutes)[0] || []

        this.#setLoopedMock(generatedMock, uRoutePath, uRouteConfig);

      });

      if (_.isFunction(finalCallback)) {
        return finalCallback(generatedMock);
      }

      return generatedMock;
    } catch (err) {
      console.error('transformHar : ' + chalk.red(err.message));
      if (this._config.throwError) throw new Error(err);
      return {} as Routes;
    }
  };

  resetServer = () => {
    this._isServerLaunched = false;
    this._isServerStarted = false;
    this._isResourcesLoaded = false;
    this._isDefaultsCreated = false;
    this._isExpressAppCreated = false;

    this._app = undefined;
    this._server = undefined;
  };

  #setLoopedMock = (generatedMock: Routes, uroutePath: string, routeConfig: RouteConfig) => {
    const routePath = this.getValidRoutePaths(uroutePath).join(',');
    if (!generatedMock[routePath]) {
      generatedMock[routePath] = routeConfig
    } else {
      const mockValue = generatedMock[routePath].mock;

      if (generatedMock[routePath].middleware === "loopMock") {
        generatedMock[routePath].mock?.push(routeConfig.mock);
      } else {
        generatedMock[routePath] = {
          mock: [
            mockValue,
            routeConfig.mock || routeConfig
          ],
          middleware: "loopMock"
        }
      }
    }
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