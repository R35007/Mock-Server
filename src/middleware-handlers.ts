import axios, { AxiosRequestConfig } from "axios";
import chalk from "chalk";
import express from "express";
import * as fs from "fs";
import * as _ from "lodash";
import * as path from "path";
import { Locals, RouteConfig } from "./model";
import { Validators } from "./validators";

const AxiosRequestConfig: string[] = [
  "headers",
  "method",
  "baseURL",
  "params",
  "data",
  "timeout",
  "timeoutErrorMessage",
  "withCredentials",
  "adapter",
  "auth",
  "responseType",
  "maxContentLength",
  "validateStatus",
  "maxBodyLength",
  "maxRedirects",
  "socketPath",
  "httpAgent",
  "httpsAgent",
  "proxy",
  "cancelToken",
  "decompress"
]

const AxiosHeadersConfig: string[] = [
  "Content-Type",
  "Content-Disposition",
  "X-REQUEST-TYPE",
  "Content-Length",
  "Accept-Language",
  "Accept",
  "Authorization"
]

export class MiddlewareHandlers extends Validators {

  _store = {};

  constructor() {
    super();
  }

  protected _initialMiddlewareWrapper = (routePath: string, routeConfig: RouteConfig) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        res.locals = { routePath, ...routeConfig };
        res.locals.store = {
          get: this.getStore,
          set: this.setStore,
          clear: this.clearStore,
          remove: this.removeStore,
        }
        const canProceed = this.#redirectIfMissingParams(req, res);
        if (canProceed) {
          if (!(routeConfig?.fetch !== undefined || routeConfig?.mock !== undefined)) {
            res.locals.data = routeConfig;
          } else {
            res.locals.data = routeConfig.mockFirst
              ? routeConfig.mock ?? await this.#getDataFromUrl(res, req, routeConfig)
              : await this.#getDataFromUrl(res, req, routeConfig) ?? routeConfig.mock
          }
          setTimeout(() => {
            next();
          }, routeConfig.delay || 0);
        }
      } catch (err) {
        console.error("\n initialMiddlewareWrapper : " + chalk.red(err.message));
        res.send(err);
      }
    };
  };

  protected _finalMiddleware = async (_req: express.Request, res: express.Response) => {
    try {
      const { data, statusCode, fetch, fetchData, fetchError } = <Locals>res.locals;
      if (!res.headersSent) {
        if (statusCode && statusCode >= 100 && statusCode < 600) res.statusCode = statusCode;

        if (this.#isValidFileMockUrl(fetch, fetchData)) {
          res.sendFile(this.parseUrl(fetch.url!));
        } else {
          if (data !== undefined) {
            typeof data === "object"
              ? res.jsonp(data)
              : res.send(data)
          } else {
            res.send(fetchError || '')
          }
        }
      }
    } catch (err) {
      console.error("\n finalMiddleware : " + chalk.red(err.message));
      res.send(err);
    }
  };

  getStore = (key?: string) => {
    return key ? this._store[key] : this._store;
  }

  setStore = (key: string, value: any) => {
    return this._store[key] = value;
  }

  removeStore = (key?: string) => {
    key && this._store[key] && delete this._store[key];
  }

  clearStore = () => {
    this._store = {};
  }

  #isValidFileMockUrl = (fetch: any, fetchData: any): boolean => {
    return fetchData===undefined
      && !_.isEmpty(fetch)
      && _.isString(fetch?.url)
      && this.isFileExist(fetch?.url);
  }

  #getDataFromUrl = async (res: express.Response, req: express.Request, routeConfig: RouteConfig): Promise<any> => {
    const dataFromUrl = await this.#fetchData(res, req, routeConfig);
    res.locals.fetchData = dataFromUrl;
    return dataFromUrl
  }

  #fetchData = async (res: express.Response, req: express.Request, routeConfig: RouteConfig): Promise<any> => {

    const fetch = _.isString(routeConfig.fetch)
      ? { url: routeConfig.fetch, headers: { proxy: true } }
      : _.isPlainObject(routeConfig.fetch)
        ? routeConfig.fetch
        : undefined;

    res.locals.fetch = fetch;

    if (!fetch) return undefined;


    try {
      const parsedUrl = this.parseUrl(fetch.url || '');
      if (this.isFileExist(parsedUrl)) {
        const fileExtension = path.extname(parsedUrl);

        if (fileExtension === ".json") {
          return JSON.parse(fs.readFileSync(parsedUrl, "utf8"));
        } else if (fileExtension === ".txt") {
          return fs.readFileSync(parsedUrl, "utf8");
        }
        return undefined;
      } else if (fetch.url?.includes("http")) {
        const request = this.#getValidReq(req, fetch);
        console.log("Making url request : ", request);

        return (await axios(request)).data;
      }

      return undefined;
    } catch (err) {
      res.locals.fetchError = err;
      console.error('getMockFromUrl : ' + chalk.red(err.message));
      return undefined;
    }
  }

  #getValidReq = (req: express.Request, fetch: AxiosRequestConfig): AxiosRequestConfig => {
    const replacedPath = fetch.url?.replace(':routePath', req.path);
    const axiosReq = _.fromPairs(Object.entries(req).filter(([key]) => AxiosRequestConfig.includes(key)));

    // removes unwanted headers
    Object.keys(axiosReq.headers).forEach(h => {
      if (!AxiosHeadersConfig.includes(h)) {
        delete axiosReq.headers[h];
      }
    })

    if (fetch.headers?.proxy) {
      return {
        ...axiosReq,
        data: req.body,
        url: replacedPath
      } as AxiosRequestConfig
    }

    const fetchEntries = Object.entries(fetch).map(([key, val]) => {
      if (val === '$' + key) {
        const reqVal = key === 'data' ? axiosReq["body"] : axiosReq[key]
        return [key, reqVal]
      };
      return [key, val]
    })

    return { ..._.fromPairs(fetchEntries), url: replacedPath }
  }

  #redirectIfMissingParams = (req: express.Request, res: express.Response): boolean => {
    const params: object = req.params;
    const windowUrl = this._config.baseUrl === '/' ? req.path : this._config.baseUrl + req.path;
    const hasParams = Object.keys(params).filter((k) => params[k] !== `:${k}`);
    if (Object.keys(params).length > 0 && hasParams.length === 0) {
      const dummyUrl = Object.keys(params).reduce((res, key) => {
        return res.replace(`/:${key}`, "/1");
      }, windowUrl);
      console.log(`Redirecting from ${req.path} to ${dummyUrl}`);
      res.redirect(307, dummyUrl);
      return false;
    }
    return true;
  };
}
