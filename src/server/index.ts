import chalk from "chalk";
import express from "express";
import { Server } from "http";
import * as _ from 'lodash';
import path from "path";
import enableDestroy from 'server-destroy';
import { GettersSetters } from './getters-setters';
import Defaults from './middlewares/defaults';
import Delay from './middlewares/delay';
import ErrorHandler from './middlewares/errorHandler';
import { Fetch } from './middlewares/fetch';
import FinalMiddleware from './middlewares/finalMiddleware';
import InitialMiddleware from './middlewares/initialMiddleware';
import PageNotFound from './middlewares/pageNotFound';
import Rewriter from './middlewares/rewriter';
import * as ParamTypes from "./types/param.types";
import * as UserTypes from "./types/user.types";
import * as ValidTypes from "./types/valid.types";
import { cleanDb, flatQuery, replaceObj } from './utils';
import { getValidDb } from './utils/validators';

export class MockServer extends GettersSetters {

  static #mockServer: MockServer | undefined;
  constructor(config?: ParamTypes.Config) { super(config) }

  static Create = (config?: ParamTypes.Config) => {
    if (!MockServer.#mockServer) {
      MockServer.#mockServer = new MockServer(config);
      return MockServer.#mockServer;
    } else {
      MockServer.#mockServer?.setConfig(config);
      return MockServer.#mockServer;
    }
  }

  static Destroy = async (mockServer?: MockServer) => {
    if (mockServer) {
      try { await mockServer.stopServer() } catch (err) { console.error(err.message) }
      mockServer.resetServer();
      return undefined;
    } else {
      try { await MockServer.#mockServer?.stopServer() } catch (err) { console.error(err.message) }
      MockServer.#mockServer?.resetServer();
      MockServer.#mockServer = undefined;
      return undefined;
    }
  }

  launchServer = async (
    db?: ParamTypes.Db,
    injectors?: ParamTypes.Injectors,
    middlewares?: ParamTypes.Middlewares,
    rewriters?: ParamTypes.Rewriters,
    store?: ParamTypes.Store
  ): Promise<Server | undefined> => {
    const app = this.app;

    this.setData(db, injectors, middlewares, rewriters, store);

    const rewriter = this.rewriter();
    app.use(rewriter);

    const defaults = this.defaults();
    app.use(defaults);

    this.middlewares._globals && app.use(this.middlewares._globals);

    const resources = this.resources();
    app.use(this.config.base, resources);

    const homePage = this.homePage();
    app.use(this.config.base, homePage);

    app.use(this.pageNotFound);
    app.use(this.errorHandler);

    return await this.startServer();
  };

  defaults = (options?: UserTypes.Config) => {
    options && this.setConfig({ ...this.config, ...options });
    return Defaults(this.config);
  }

  rewriter = (rewriters?: ParamTypes.Rewriters) => {
    rewriters && this.setRewriters(rewriters);
    return Rewriter(this.rewriters);
  }

  resources = (
    db?: ParamTypes.Db,
    injectors?: ParamTypes.Injectors,
    middlewares?: ParamTypes.Middlewares,
    store?: ParamTypes.Store,
  ) => {
    const router = express.Router();

    console.log(chalk.gray("Loading Resources..."));

    !_.isEmpty(middlewares) && this.setMiddlewares(middlewares, true);
    !_.isEmpty(injectors) && this.setInjectors(injectors, true);
    !_.isEmpty(store) && this.setStore(store, true);

    const validDb = !_.isEmpty(db)
      ? getValidDb(
        db,
        this.injectors,
        this.config.root,
        { reverse: this.config.reverse, dbMode: this.config.dbMode }
      )
      : this.db;

    Object.entries(validDb).forEach(([routePath, routeConfig]: [string, ValidTypes.RouteConfig]) =>
      this.#createRoute(routePath, routeConfig, router)
    );

    console.log(chalk.gray("Done."));
    return router;
  };

  #createRoute = (routePath: string, routeConfig: ValidTypes.RouteConfig, router: express.Router) => {

    if (this.routes.includes(routePath)) return; // If routes are already added to resource then do nothing

    this.routes.push(routePath);

    if (!this._getDb()[routePath]) {
      this._getDb()[routePath] = routeConfig;
      this.initialDb[routePath] = _.cloneDeep(routeConfig);
    }

    const middlewareList = this.#getMiddlewareList(routePath, routeConfig);

    if (routeConfig.ignoreMiddlewareWrappers) {
      router.use(routePath, middlewareList);
      return;
    }

    router?.all(routePath, middlewareList);
  }

  #getMiddlewareList = (routePath: string, routeConfig: ValidTypes.RouteConfig) => {
    const middlewares = (routeConfig.middlewares || [])
      .map(middleware => _.isString(middleware) ? this.middlewares[middleware] : middleware)
      .filter(_.isFunction)

    if (routeConfig.ignoreMiddlewareWrappers) return middlewares;

