import chalk from "chalk";
import * as _ from 'lodash';
import {
  GetData, UserConfig, UserMiddlewares, UserRewriter, UserRoutes, UserStore
} from './model';
import { Validators } from './validators';

export class GettersSetters extends Validators {

  constructor(
    routes?: UserRoutes,
    config?: UserConfig,
    middlewares?: UserMiddlewares,
    injectors?: UserRoutes,
    store?: UserStore,
    rewriter?: UserRewriter
  ) {
    super();
    console.log("\n" + chalk.blueBright("{^_^}/~ Hi!"));
    console.log("\n" + chalk.gray("Loading Data..."));
    this.setData(routes, config, middlewares, injectors, store, rewriter);
    console.log(chalk.gray("Done."));
  }

  setData(
    routes?: UserRoutes,
    config?: UserConfig,
    middlewares?: UserMiddlewares,
    injectors?: UserRoutes,
    store?: UserStore,
    rewriter?: UserRewriter
  ) {

    this.setConfig(config);
    this.setMiddlewares(middlewares);
    this.setInjectors(injectors);
    this.setStore(store);
    this.setRoutes(routes);
    this.setRewriter(rewriter);
  };

  get data(): GetData {
    return {
      routes: this._routes,
      config: this._config,
      injectors: this._injectors,
      middlewares: this._middlewares,
      store: this._store,

    } as GetData;
  };

  setConfig(config?: UserConfig) {
    this._config = this.getValidConfig(config);
  }
  get config() { return this._config };

  setInjectors(injectors?: UserRoutes) {
    this._injectors = this.getValidInjectors(injectors);
  }
  get injectors() { return this._injectors };

  setMiddlewares(middlewares?: UserMiddlewares) {
    this._middlewares = this.getValidMiddlewares(middlewares)
  }
  get middlewares() { return this._middlewares };

  setRoutes(routes?: UserRoutes) {
    this._routes = this.getValidRoutes(routes);
    this._initialRoutes = _.cloneDeep(this._routes);
  }
  get routes() { return this._routes };

  setStore(store?: UserStore) {
    this._store = this.getValidStore(store);
    this._initialStore = _.cloneDeep(this._store);
  }
  get store() { return this._store };

  setRewriter(rewriter?: UserRewriter) {
    this._rewriter = this.getValidRewriter(rewriter);
  }
  get rewriter(){ return this._rewriter };

  get app() { return this._app }
  get routesList() { return this._routesList }
  get defaultRoutes() { return this._defaultRoutes }
}