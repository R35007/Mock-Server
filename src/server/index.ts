import chalk from "chalk";
import express, { Router } from "express";
import { Server } from "http";
import * as _ from 'lodash';
import enableDestroy from 'server-destroy';
import Default_Config from './config';
import { GettersSetters } from './getters-setters';
import Default_Middlewares from './middlewares';
import Defaults from './middlewares/defaults';
import Delay from './middlewares/delay';
import ErrorHandler from './middlewares/errorHandler';
import Fetch from './middlewares/fetch';
import FinalMiddleware from './middlewares/finalMiddleware';
import InitialMiddleware from './middlewares/initialMiddleware';
import PageNotFound from './middlewares/pageNotFound';
import Rewriter from './middlewares/rewriter';
import {
  Config, Db, Default_Options,
  Injector,
  KeyValString,
  Middleware,
  RouteConfig, UserConfig, UserDb, UserInjectors, UserMiddleware,
  UserRewriters, UserStore
} from "./model";
import { cleanRouteConfig, flatQuery, getDbSnapShot, replaceObj } from './utils';
import CRUD from './utils/crud';

export class MockServer extends GettersSetters {

  static #mockServer: MockServer | undefined;
  constructor(config?: UserConfig) { super(config) }

  static Create = (config?: UserConfig) => {
    if (!MockServer.#mockServer) {
      MockServer.#mockServer = new MockServer(config);
      return MockServer.#mockServer;
    } else {
      MockServer.#mockServer?.setConfig(config);
      return MockServer.#mockServer;
    }
  }

  static Destroy = async () => {
    MockServer.#mockServer?.server && await MockServer.#mockServer.stopServer();
    MockServer.#mockServer = undefined;
  }

  launchServer = async (
    db?: UserDb,
    middleware?: UserMiddleware,
    injectors?: UserInjectors,
    rewriters?: UserRewriters,
    store?: UserStore
  ) => {
    const app = this.app;

    const rewriter = this.rewriter(rewriters);
    app.use(rewriter);

    const defaults = this.defaults();
    app.use(defaults);

    const resources = this.resources(db, middleware, injectors, store);

    app.use(([] as any).concat(this.middleware?.globals || []))
    app.use(this.config.base, resources);

    const defaultRoutes = this.defaultRoutes();
    app.use(this.config.base, defaultRoutes);

    app.use(this.pageNotFound);
    app.use(this.errorHandler);

    await this.startServer();
  };

  defaults = (options?: Default_Options) => {
    options && this.setConfig({ ...this.config, ...options });
    return Defaults(this.config);
  }

  rewriter = (rewriters?: UserRewriters) => {
    rewriters && this.setRewriters(rewriters);
    return Rewriter(this.rewriters);
  }

  pageNotFound = PageNotFound;

  errorHandler = ErrorHandler;

  resources = (
    db?: UserDb,
    middleware?: UserMiddleware,
    injectors?: UserInjectors,
    store?: UserStore,
  ) => {

    !_.isEmpty(middleware) && this.setMiddleware(middleware);
    !_.isEmpty(injectors) && this.setInjectors(injectors);
    !_.isEmpty(store) && this.setStore(store);
    !_.isEmpty(db) && this.setDb(db);

    console.log("\n" + chalk.gray("Loading Resources..."));

    this.router = express.Router();
    Object.entries(this.db).forEach(routes => this.#createRoute(...routes, this.router));

    console.log(chalk.gray("Done."));
    return this.router;
  };

  #createRoute = (routePath: string, routeConfig: RouteConfig = {}, router: Router) => {
    if (!this.routes.includes(routePath)) {
      this.routes.push(routePath);
      const middlewareList = this.#getMiddlewareList(routePath, routeConfig);

      // adding new Routes
      if (!Object.keys(this.db).includes(routePath)) {
        this.db[routePath] = routeConfig;
        this.initialDb[routePath] = _.cloneDeep(routeConfig);
      }
      router?.all(routePath, middlewareList);
    };
  }

  addDbData = (db: Db, router: Router = this.router) => {
    const validRoutes = this.getValidDb(db);
    if (!this.router) this.router = express.Router();
    Object.entries(validRoutes).forEach(([routePath, routeConfig]) => this.#createRoute(routePath, routeConfig, router));
  }

  getDb = (ids: string[] = [], routePaths: string[] = []): Db => {
    if (!ids.length && !routePaths.length) return _.cloneDeep(this.db) as Db;
    const _routePaths = ids.map(id => _.findKey(this.db, { id })).filter(Boolean) as string[];
    const routePathsList = [..._routePaths, ...routePaths];
    return _.cloneDeep(routePathsList.reduce((res, rp) => ({ ...res, [rp]: this.db[rp] }), {})) as Db;
  }

  #getMiddlewareList = (routePath: string, routeConfig: RouteConfig) => {
    const userMiddlewares = (routeConfig.middlewareNames || [])
      .filter(middlewareName => _.isFunction(this.middleware?.[middlewareName]))
      .map(middlewareName => this.middleware?.[middlewareName]);

    const middlewares = (routeConfig.middlewares || []).filter(m => _.isFunction(m)) as Array<express.RequestHandler>;

    const middlewareList: express.RequestHandler[] = [
      InitialMiddleware(routePath, this.db, this.getDb, this.config, this.store),
      Delay,
      Fetch,
      ...middlewares,
      ...userMiddlewares,
      FinalMiddleware
    ];

    return middlewareList;
  }