    return [
      InitialMiddleware(routePath, this._getDb, this.config, this._getStore),
      Delay,
      Fetch,
      ...middlewares,
      FinalMiddleware
    ];
  }

  startServer = (port?: number, host?: string): Promise<Server | undefined> => {

    if (_.isInteger(port) || !_.isEmpty(host)) {
      this.setConfig({
        ...this.config,
        port: port ?? this.config.port,
        host: host || this.config.host
      });
    }

    const { port: _port, host: _host, base: _base } = this.config;

    return new Promise((resolve, reject) => {

      if (this.server) {
        this.port = undefined;
        this.address = undefined;
        this.listeningTo = undefined;
        const { port } = this.server.address() as { address: string; family: string; port: number; };
        console.error("\nServer already listening to port : " + port);
        return reject(new Error("Server already listening to port : " + port));
      }

      this.server = this.app.listen(_port, _host, () => {
        console.log(chalk.green("Mock Server Started!"));

        const serverAddress = this.server!.address() as { address: string; family: string; port: number; };
        this.port = serverAddress.port;
        this.address = serverAddress.address;
        this.listeningTo = `http://${_host}:${this.port}${_base}`;

        console.log("\n" + chalk.whiteBright("Access URLs:"));
        console.log(chalk.gray("-----------------------------------"));
        console.log("Localhost: " + chalk.magenta(`http://${_host}:${this.port}${_base}`));
        console.log("      LAN: " + chalk.magenta(`http://${this.address}:${this.port}${_base}`));
        console.log(chalk.gray("-----------------------------------"));
        console.log(chalk.blue("Press CTRL+C to stop"));

        console.log("\n" + chalk.gray("listening...") + "\n");

        enableDestroy(this.server!); // Enhance with a destroy function
        resolve(this.server!);
      }).on("error", (err) => {
        this.port = undefined;
        this.server = undefined;
        this.address = undefined;
        this.listeningTo = undefined;
        console.error("\nServer Error : " + chalk.red(err.message));
        reject(err);
      })
    })
  };

  stopServer = (): Promise<boolean> => {
    console.log("\n" + chalk.gray("Stopping Server..."));
    return new Promise((resolve, reject) => {

      if (!this.server) {
        console.error("\nNo Server to Stop");
        return reject(new Error("No Server to Stop"));
      }

      this.server?.destroy((err) => {
        if (err) {
          console.error("\nServer Error : " + chalk.red(err.message));
          return reject(err);
        }
        this.port = undefined;
        this.server = undefined;
        this.address = undefined;
        this.listeningTo = undefined;
        console.log(chalk.gray("Mock Server Stopped"));
        resolve(true);
      })
    })
  };

  resetServer = this.init;

  pageNotFound = PageNotFound;

  errorHandler = ErrorHandler;

  resetDb = (ids: string[] = [], routePaths: string[] = []) => {
    if (!ids.length && !routePaths.length) {
      replaceObj(this._getDb(), _.cloneDeep(this.initialDb));
      return this.db;
    } else {
      const _routePaths = ids.map(id => Object.keys(this.initialDb).find(r => this.initialDb[r].id == id)).filter(Boolean) as string[];
      const routePathToReset = [..._routePaths, ...routePaths];
      const restoredRoutes = routePathToReset.reduce((result, routePath) => {
        replaceObj(this._getDb()[routePath], _.cloneDeep(this.initialDb[routePath]))
        return { ...result, [routePath]: this.db[routePath] }
      }, {});
      return restoredRoutes
    }
  }

  homePage = () => {
    const router = express.Router();

    const homePageDir = path.join(__dirname, '../../public'); // Serve Home page files
    router.use(express.static(homePageDir));

    const defaultRoutes: Array<[string, express.RequestHandler]> = [
      ["/_db/:id?", (req: express.Request, res: express.Response) => {
        if (req.method === 'POST') {
          this.#addDb(req, res, router);
        } else if (req.method === 'PUT') {
          this.#updateRouteConfig(req, res);
        } else {
          this.#getDb(req, res);
        }
      }],
      ["/_rewriters", (_req, res) => res.send(this.rewriters)],
      ["/_store", (_req, res) => res.send(this.store)],
      ["/_reset/db/:id?", (req, res) => {
        const ids = flatQuery(req.params.id || req.query.id) as string[];
        const restoredRoutes = this.resetDb(ids);
        res.send(restoredRoutes);
      }],
    ]

    defaultRoutes.forEach(([routePath, middleware]) => {
      if (!this.routes.includes(routePath)) {
        router.all(routePath, middleware);
        this.routes.push(routePath);
      }
    })

    return router;
  }

  #addDb = (req: express.Request, res: express.Response, router: express.Router) => {
    const validDb = getValidDb(
      req.body,
      this.injectors,
      this.config.root,
      { reverse: this.config.reverse, dbMode: this.config.dbMode }
    );

    const newDbEntries = Object.entries(validDb).filter(([routePath]) => !this.routes.includes(routePath));

    const response = {};
    newDbEntries.forEach(([routePath, routeConfig]: [string, ValidTypes.RouteConfig]) => {
      response[routePath] = routeConfig;
      this.#createRoute(routePath, routeConfig, router)
    });

    res.send(response);
  }

  #getDb = (req: express.Request, res: express.Response) => {
    const id = req.params.id;
    const findById = (id) => {
      const dbById = Object.entries(this.db).find(([_routePath, routeConfig]) => routeConfig.id === id);
      if (_.isEmpty(dbById)) return {};
      return { [dbById![0]]: dbById![1] }
    }
    const db = id ? findById(id) : this.db;
    if (req.query._clean) cleanDb(db, this.config.dbMode);
    res.send(db);
  }

  #updateRouteConfig = (req: express.Request, res: express.Response) => {
    const dbToUpdate = req.body as ValidTypes.Db;

    const response = {};
    const db = this._getDb();

    Object.entries(dbToUpdate).forEach(([routePath, routeConfig]) => {
      delete routeConfig.middlewares;
      if (db[routePath]) {
        replaceObj(db[routePath], { ...db[routePath], ...routeConfig });
        response[routePath] = db[routePath]
      }
    })
    res.send(response);
  }
}

export default MockServer;