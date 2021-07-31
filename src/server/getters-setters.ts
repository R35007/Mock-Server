import chalk from "chalk";
import * as _ from 'lodash';
import {
  GetData, UserConfig, UserMiddlewares, UserRewriter, UserRoutes, UserStore
} from './model';
import { Validators } from './validators';

export class GettersSetters extends Validators {

  constructor(
    config?: UserConfig,
    store?: UserStore,
  ) {
    super();
    console.log("\n" + chalk.blueBright("{^_^}/~ Hi!"));
    this.setConfig(config);
    !_.isEmpty(store) && this.setStore(store);
  }

  setData(
    routes?: UserRoutes,
    config?: UserConfig,
    middlewares?: UserMiddlewares,
    injectors?: UserRoutes,
    store?: UserStore,
    routeRewriters?: UserRewriter
  ) {
    this.setConfig(config);
    !_.isEmpty(middlewares) && this.setMiddlewares(middlewares);
    !_.isEmpty(injectors) && this.setInjectors(injectors);
    !_.isEmpty(store) && this.setStore(store);
    !_.isEmpty(routes) && this.setRoutes(routes);
    !_.isEmpty(routeRewriters) && this.setRewriterRoutes(routeRewriters);
  };

  get data(): GetData {
    return {
      routes: this.routes,
      config: this.config,
      injectors: this.injectors,
      middlewares: this.middlewares,
      store: this.store,
      routeRewriters: this.routeRewriters
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

  setRewriterRoutes(routeRewriters?: UserRewriter) {
    console.log("\nSetting Rewriter Routes...");
    this.routeRewriters = this.getValidRouteRewriters(routeRewriters);
    console.log("Done.");
  }
}