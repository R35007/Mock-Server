import { AxiosRequestConfig } from 'axios';
import { toBase64 } from './utils';
import * as UserTypes from "./types/user.types";

interface Done {
  done: () => { [key: string]: UserTypes.RouteConfig }
}

export default class RouteConfigSetters implements Done {
  routePath!: string;

  db = {};

  constructor(
    routePath: string,
    routeMiddlewares: UserTypes.Middleware_Config[],
  ) {
    this.routePath = routePath;
    this.db[routePath] = { _config: true, id: toBase64(routePath), middlewares: routeMiddlewares };
  }

  id(value: string) {
    this.db[this.routePath].id = value;
    return this;
  }
  description(value: string) {
    this.db[this.routePath].description = value;
    return this;
  }
  mock(value: any) {
    this.db[this.routePath].mock = value;
    return this;
  }
  fetch(value: string | AxiosRequestConfig) {
    this.db[this.routePath].fetch = value;
    return this;
  }
  statusCode(value: number) {
    this.db[this.routePath].statusCode = value;
    return this;
  }
  delay(value: number) {
    this.db[this.routePath].delay = value;
    return this;
  }
  fetchCount(value: number) {
    this.db[this.routePath].fetchCount = value;
    return this;
  }
  skipFetchError(value: boolean) {
    this.db[this.routePath].skipFetchError = value;
    return this;
  }
  mockFirst(value: boolean) {
    this.db[this.routePath].mockFirst = value;
    return this;
  }
  directUse(value: boolean) {
    this.db[this.routePath].directUse = value;
    return this;
  }

  done() { return this.db };
}