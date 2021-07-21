import chalk from "chalk";
import express, { Router } from "express";
import { Server } from "http";
import * as _ from 'lodash';
import { nanoid } from 'nanoid';
import { GettersSetters } from './getters-setters';
import {
  Config,
  ExpressMiddleware,
  Middlewares,
  RouteConfig,
  Routes, UserConfig,
  UserMiddlewares,
  UserRewriter,
  UserRoutes,
  UserStore
} from "./model";
import { flatQuery } from './utils';
import { Default_Config } from './utils/config';
import { CRUD } from './utils/crud';
import { Defaults } from './utils/defaults';
import { ErrorHandler } from './utils/errorHandler';
import { FinalMiddleware } from './utils/finalMiddleware';
import { InitialMiddleware } from './utils/initialMiddleware';
import { Default_Middlewares } from './utils/middlewares';
import { PageNotFound } from './utils/pageNotFound';
import { Rewriter } from './utils/rewriter';

export class MockServer extends GettersSetters {

  constructor(
    routes?: UserRoutes,
    config?: UserConfig,
    middlewares?: UserMiddlewares,
    injectors?: UserRoutes,
    store?: UserStore,
    rewriter?: UserRewriter
  ) {
    super(routes, config, middlewares, injectors, store, rewriter);
  }

  launchServer = async () => {
    const app = this._app;

    const defaults = this.Defaults(this._config);
    app.use(defaults);

    const rewriter = this.Rewriter(this._rewriter);
    app.use(rewriter);

    const resource = this.Resource();
    app.use(this.config.base, resource);

    const defaultRoutes = this.DefaultRoutes();
    app.use(this.config.base, defaultRoutes);

    app.use(PageNotFound);
    app.use(ErrorHandler);

    if (this._defaultRoutes.length > 0) {
      console.log("\n" + chalk.white.bold("Default Routes : ") + "\n");
    }
    this._defaultRoutes.map((route) => {
      const name = route.replace("/", "").toUpperCase();
      console.log(`${chalk.white.bold(name)}  :  http://${this._config.host}:${this._config.port}${this._config.base}${route}`);
    });

    await this.startServer();
  };

  Defaults = (opts) => Defaults(opts || this._config);
  Rewriter = (routes) => Rewriter(routes || this._rewriter);

  Resource = (routes?: UserRoutes, config?: UserConfig, middlewares?: UserMiddlewares, injectors?: UserRoutes) => {

    console.log("\n" + chalk.gray("Loading Resources..."));

    routes && this.setRoutes(routes);
    config && this.setConfig(config);
    middlewares && this.setMiddlewares(middlewares);
    injectors && this.setInjectors(injectors);

    const router = express.Router();
    Object.entries(this._routes).forEach(routes => this.#createRoute(...routes, router));

    console.log(chalk.gray("Done. Resources Loaded."));

    return router;
  };

  #createRoute = (routePath: string, routeConfig: RouteConfig = {}, router: Router) => {
    if (!this._routesList.includes(routePath)) {
      this._routesList.push(routePath);
      const middlewareList = this.#getMiddlewareList(routePath, routeConfig);
      if (!Object.keys(this._routes).includes(routePath)) {
        this._routes[routePath] = routeConfig;
      }
      router.use(routePath, middlewareList);
    };
  }

  addRoutes = (routes: Routes) => {
    const router = express.Router();
    const validRoutes = this.getValidRoutes(routes);
    Object.entries(validRoutes).forEach(([routePath, routeConfig]) => this.#createRoute(routePath, routeConfig, router));
    this._app.use(this._config.base, router);
    this._initialRoutes = _.cloneDeep(this._routes);
  }

  #getMiddlewareList = (routePath: string, routeConfig: RouteConfig) => {
    const userMiddlewares = (routeConfig.middlewares || [])
      .filter(m => _.isFunction(this._middlewares?.[m]))
      .map(m => this._middlewares?.[m]);

    const middlewareList: ExpressMiddleware[] = [InitialMiddleware(routePath, this._routes[routePath], this._config, this._store)];
    _.isFunction(routeConfig.middleware) && middlewareList.push(...userMiddlewares);
    middlewareList.push(...userMiddlewares);
    middlewareList.push(FinalMiddleware);

    return middlewareList;
  }

