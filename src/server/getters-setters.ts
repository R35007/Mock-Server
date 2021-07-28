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
    rewriterRoutes?: UserRewriter
  ) {
    super();
    console.log("\n" + chalk.blueBright("{^_^}/~ Hi!"));
    this.setData(routes, config, middlewares, injectors, store, rewriterRoutes);
  }

  setData(
    routes?: UserRoutes,
    config?: UserConfig,
    middlewares?: UserMiddlewares,
    injectors?: UserRoutes,
    store?: UserStore,
    rewriterRoutes?: UserRewriter
  ) {
    this.setConfig(config);
    !_.isEmpty(middlewares) && this.setMiddlewares(middlewares);
    !_.isEmpty(injectors) && this.setInjectors(injectors);
    !_.isEmpty(store) && this.setStore(store);
    !_.isEmpty(routes) && this.setRoutes(routes);
    !_.isEmpty(rewriterRoutes) && this.setRewriterRoutes(rewriterRoutes);
  };

  get data(): GetData {
    return {
      routes: this.routes,
      config: this.config,
      injectors: this.injectors,
      middlewares: this.middlewares,
      store: this.store,
      rewriterRoutes: this.rewriterRoutes
    } as GetData;
  };

  setConfig(config?: UserConfig) {
    console.log("\nSetting Config...");
    this.config = this.getValidConfig(config);
    console.log("Done.");
  }

  setMiddlewares(middlewares?: UserMiddlewares) {
    console.log("\nSetting Middlewares...");
    this.middlewares = this.getValidMiddlewares(middlewares);
    console.log("Done.");
  }

  setInjectors(injectors?: UserRoutes) {
    console.log("\nSetting Injectors...");
    this.injectors = this.getValidInjectors(injectors);
    console.log("Done.");
  }

  setRoutes(routes?: UserRoutes) {
    console.log("\nSetting Routes...");
    this.routes = this.getValidRoutes(routes);
    this.initialRoutes = _.cloneDeep(this.routes);
    console.log("Done.");
  }

  setStore(store?: UserStore) {
    console.log("\nSetting Store...");
    this.store = this.getValidStore(store);
    this.initialStore = _.cloneDeep(this.store);
    console.log("Done.");
  }

  setRewriterRoutes(rewriterRoutes?: UserRewriter) {
    console.log("\nSetting Rewriter Routes...");
    this.rewriterRoutes = this.getValidRewriterRoutes(rewriterRoutes);
    console.log("Done.");
  }
}