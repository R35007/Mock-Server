import type { AxiosRequestConfig } from 'axios';
import * as _ from 'lodash';
import type { DbMode } from './types/common.types';
import type * as UserTypes from './types/user.types';
import { toBase64 } from './utils';

interface Done {
  done: (param?: { log?: string | boolean }) => { [key: string]: UserTypes.RouteConfig };
}

export default class RouteConfigSetters implements Done {
  #dbMode: DbMode;
  routePath: string;
  db = {};

  /**
   * Constructs a new route configuration with the given path, middlewares, and database mode.
   * @param {string} routePath - The path for the route.
   * @param {UserTypes.MiddlewareConfig[]} routeMiddlewares - An array of middleware configurations for the route.
   * @param {DbMode} dbMode - The database mode to use for the route.
   */
  constructor(routePath: string, routeMiddlewares: UserTypes.MiddlewareConfig[], dbMode: DbMode) {
    this.routePath = routePath;
    this.#dbMode = dbMode;
    this.db[routePath] = { _config: true, id: toBase64(routePath) };
    if (routeMiddlewares.length) {
      this.db[routePath].middlewares = routeMiddlewares;
    }
  }

  /**
   * Sets the ID for the route in the database.
   * @param {string} value - The ID value to set.
   * @returns {this} The current instance for chaining.
   */
  id(value: string) {
    this.db[this.routePath].id = value;
    return this;
  }

  /**
   * Sets a description for the route in the database.
   * @param {string} value - The description to set.
   * @returns {this} The current instance for chaining.
   */
  description(value: string) {
    this.db[this.routePath].description = value;
    return this;
  }

  /**
   * Sends a response for the route in the database, with an optional database mode.
   * @param {any} value - The value to send as a response.
   * @param {DbMode} [dbMode=this.#dbMode] - The database mode to use for the response.
   * @returns {this} The current instance for chaining.
   */
  send(value: any, dbMode: DbMode = this.#dbMode) {
    let attribute = dbMode === 'fetch' ? 'fetch' : 'mock';
    if (dbMode === 'multi') {
      attribute = typeof value === 'string' ? 'fetch' : 'mock';
    }
    this.db[this.routePath][attribute] = value;
    return this;
  }

  /**
   * @alias send method.
   */
  reply = this.send;

  /**
   * Sets headers for the route in the database.
   * @param {string | object} key - The header key or an object containing header key-value pairs.
   * @param {any} [value] - The value for the header if a key is provided.
   */
  headers(key: string | object, value?: any) {
    if (_.isPlainObject(key)) {
      if (_.isPlainObject(this.db[this.routePath].headers)) {
        Object.entries(key).forEach(([headerName, value]) => {
          this.db[this.routePath].headers[headerName] = value;
        });
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

  /**
   * Sets a mock response for the route in the database.
   * @param {any} value - The mock value to set.
   * @returns {this} The current instance for chaining.
   */
  mock(value: any) {
    this.db[this.routePath].mock = value;
    return this;
  }

  /**
   * Sets the fetch configuration for the route in the database.
   * @param {string | AxiosRequestConfig} value - The URL or Axios request configuration to fetch.
   * @returns {this} The current instance for chaining.
   */
  fetch(value: string | AxiosRequestConfig) {
    this.db[this.routePath].fetch = value;
    return this;
  }

  /**
   * Sets the status code for the route response in the database.
   * @param {number} value - The HTTP status code to set.
   * @returns {this} The current instance for chaining.
   */
  statusCode(value: number) {
    this.db[this.routePath].statusCode = value;
    return this;
  }

  /**
   * @alias statusCode  method.
   */
  status = this.statusCode;

  /**
   * Sets the delay before the route response in the database.
   * @param {number} value - The delay in milliseconds.
   * @returns {this} The current instance for chaining.
   */
  delay(value: number) {
    this.db[this.routePath].delay = value;
    return this;
  }

  /**
   * Sets the number of times to attempt fetching data for the route.
   * @param {number} value - The number of fetch attempts.
   * @returns {this} The current instance for chaining.
   */
  fetchCount(value: number) {
    this.db[this.routePath].fetchCount = value;
    return this;
  }

  /**
   * Determines whether to skip errors during fetch operations for the route.
   * @param {boolean} value - Whether to skip fetch errors.
   * @returns {this} The current instance for chaining.
   */
  skipFetchError(value: boolean) {
    this.db[this.routePath].skipFetchError = value;
    return this;
  }

  /**
   * Determines whether to use mock data before attempting to fetch for the route.
   * @param {boolean} value - Whether to use mock data first.
   * @returns {this} The current instance for chaining.
   */
  mockFirst(value: boolean) {
    this.db[this.routePath].mockFirst = value;
    return this;
  }

  /**
   * Determines whether to use the route configuration directly without any additional processing.
   * @param {boolean} value - Whether to use the route configuration directly.
   * @returns {this} The current instance for chaining.
   */
  directUse(value: boolean) {
    this.db[this.routePath].directUse = value;
    return this;
  }

  /**
   * Finalizes the route configuration and returns the database object.
   * @returns {Object} The database object with the configured route.
   */
  done() {
    return this.db;
  }
}
