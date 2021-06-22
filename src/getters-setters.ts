import chalk from "chalk";
import express from "express";
import { Server } from "http";
import { MiddlewareHandlers } from './middleware-handlers';
import {
  GetData, UserConfig, UserStore,
  UserInjectors, UserMiddlewares, UserRoutes
} from './model';

export class GettersSetters extends MiddlewareHandlers {

  protected _app: express.Application | undefined;
  protected _router: express.Router | undefined;
  protected _server: Server | undefined;
  protected _availableRoutes: string[] = [];

  protected _isServerLaunched = false;
  protected _isExpressAppCreated = false;
  protected _isServerStarted = false;
  protected _isResourcesLoaded = false;
  protected _isDefaultsCreated = false;

  constructor(routes?: UserRoutes,
    config?: UserConfig,
    middlewares?: UserMiddlewares,
    injectors?: UserInjectors,
    store?: UserStore) {
    super();

    console.log("\n" + chalk.blueBright("{^_^}/~ Hi!"));

    if (routes || config || middlewares || injectors || store) {
      this.setData(routes, config, middlewares, injectors);
    }
  }

  async setData(
    routes: UserRoutes = this._routes,
    config: UserConfig = this._config,
    middlewares: UserMiddlewares = this._middlewares,
    injectors: UserInjectors = this._injectors,
    store: UserStore = this._store
  ) {
    console.log("\n" + chalk.gray("Loading Data..."));

    this._isValidated = true;

    this.setConfig(config);
    this.setMiddlewares(middlewares);
    this.setInjectors(injectors);
    this.setRoutes(routes);
    this.setStore(store);

    console.log(chalk.gray("Done."));
  };

  get data(): GetData {
    return {
      routes: this._routes,
      config: this._config,
      injectors: this._injectors,
      middlewares: this._middlewares
    } as GetData;
  };

  setConfig(config: UserConfig) {
    this._config = this.getValidConfig(config);
  }
  get config() { return this._config };

  setInjectors(injectors: UserInjectors) {
    this._injectors = this.getValidInjectors(injectors);
  }
  get injectors() { return this._injectors };

  setMiddlewares(middlewares: UserMiddlewares) {
    this._middlewares = this.getValidMiddlewares(middlewares)
  }
  get middlewares() { return this._middlewares };

  setRoutes(routes: UserRoutes) {
    this._routes = this.getValidRoutes(routes);
  }
  get routes() { return this._routes };

  setStore(store: UserStore) {
    this._store = this.getValidStore(store);
  }
  get store() { return this._store };


  get app() { return this._app };
  get server() { return this._server }
  get router() { return this._router }
  get availableRoutes() { return this._availableRoutes }

  get isServerLaunched() { return this._isServerLaunched }
  get isExpressAppCreated() { return this._isExpressAppCreated }
  get isServerStarted() { return this._isServerStarted }
  get isResourcesLoaded() { return this._isResourcesLoaded }
  get isDefaultsCreated() { return this._isDefaultsCreated }

  get isValidated() { return this._isValidated };
}