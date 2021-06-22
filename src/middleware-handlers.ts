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


  constructor() {
    super();
  }

  protected _initialMiddlewareWrapper = (routePath: string) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const routeConfig = _.isPlainObject(this._routes[routePath]) ? this._routes[routePath] : { mock: "" };
        const locals = res.locals as Locals

        locals.routePath = routePath;
        locals.routeConfig = routeConfig;
        locals.store = _.isPlainObject(this._store) ? this._store : {}

        const canProceed = this.#redirectIfMissingParams(req, res);
        if (canProceed) {
          if (!(routeConfig?.fetch !== undefined || routeConfig?.mock !== undefined)) {
            res.locals.data = JSON.parse(JSON.stringify(routeConfig));
          } else {
            if (routeConfig.mockFirst) {
              if (routeConfig.mock !== undefined) {
                locals.data = JSON.parse(JSON.stringify(routeConfig.mock));
              } else {
                locals.data = await this.#getDataFromUrl(res, req, routeConfig);
              }
            } else {
              const fetchData = await this.#getDataFromUrl(res, req, routeConfig);
              if (fetchData !== undefined) {
                res.locals.data = fetchData;
              } else {
                res.locals.data = routeConfig.mock !== undefined
                  ? JSON.parse(JSON.stringify(routeConfig.mock)) : undefined;
              }
            }
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
      const { data, routeConfig: { statusCode }, fetch, fetchError } = <Locals>res.locals;
      if (!res.headersSent) {
        if (statusCode && statusCode >= 100 && statusCode < 600) res.status(statusCode);

        if (this.#isValidFileMockUrl(res.locals as Locals)) {
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

  #isValidFileMockUrl = ({ routeConfig: { mockFirst }, data, fetchData, fetch }: Locals): boolean => {
    return (!mockFirst || (mockFirst && data === undefined))
      && fetchData === undefined
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
