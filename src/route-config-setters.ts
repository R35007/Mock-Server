import { AxiosRequestConfig } from 'axios';
import { toBase64 } from './utils';
import * as UserTypes from "./types/user.types";
import { DbMode } from './types/common.types';
import * as _ from 'lodash';

interface Done {
  done: (param?: { log?: string | boolean }) => { [key: string]: UserTypes.RouteConfig }
}

export default class RouteConfigSetters implements Done {
  #dbMode: DbMode;
  routePath: string;
  db = {};

  constructor(
    routePath: string,
    routeMiddlewares: UserTypes.Middleware_Config[],
    dbMode: DbMode
  ) {
    this.routePath = routePath;
    this.#dbMode = dbMode;
    this.db[routePath] = { _config: true, id: toBase64(routePath) };
    if (routeMiddlewares.length) { this.db[routePath].middlewares = routeMiddlewares };
  }

  id(value: string) {
    this.db[this.routePath].id = value;
    return this;
  }
  description(value: string) {
    this.db[this.routePath].description = value;
    return this;
  }
  send(value: any, dbMode: DbMode = this.#dbMode) {
    let attribute = dbMode === 'fetch' ? 'fetch' : 'mock';
    if (dbMode === 'multi') {
      attribute = typeof value === 'string' ? 'fetch' : 'mock';
    }
    this.db[this.routePath][attribute] = value;
    return this;
  }
  reply = this.send;

  headers(key: string | object, value?: any) {
    if (_.isPlainObject(key)) {
      if (_.isPlainObject(this.db[this.routePath].headers)) {
        Object.entries(key).forEach(([headerName, value]) => {
          this.db[this.routePath].headers[headerName] = value;
        })
      } else {
        this.db[this.routePath].headers = value;
      }
    }

    if (_.isString(key)) {
      if (_.isPlainObject(this.db[this.routePath].headers)) {
        this.db[this.routePath].headers[key] = value;
      } else {
        this.db[this.routePath].headers = { [key]: value };
      }
    }
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
  status = this.statusCode;

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