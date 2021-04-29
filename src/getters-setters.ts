import chalk from 'chalk';
import express from "express";
import { Server } from "http";
import { MiddlewareHandlers } from './middleware-handlers';
import {
  GetData, UserConfig, UserGlobals,
  UserInjectors, UserMiddlewares, UserRoutes
} from './model';

export class GettersSetters extends MiddlewareHandlers {

  protected _app: express.Application | undefined;
  protected _server: Server | undefined;

  protected _isServerLaunched = false;
  protected _isExpressAppCreated = false;
  protected _isServerStarted = false;
  protected _isResourcesLoaded = false;
  protected _isDefaultsCreated = false;

  constructor(routes?: UserRoutes,
    config?: UserConfig,
    injectors?: UserInjectors,
    globals?: UserGlobals,
    middlewares?: UserMiddlewares) {
    super();

    if (routes || config || injectors || globals || middlewares) {
      this.setData(routes, config, injectors, globals, middlewares);
    }
  }

  setData(
    routes: UserRoutes = this._routes,
    config: UserConfig = this._config,
    injectors: UserInjectors = this._injectors,
    globals: UserGlobals = this._globals,
    middlewares: UserMiddlewares = this._middlewares,
  ) {
    console.log("\n" + chalk.gray("Loading Data..."));

    this._isValidated = true;

    this.setConfig(config);
    this.setGlobals(globals);
    this.setInjectors(injectors);
    this.setMiddlewares(middlewares);
    this.setRoutes(routes);

    console.log(chalk.gray("Done."));
  };

  get data(): GetData {
    return {
      routes: this._routes,
      config: this._config,
      injectors: this._injectors,
      globals: this._globals,
      middlewares: this._middlewares
    } as GetData;
  };

  setConfig(config: UserConfig) {
    this._config = this.getValidConfig(config);
  }
  get config() { return this._config };

  setGlobals(globals: UserGlobals) {
    this._globals = this.getValidGlobals(globals);
  }
  get globals() { return this._globals };

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


  get app() { return this._app };
  get server() { return this._server }

  get isServerLaunched() { return this._isServerLaunched }
  get isExpressAppCreated() { return this._isExpressAppCreated }
  get isServerStarted() { return this._isServerStarted }
  get isResourcesLoaded() { return this._isResourcesLoaded }
  get isDefaultsCreated() { return this._isDefaultsCreated }

  get isValidated() { return this._isValidated };
}