  startServer = (_port?: number, _host?: string): Promise<Server> => {
    const { port, host, base } = this.config;
    (_port || _host) && this.setConfig({ ...this.config, port: _port || port, host: _host || host });

    console.log("\n" + chalk.gray("Starting Server..."));
    return new Promise((resolve) => {
      this.server = this.app?.listen(port, host, () => {
        console.log(chalk.green.bold("Mock Server Started."));

        console.log("\nHome");
        console.log(`http://${host}:${port}/${base}`);

        console.log(chalk.gray("listening...") + "\n");

        enableDestroy(this.server!); // Enhance with a destroy function
        resolve(this.server!);
      })
    })
  };

  stopServer = (): Promise<boolean> => {
    console.log("\n" + chalk.gray("Stopping Server..."));
    return new Promise((resolve) => {
      this.server?.destroy(() => {
        this.resetServer();
        console.log(chalk.gray("Mock Server Stopped"));
        resolve(true);
      })
    })
  };

  resetServer = () => {
    this.app = express().set("json spaces", 2);
    this.router = express.Router();
    this.server = undefined;
    this.routes = [];

    this.db = {} as Db;
    this.config = { ...Default_Config } as Config;
    this.middleware = { ...Default_Middlewares } as Middleware;
    this.injectors = {} as { [key: string]: Injector };
    this.store = {} as Object;
    this.rewriters = {} as KeyValString;

    this.initialDb = {} as Db;
    this.initialStore = {} as Object;
  };

  resetStore = (keys?: string[]) => {
    if (keys?.length) {
      const restoredStore = keys.reduce((result, key) => {
        replaceObj(this.store[key], _.cloneDeep(this.initialStore[key]));
        return { ...result, [key]: this.store[key] };
      }, {});
      return restoredStore;
    } else {
      replaceObj(this.store, _.cloneDeep(this.initialStore));
      return this.store;
    }
  }

  resetDb = (ids: string[] = [], routePaths: string[] = []) => {
    if (!ids.length && !routePaths.length) {
      replaceObj(this.db, _.cloneDeep(this.initialDb));
      return this.db;
    } else {
      const _routePaths = ids.map(id => _.findKey(this.initialDb, { id })).filter(Boolean) as string[];
      const routePathToReset = [..._routePaths, ...routePaths];
      const restoredRoutes = routePathToReset.reduce((result, routePath) => {
        replaceObj(this.db[routePath], _.cloneDeep(this.initialDb[routePath]))
        return { ...result, [routePath]: this.db[routePath] }
      }, {});
      return restoredRoutes
    }
  }

  defaultRoutes = () => {

    const router = express.Router();

    const defaultRoutes: Array<[string, express.RequestHandler]> = [
      ["/_db/:id?", (req: express.Request, res: express.Response) => {
        if (req.method === 'POST') {
          this.addDbData(req.body);
          res.send(this.db);
        } else if (req.method === 'PUT') {
          this.#replaceRouteConfig(req, res);
        } else {
          this.#getDb(req, res);
        }
      }],
      ["/_rewriters", (_req, res) => res.send(this.rewriters)],
      ["/_store/:key?", (req, res) => {
        const keys = flatQuery(req.params.key || req.query.key) as string[];
        if (keys.length) {
          const store = keys.reduce((res, key) => ({ ...res, [key]: this.store[key] }), {})
          res.send(store);
        } else {
          res.send(this.store)
        }
      }],
      ["/_reset/db/:id?", (req, res) => {
        const ids = flatQuery(req.params.id || req.query.id);
        const restoredRoutes = this.resetDb(ids);
        res.send(restoredRoutes);
      }],
      ["/_reset/store/:key?", (req, res) => {
        const keys = flatQuery(req.params.key || req.query.key);
        const restoredStore = this.resetStore(keys);
        res.send(restoredStore)
      }]
    ]

    defaultRoutes.forEach(([routePath, middleware]) => {
      if (!this.routes.includes(routePath)) {
        router.all(routePath, middleware);
        this.routes.push(routePath);
      }
    })

    return router;
  }

  #getDb = (req: express.Request, res: express.Response) => {
    const routeConfigList = Object.entries(_.cloneDeep(this.db) as Db)
      .map(([routePath, routeConfig]) => ({ ...routeConfig, routePath }));

    const isSnapShot = req.query._snapshot;
    delete req.query._snapshot;

    try {
      const result = CRUD.search(req, res, routeConfigList);
      let routes = [].concat(result).filter(Boolean).reduce((res, routeConfig: any) => {
        const routePath = routeConfig.routePath;
        delete routeConfig.routePath;
        return { ...res, [routePath]: routeConfig }
      }, {})

      if (isSnapShot) routes = getDbSnapShot(routes);

      res.send(routes);
    } catch (err) {
      res.send(this.db);
    }
  }

  #replaceRouteConfig = (req: express.Request, res: express.Response) => {
    const updatedRouteConfig = cleanRouteConfig([].concat(req.body)[0]) as RouteConfig;
    const routePath = _.findKey(this.db, { id: req.params.id });
    routePath && replaceObj(this.db[routePath], updatedRouteConfig)
    res.send(this.db);
  }
}