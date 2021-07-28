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
import { cleanRoutes, flatQuery, snapShotRoutes } from './utils';
import CRUD from './utils/crud';

export class MockServer extends GettersSetters {

  constructor(
    routes?: UserRoutes,
    config?: UserConfig,
    middlewares?: UserMiddlewares,
    injectors?: UserRoutes,
    store?: UserStore,
    rewriterRoutes?: UserRewriter
  ) {
    super(routes, config, middlewares, injectors, store, rewriterRoutes);
  }

  launchServer = async () => {
    const app = this.app;

    const defaults = this.defaults();
    app.use(defaults);

    const rewriter = this.rewriter();
    app.use(rewriter);

    this.router = this.resource();
    app.use(this.config.base, this.router);

    const defaultRoutes = this.defaultRoutes();
    app.use(this.config.base, defaultRoutes);

    app.use(PageNotFound);
    app.use(ErrorHandler);

    await this.startServer();
  };

  defaults = (options?: Default_Options) => {
    options && this.setConfig({ ...this.config, ...options });
    return Defaults(this.config);
  }

  rewriter = (rewriterRoutes?: KeyValString) => {
    rewriterRoutes && this.setRewriterRoutes(rewriterRoutes);
    return Rewriter(this.rewriterRoutes);
  }

  resource = (
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

    const router = express.Router();
    Object.entries(this.routes).forEach(routes => this.#createRoute(...routes, router));

    console.log(chalk.gray("Done."));
    return router;
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
    this.rewriterRoutes = {} as KeyValString;

    this.initialRoutes = {} as Routes;
    this.initialStore = {} as Object;
  };

  resetStore = (keys?: string[]) => {
    if (keys?.length) {
      const resetedStore = keys.reduce((result, key) => {
        this.store[key] = _.cloneDeep(this.initialStore[key]);
        return { ...result, [key]: this.store[key] };
      }, {});
      return resetedStore;
    } else {
      this.store = _.cloneDeep(this.initialStore) as Object;
      return this.store;
    }
  }

  resetRoutes = (_ids?: string[]) => {
    if (_ids?.length) {
      const routePathToReset = _ids.map(_id => _.findKey(this.initialRoutes, { "_id": _id })).filter(Boolean) as string[];
      const resetedRoutes = routePathToReset.reduce((result, routePath) => {
        this.routes[routePath] = _.cloneDeep(this.initialRoutes[routePath]);
        return { ...result, [routePath]: this.routes[routePath] }
      }, {});
      return resetedRoutes
    } else {
      this.routes = _.cloneDeep(this.initialRoutes);
      return this.routes;
    }
  }

  defaultRoutes = () => {

    const router = express.Router();

    const defaultRoutes: Array<[string, express.RequestHandler]> = [
      ["/routes/:_id?", (req: express.Request, res: express.Response) => {
        if (req.method.toLowerCase() === 'post') {
          if (req.body._id || req.query._id) {
            this.#updateRoute(req, res)
          } else {
            this.addRoutes(req.body);
            res.send(this.routes);
          }
        } else {
          this.#getRoutes(req, res);
        }
      }
      ],
      ["/rewriter", (_req, res) => res.send(this.rewriterRoutes)],
      ["/store/:key?", (req, res) => {
        const keys = flatQuery(req.params.key || req.query.key) as string[];
        if (keys.length) {
          const store = keys.reduce((res, key) => ({ ...res, [key]: this.store[key] }), {})
          res.send(store);
        } else {
          res.send(this.store)
        }
      }],
      ["/reset/route/:_id?", (req, res) => {
        const _ids = flatQuery(req.params._id || req.query._id);
        const resetedRoutes = this.resetRoutes(_ids);
        res.send(resetedRoutes);
      }],
      ["/reset/store/:key?", (req, res) => {
        const keys = flatQuery(req.params.key || req.query.key);
        const resetedStore = this.resetStore(keys);
        res.send(resetedStore)
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
    const routeConfigList = Object.entries(this.routes)
      .map(([routePath, routeConfig]) => ({ ...routeConfig, routePath }));

    req.params.id = req.params._id;
    req.query.id = req.query._id ?? req.query.id;

    const isClean = req.query.clean;
    const isSnapShot = req.query.snapshot;
    delete req.query.clean;
    delete req.query.isSnapShot;

    try {
      const result = CRUD.search(req, res, routeConfigList, "_id");
      const routes = [].concat(result).filter(Boolean).reduce((res, routeConfig: any) => {
        const routePath = routeConfig.routePath;
        delete routeConfig.routePath;
        return { ...res, [routePath]: routeConfig }
      }, {})

      if(isSnapShot){
        snapShotRoutes(routes);
      }else{
        isClean && cleanRoutes(routes);
      }

      res.send(routes);
    } catch (err) {
      res.send(this.routes);
    }
  }

  getRoutes = (_ids: string[] = [], routePaths: string[] = []): Routes => {
    if (!_ids.length && !routePaths.length) return _.cloneDeep(this.routes) as Routes;
    const _routePaths = _ids.map(_id => _.findKey(this.routes, { "_id": _id })).filter(Boolean) as string[];
    const routePathsList = [..._routePaths, ...routePaths];
    return _.cloneDeep(routePathsList.reduce((res, rp) => ({ ...res, [rp]: this.routes[rp] }), {})) as Routes;
  }

  #updateRoute = (req: express.Request, res: express.Response) => {
    const routeConfig = [].concat(req.body)[0] as RouteConfig;
    delete routeConfig.middlewares;
    delete routeConfig._id;
    const _ids = flatQuery(req.params._id || req.query._id);
    const routePaths = _ids.map(_id => _.findKey(this.routes, { "_id": _id }));
    if (routePaths.length) {
      routePaths.forEach(routePath => {
        this.routes[routePath] = { ...this.routes[routePath], ...routeConfig }
      })
    }
    res.send(this.routes);
  }
}

let mockServer: MockServer;
export default {
  create: (config?: UserConfig, store?: UserStore) => {
    mockServer = new MockServer(undefined, config, undefined, undefined, store);
    return mockServer.app;
  },
  defaults: (options?: Default_Options) => {
    return mockServer.defaults(options);
  },
  rewriter: (rewriterRoutes: KeyValString) => {
    return mockServer.rewriter(rewriterRoutes);
  },
  resource: (
    routes?: UserRoutes,
    middlewares?: UserMiddlewares,
    injectors?: UserRoutes
  ) => {
    return mockServer?.resource(routes, middlewares, injectors);
  },
  defaultRoutes: () => mockServer?.defaultRoutes(),
  addRoutes: (routes: Routes, router?: Router) => mockServer?.addRoutes(routes, router),
  startServer: (port?: number, host?: string) => {
    return mockServer?.startServer(port, host)
  },
  stopServer: () => mockServer?.stopServer(),
  resetRoutes: (_ids: string[]) => mockServer?.resetRoutes(_ids),
  resetStore: (keys: string[]) => mockServer?.resetStore(keys),
  pageNotFound: PageNotFound,
  errorHandler: ErrorHandler,
  data: () => mockServer?.data
}