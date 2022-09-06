import chalk from "chalk";
import express from "express";
import { Server } from "http";
import * as _ from 'lodash';
import * as fs from 'fs';
import ora from 'ora';
import path from "path";
import enableDestroy from 'server-destroy';
import { GettersSetters } from './getters-setters';
import {
  Defaults,
  Delay,
  ErrorHandler,
  Fetch,
  FinalMiddleware,
  InitialMiddleware,
  PageNotFound,
  Rewriter
} from './middlewares';
import { LaunchServerOptions, ResourceOptions, SetterOptions } from './types/common.types';
import * as ParamTypes from "./types/param.types";
import * as UserTypes from "./types/user.types";
import * as ValidTypes from "./types/valid.types";
import { getCleanDb, flatQuery, replaceObj } from './utils';
import { getValidConfig, getValidDb, getValidInjectors, getValidMiddlewares } from './utils/validators';

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
      if (mockServer === MockServer.#mockServer) MockServer.#mockServer = undefined;
      return undefined;
    } else {
      try { await MockServer.#mockServer?.stopServer() } catch (err) { console.error(err.message) }
      MockServer.#mockServer?.resetServer();
      MockServer.#mockServer = undefined;
      return undefined;
    }
  }

  async launchServer(
    db?: ParamTypes.Db,
    {
      injectors,
      middlewares,
      store,
      rewriters,
      router,
      log
    }: LaunchServerOptions = {}
  ): Promise<Server | undefined> {
    const app = this.app;

    this.setData({ injectors, middlewares, store, rewriters });

    const rewriter = this.rewriter();
    app.use(rewriter);

    const defaults = this.defaults();
    app.use(defaults);

    this.middlewares._globals && app.use(this.middlewares._globals);

    const resources = this.resources(db, { router, log });
    app.use(this.config.base, resources);

    const homePage = this.homePage({ log });
    app.use(this.config.base, homePage);

    app.use(this.pageNotFound);
    app.use(this.errorHandler);

    return await this.startServer();
  };

  defaults(
    options?: UserTypes.Config,
    { root = this.config.root }: SetterOptions = {}
  ) {
    const validConfig = options ? getValidConfig({ ...this.config, ...options }, { root }) : this.config
    return Defaults(validConfig);
  }

  rewriter(
    rewriters?: ParamTypes.Rewriters,
    { root = this.config.root, log }: SetterOptions = {}
  ): express.Router {
    rewriters && this.setRewriters(rewriters, { root, log, merge: true })
    return Rewriter(this.rewriters);
  }

  resources(
    db?: ParamTypes.Db,
    {
      injectors,
      middlewares,
      reverse = this.config.reverse,
      root = this.config.root,
      dbMode = this.config.dbMode,
      router = express.Router(),
      log = false
    }: ResourceOptions = {},
  ): express.Router {
    const logText = `${log}` === "true" ? "Db Resources" : log;
    const spinner = !global.quiet && `${log}` !== "false" && ora(`Loading ${logText}...`).start();

    const mockServer = this._getServerDetails();
    const validMiddlewares = middlewares ? getValidMiddlewares(middlewares, { root, mockServer }) : this.middlewares;
    const validInjectors = injectors ? getValidInjectors(injectors, { root, mockServer }) : this.injectors;
    const validDb = db ? getValidDb(db, { root, injectors: validInjectors, reverse, dbMode, mockServer }) : this.db;

    Object.entries(validDb).forEach(([routePath, routeConfig]: [string, ValidTypes.RouteConfig]) =>
      this.#createRoute(routePath, routeConfig, router, validMiddlewares)
    );

    spinner && spinner.stopAndPersist({ symbol: "✔", text: chalk.gray(`${logText} Loaded.`) });
    return router;
  };

  #createRoute = (routePath: string, routeConfig: ValidTypes.RouteConfig, router: express.Router, validMiddlewares: ValidTypes.Middlewares) => {
    if (this.routes.includes(routePath)) return; // If routes are already added to resource then do nothing
    this.routes.push(routePath);

    if (!this.getDb()[routePath]) {
      this.getDb()[routePath] = routeConfig;
      this.initialDb[routePath] = _.cloneDeep(routeConfig);
    }

    const middlewareList = this.#getMiddlewareList(routePath, routeConfig, validMiddlewares);

    if (routeConfig.directUse) {
      router.use(routePath, middlewareList);
      return;
    }
    router?.all(routePath, middlewareList);
  }

  #getMiddlewareList = (routePath: string, routeConfig: ValidTypes.RouteConfig, validMiddlewares: ValidTypes.Middlewares) => {
    const middlewares = (routeConfig.middlewares || [])
      .map(middleware => _.isString(middleware) ? validMiddlewares[middleware] : middleware)
      .filter(_.isFunction)

    if (routeConfig.directUse) return middlewares;

    return [
      InitialMiddleware(routePath, this.config, this.getDb, this.getStore),
      Delay,
      Fetch,
      ...middlewares,
      FinalMiddleware
    ];
  }

  startServer(port?: number, host?: string): Promise<Server | undefined> {

    if (_.isInteger(port) || !_.isEmpty(host)) {
      this.setConfig({
        ...this.config,
        port: port ?? this.config.port,
        host: host || this.config.host
      });
    }

    const { port: _port, host: _host, base: _base } = this.config;

    const spinner = ora('Starting Server...').start();

    return new Promise((resolve, reject) => {

      if (this.server) {
        spinner.stop();
        this.port = undefined;
        this.address = undefined;
        this.listeningTo = undefined;
        const { port } = this.server.address() as { address: string; family: string; port: number; };
        console.error(chalk.red("\nServer already listening to port : ") + chalk.yellow(port));
        return reject(new Error("Server already listening to port : " + port));
      }

      this.server = this.app.listen(_port, _host, async () => {
        spinner.stop();
        process.stdout.write(chalk.green("\nMock Server Started!\n"));

        const serverAddress = this.server!.address() as { address: string; family: string; port: number; };
        this.port = serverAddress.port;
        this.address = serverAddress.address;
        this.listeningTo = `http://${_host}:${this.port}${_base}`;

        console.log("\n" + chalk.whiteBright("Access URLs:"));
        console.log(chalk.gray("-----------------------------------"));
        process.stdout.write("Localhost: " + chalk.magenta(`http://${_host}:${this.port}${_base}`));
        console.log("\n      LAN: " + chalk.magenta(`http://${this.address}:${this.port}${_base}`));
        console.log(chalk.gray("-----------------------------------"));
        console.log(chalk.blue("Press CTRL+C to stop"));

        process.stdout.write("\n" + chalk.gray("listening...") + "\n");

        enableDestroy(this.server!); // Enhance with a destroy function
        resolve(this.server!);
      }).on("error", (err) => {
        spinner.stop();
        this.port = undefined;
        this.server = undefined;
        this.address = undefined;
        this.listeningTo = undefined;
        console.error(chalk.red("\nServer Failed to Start!"));
        console.error(err.message);
        reject(err);
      })
    })
  };

  stopServer(): Promise<boolean> {
    const spinner = ora('Stopping Server...').start();
    return new Promise((resolve, reject) => {

      if (!this.server || !this.server?.destroy) {
        spinner && spinner.stop();
        console.error(chalk.red("\nNo Server to Stop"));
        return reject(new Error("No Server to Stop"));
      }

      this.server?.destroy?.((err) => {
        if (err) {
          spinner.stop();
          console.error(chalk.red("\nServer Failed to Stop!"));
          console.error(err.message);
          return reject(err);
        }
        this.port = undefined;
        this.server = undefined;
        this.address = undefined;
        this.listeningTo = undefined;

        spinner.stop();
        process.stdout.write(chalk.green("Mock Server Stopped!"));
        resolve(true);
      })
    })
  };

  resetServer = this.init;

  pageNotFound = PageNotFound;

  errorHandler = ErrorHandler;

  resetDb(ids: string[] = [], routePaths: string[] = []) {
    if (!ids.length && !routePaths.length) {
      replaceObj(this.getDb(), _.cloneDeep(this.initialDb));
      return this.db;
    } else {
      const _routePaths = ids.map(id => Object.keys(this.initialDb).find(r => this.initialDb[r].id == id)).filter(Boolean) as string[];
      const routePathToReset = [..._routePaths, ...routePaths];
      const restoredRoutes = routePathToReset.reduce((result, routePath) => {
        replaceObj(this.getDb()[routePath], _.cloneDeep(this.initialDb[routePath]))
        return { ...result, [routePath]: this.db[routePath] }
      }, {});
      return restoredRoutes
    }
  }

  homePage({ log }: { log?: boolean } = {}): express.Router {
    const spinner = !global.quiet && log && ora(`Loading HomePage Resources...`).start();

    const router = express.Router();

    // Get Bootstrap path from nearest node_modules
    let bootstrapDir = path.join(__dirname, '../../node_modules/bootstrap/dist');
    bootstrapDir = fs.existsSync(bootstrapDir) ? bootstrapDir : path.join(__dirname, '../../../../bootstrap/dist');

    const homePageDir = path.join(__dirname, '../../public');
    router.use(express.static(homePageDir));  // Serve Mock Server HomePage

    const homePageRoutes = {
      "/_assets/bootstrap": express.static(bootstrapDir),
      "/_db/:id?": (req: express.Request, res: express.Response) => {
        switch (req.method) {
          case 'POST': return this.#addDb(req, res, router);
          case 'PUT': return this.#updateRouteConfig(req, res);
          default: return this.#getDb(req, res);
        }
      },
      "/_rewriters": (_req, res) => res.send(this.rewriters),
      "/_routes": (_req, res) => res.send(this.routes),
      "/_store": (_req, res) => res.send(this.store),
      "/_reset/:id?": (req, res) => {
        const ids = flatQuery(req.params.id || req.query.id) as string[];
        const restoredRoutes = this.resetDb(ids);
        res.send(restoredRoutes);
      },
    }

    Object.entries(homePageRoutes)
      .forEach(([routePath, routeConfig]) => {
        if (this.routes.includes(routePath)) return;
        this.routes.push(routePath);
        router.use(routePath, routeConfig);
      })

    spinner && spinner.stopAndPersist({ symbol: "✔", text: chalk.gray(`HomePage Resources Loaded.`) });
    return router;
  }

  #addDb = (req: express.Request, res: express.Response, router: express.Router) => {
    const validDb = getValidDb(req.body,
      {
        root: this.config.root,
        injectors: this.injectors,
        reverse: this.config.reverse,
        dbMode: this.config.dbMode,
        mockServer: this._getServerDetails()
      }
    );

    const newDbEntries = Object.entries(validDb).filter(([routePath]) => !this.routes.includes(routePath));
    const response = {};
    newDbEntries.forEach(([routePath, routeConfig]: [string, ValidTypes.RouteConfig]) => {
      response[routePath] = routeConfig;
      this.#createRoute(routePath, routeConfig, router, this.middlewares)
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
    const resultDb = req.query._clean ? getCleanDb(db, this.config.dbMode) : db;
    res.send(resultDb);
  }

  #updateRouteConfig = (req: express.Request, res: express.Response) => {
    const dbToUpdate = req.body as ValidTypes.Db;

    const response = {};
    const db = this.getDb();

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