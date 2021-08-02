import chalk from "chalk";
import express, { Router } from "express";
import { Server } from "http";
import * as _ from 'lodash';
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
  Config, Default_Options,
  KeyValString,
  Middlewares,
  RouteConfig,
  Routes, UserConfig,
  UserMiddlewares,
  UserRewriter,
  UserRoutes,
  UserStore
} from "./model";
import { clean, flatQuery, getCleanedRoutes } from './utils';
import CRUD from './utils/crud';

export class MockServer extends GettersSetters {

  constructor(
    config?: UserConfig,
    store?: UserStore,
  ) {
    super(config, store);
  }

  launchServer = async (
    routes?: UserRoutes,
    middlewares?: UserMiddlewares,
    injectors?: UserRoutes,
    routeRewriters?: UserRewriter
  ) => {
    const app = this.app;

    const rewriter = this.rewriter(routeRewriters);
    app.use(rewriter);

    const defaults = this.defaults();
    app.use(defaults);

    const resources = this.resources(routes, middlewares, injectors);
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

  rewriter = (routeRewriters?: UserRewriter) => {
    routeRewriters && this.setRewriterRoutes(routeRewriters);
    return Rewriter(this.routeRewriters);
  }

  pageNotFound = PageNotFound;

  errorHandler = ErrorHandler;

  resources = (
    routes?: UserRoutes,
    middlewares?: UserMiddlewares,
    injectors?: UserRoutes
  ) => {

    if (_.isEmpty(routes) && _.isEmpty(this.routes)) {
      this.setRoutes() // setting Sample Routes
    }

    !_.isEmpty(routes) && this.setRoutes(routes);
    !_.isEmpty(middlewares) && this.setMiddlewares(middlewares);
    !_.isEmpty(injectors) && this.setInjectors(injectors);

    console.log("\n" + chalk.gray("Loading Resources..."));

    this.router = express.Router();
    Object.entries(this.routes).forEach(routes => this.#createRoute(...routes, this.router));

    console.log(chalk.gray("Done."));
    return this.router;
  };

  #createRoute = (routePath: string, routeConfig: RouteConfig = {}, router: Router) => {
    if (!this.routesList.includes(routePath)) {
      this.routesList.push(routePath);
      const middlewareList = this.#getMiddlewareList(routePath, routeConfig);
      if (!Object.keys(this.routes).includes(routePath)) {
        this.routes[routePath] = routeConfig;
      }
      router?.all(routePath, middlewareList);
    };
  }

  addRoutes = (routes: Routes, router: Router = this.router) => {
    const validRoutes = this.getValidRoutes(routes);
    if (!this.router) this.router = express.Router();
    Object.entries(validRoutes).forEach(([routePath, routeConfig]) => this.#createRoute(routePath, routeConfig, router));
    this.initialRoutes = _.cloneDeep(this.routes);
  }

  getRoutes = (_ids: string[] = [], routePaths: string[] = []): Routes => {
    if (!_ids.length && !routePaths.length) return _.cloneDeep(this.routes) as Routes;
    const _routePaths = _ids.map(_id => _.findKey(this.routes, { "_id": _id })).filter(Boolean) as string[];
    const routePathsList = [..._routePaths, ...routePaths];
    return _.cloneDeep(routePathsList.reduce((res, rp) => ({ ...res, [rp]: this.routes[rp] }), {})) as Routes;
  }

  #getMiddlewareList = (routePath: string, routeConfig: RouteConfig) => {
    const userMiddlewares = (routeConfig.middlewares || [])
      .filter(m => _.isFunction(this.middlewares?.[m]))
      .map(m => this.middlewares?.[m]);

    const middleware = _.isFunction(routeConfig.middleware) ? routeConfig.middleware! : (_req, _res, next) => next();

    const middlewareList: express.RequestHandler[] = [
      InitialMiddleware(routePath, this.routes, this.getRoutes, this.config, this.store),
      Delay,
      Fetch,
      middleware,
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
        resolve(this.server!);
      })
    })
  };

  stopServer = (): Promise<boolean> => {
    console.log("\n" + chalk.gray("Stopping Server..."));
    return new Promise((resolve) => {
      this.server?.close(() => {
        this.resetServer();
        console.log(chalk.gray("\n Mock Server Stopped"));
        resolve(true);
      });
    })
  };

  resetServer = () => {
    this.app = express().set("json spaces", 2);
    this.router = express.Router();
    this.server = undefined;
    this.routesList = [];

    this.routes = {} as Routes;
    this.config = { ...Default_Config } as Config;
    this.middlewares = { ...Default_Middlewares } as Middlewares;
    this.injectors = {} as Routes;
    this.store = {} as Object;
    this.routeRewriters = {} as KeyValString;

    this.initialRoutes = {} as Routes;
    this.initialStore = {} as Object;
  };

  resetStore = (keys?: string[]) => {
    if (keys?.length) {
      const restoredStore = keys.reduce((result, key) => {
        this.store[key] = _.cloneDeep(this.initialStore[key]);
        return { ...result, [key]: this.store[key] };
      }, {});
      return restoredStore;
    } else {
      this.store = _.cloneDeep(this.initialStore) as Object;
      return this.store;
    }
  }

  resetRoutes = (_ids: string[] = [], routePaths: string[] = []) => {
    if (!_ids.length && !routePaths.length) {
      this.routes = _.cloneDeep(this.initialRoutes);
      return this.routes;
    } else {
      const _routePaths = _ids.map(_id => _.findKey(this.initialRoutes, { "_id": _id })).filter(Boolean) as string[];
      const routePathToReset = [..._routePaths, ...routePaths];
      const restoredRoutes = routePathToReset.reduce((result, routePath) => {
        this.routes[routePath] = _.cloneDeep(this.initialRoutes[routePath]);
        return { ...result, [routePath]: this.routes[routePath] }
      }, {});
      return restoredRoutes
    }
  }

  defaultRoutes = () => {

    const router = express.Router();

    const defaultRoutes: Array<[string, express.RequestHandler]> = [
      ["/_routes/:_id?", (req: express.Request, res: express.Response) => {
        if (req.method === 'POST') {
          this.addRoutes(req.body);
          res.send(this.routes);
        } else if (req.method === 'PUT') {
          this.#replaceRouteConfig(req, res);
        } else {
          this.#getRoutes(req, res);
        }
      }],
      ["/_rewriter", (_req, res) => res.send(this.routeRewriters)],
      ["/_store/:key?", (req, res) => {
        const keys = flatQuery(req.params.key || req.query.key) as string[];
        if (keys.length) {
          const store = keys.reduce((res, key) => ({ ...res, [key]: this.store[key] }), {})
          res.send(store);
        } else {
          res.send(this.store)
        }
      }],
      ["/_reset/route/:_id?", (req, res) => {
        const _ids = flatQuery(req.params._id || req.query._id);
        const restoredRoutes = this.resetRoutes(_ids);
        res.send(restoredRoutes);
      }],
      ["/_reset/store/:key?", (req, res) => {
        const keys = flatQuery(req.params.key || req.query.key);
        const restoredStore = this.resetStore(keys);
        res.send(restoredStore)
      }]
    ]

    defaultRoutes.forEach(([routePath, middleware]) => {
      if (!this.routesList.includes(routePath)) {
        router.all(routePath, middleware);
        this.routesList.push(routePath);
      }
    })

    return router;
  }

  #getRoutes = (req: express.Request, res: express.Response) => {
    const routeConfigList = Object.entries(_.cloneDeep(this.routes) as Routes)
      .map(([routePath, routeConfig]) => ({ ...routeConfig, routePath }));

    req.params.id = req.params._id;
    req.query.id = req.query._id ?? req.query.id;

    const isClean = req.query._clean;
    delete req.query._clean;

    try {
      const result = CRUD.search(req, res, routeConfigList, "_id");
      let routes = [].concat(result).filter(Boolean).reduce((res, routeConfig: any) => {
        const routePath = routeConfig.routePath;
        delete routeConfig.routePath;
        return { ...res, [routePath]: routeConfig }
      }, {})

      if (isClean) routes = getCleanedRoutes(routes);

      res.send(routes);
    } catch (err) {
      res.send(this.routes);
    }
  }

  #replaceRouteConfig = (req: express.Request, res: express.Response) => {
    const updatedRouteConfig = clean([].concat(req.body)[0]) as RouteConfig;
    const routePath = _.findKey(this.routes, { _id: req.params._id });
    const existingRouteConfig = this.routes[routePath];
    if (routePath) {
      for (let key in existingRouteConfig) {
        delete this.routes[routePath][key] // clearing all existing Route Config values.
      }
      for (let key in updatedRouteConfig) {
        this.routes[routePath][key] = updatedRouteConfig[key] // adding updated Route Config values
      }
    }
    res.send(this.routes);
  }
}