  DefaultRoutes = () => {
    const router = express.Router();

    const defaultRoutes: Routes = {
      "/routesList": {
        middleware: (_req, res) => res.send(this._routesList),
        description: "This route gives you the list of available routes with baseUrl. It also included Default Routes."
      },
      "/routes/:_id?": {
        middleware: (req: express.Request, res: express.Response) => {
          if (req.method.toLowerCase() === 'post') {
            (req.body._id || req.query._id) ? this.#updateRoute(req, res) : this.#addRoute(req, res);
          } else {
            this.#getRoutes(req, res);
          }
        },
        description: `This route gives you the list of available routes with routeConfigs. It does not include Default Routes. 
        This route also helps to add new route or update the existing route config.`
      },
      "/config": {
        middleware: (_req, res) => res.send(this._config),
        description: "This route gives you the current Mock Server Configurations"
      },
      "/rewriter": {
        middleware: (_req, res) => res.send(this._rewriter),
        description: "This route gives you the current Mock Server rewriters"
      },
      "/store/:key?": {
        middleware: (req, res) => {
          const keys = flatQuery(req.params.key || req.query.key) as string[];
          if (keys.length) {
            const store = keys.reduce((res, key) => ({ ...res, [key]: this._store[key] }), {})
            res.send(store);
          } else {
            res.send(this._store)
          }
        },
        description: "This route gives you the store values"
      },
      "/reset/route/:_id?": {
        middleware: (req, res) => {
          const _ids = flatQuery(req.params._id || req.query._id);
          const resetedRoutes = this.resetRoutes(_ids);
          res.send(resetedRoutes);
        },
        description: "This route helps to reset the routeConfigs to its initial state. Pass _id as a query param to reset the specific route."
      },
      "/reset/store/:key?": {
        middleware: (req, res) => {
          const keys = flatQuery(req.params.key || req.query.key);
          const resetedStore = this.resetStore(keys);
          res.send(resetedStore)
        },
        description: "This route helps to reset the store values to its initial state. Pass key as a query param to reset the specific store key value."
      }
    }

    for (let routePath in defaultRoutes) {
      if (!this._routesList.includes(routePath)) {
        defaultRoutes[routePath]._isDefault = true;
        defaultRoutes[routePath]._id = nanoid(7);
        router.use(routePath, defaultRoutes[routePath].middleware!);
        this.routesList.push(routePath);
        this._defaultRoutes.push(routePath);
      }
    }

    return router;
  };

  startServer = (port: number = this._config.port, host: string = this._config.host): Promise<Server> => {
    console.log("\n" + chalk.gray("Starting Server..."));
    return new Promise((resolve) => {
      this._server = this._app?.listen(port, host, () => {
        console.log(chalk.green.bold("Mock Server Started"));
        console.log(chalk.gray("watching...") + "\n");
        resolve(this._server!);
      })
    })
  };

  stopServer = (): Promise<boolean> => {
    console.log("\n" + chalk.gray("Stopping Server..."));
    return new Promise((resolve) => {
      this._server?.close(() => {
        this.resetServer();
        console.log(chalk.gray("\n Mock Server Stopped"));
        resolve(true);
      });
    })
  };

  resetServer = () => {
    this._app = express().set("json spaces", 2);
    this._server = undefined;
    this._router = undefined;
    this._routesList = [];
    this._defaultRoutes = [];

    this._routes = {} as Routes;
    this._config = { ...Default_Config } as Config;
    this._middlewares = { ...Default_Middlewares } as Middlewares;
    this._injectors = {} as Routes;
    this._store = {} as { [key: string]: any };
    this._rewriter = {} as { [key: string]: string };

    this._initialRoutes = {} as Routes;
    this._initialStore = {} as Object;
  };

  resetStore = (keys?: string[]) => {
    if (keys?.length) {
      const resetedStore = keys.reduce((result, key) => {
        this._store[key] = _.cloneDeep(this._initialStore[key]);
        return { ...result, [key]: this._store[key] };
      }, {});
      return resetedStore;
    } else {
      this._store = _.cloneDeep(this._initialStore) as Object;
      return this._store;
    }
  }

  resetRoutes = (_ids?: string[]) => {
    if (_ids?.length) {
      const routePathToReset = _ids.map(_id => _.findKey(this._initialRoutes, { "_id": _id })).filter(Boolean) as string[];
      const resetedRoutes = routePathToReset.reduce((result, routePath) => {
        this._routes[routePath] = _.cloneDeep(this._initialRoutes[routePath]);
        return { ...result, [routePath]: this._routes[routePath] }
      }, {});
      return resetedRoutes
    } else {
      this._routes = _.cloneDeep(this._initialRoutes);
      return this._routes;
    }
  }

  #getRoutes = (req: express.Request, res: express.Response) => {
    const routeConfigList = Object.entries(this._routes)
      .map(([routePath, routeConfig]) => ({ ...routeConfig, routePath }));

    req.params.id = req.params._id ?? req.params.id;
    req.query.id = req.query._id ?? req.query.id;

    try {
      const result = CRUD.search(req, res, routeConfigList, "_id");
      const routes = [].concat(result).filter(Boolean).reduce((res, routeConfig: any) => {
        const routePath = routeConfig.routePath;
        delete routeConfig.routePath;
        return { ...res, [routePath]: routeConfig }
      }, {})
      res.send(routes);
    } catch (err) {
      res.send(this._routes);
    }
  }

  #updateRoute = (req: express.Request, res: express.Response) => {
    const routeConfig = [].concat(req.body)[0] as RouteConfig;
    delete routeConfig.middlewares;
    delete routeConfig._id;
    const _ids = flatQuery(req.params._id || req.query._id);
    const routePaths = _ids.map(_id => _.findKey(this._routes, { "_id": _id }));
    if (routePaths.length) {
      routePaths.forEach(routePath => this._routes[routePath] = { ...this._routes[routePath], ...routeConfig })
    }
    res.send(this._routes);
  }

  #addRoute = (req: express.Request, res: express.Response) => {
    this.addRoutes(req.body);
    res.send(this._routes)
  }
}

let _mockServer: MockServer = new MockServer();
export default {
  Create: (...args) => {
    _mockServer.setData(...args);
    return _mockServer.app;
  },
  ..._mockServer
}