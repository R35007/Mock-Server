import axios from "axios";
import chalk from "chalk";
import express from "express";
import * as fs from "fs";
import * as _ from "lodash";
import * as path from "path";
import { Locals, MiddlewareParams, RouteConfig, UrlRequestConfig } from "./model";
import { Validators } from "./validators";

const AxiosRequestConfig: string[] = [
  "url",
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

export class MiddlewareHandlers extends Validators {
  constructor() {
    super();
  }

  protected _initialMiddlewareWrapper = (routePath: string, routeConfig: RouteConfig) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        res.locals = { routePath, ...routeConfig };
        const canProceed = this.#redirectIfMissingParams(req, res);
        if (canProceed) {
          if (!(routeConfig?.initialMock || routeConfig?.mock || routeConfig?.alternateMock)) {
            res.locals.data = routeConfig;
          } else {
            const { initialMockData, alternateMockData } = await this.#getInitialAndAlternateMockData(req, routePath, routeConfig);
            res.locals.initialMockData = initialMockData;
            res.locals.alternateMockData = alternateMockData;
            res.locals.data = initialMockData || routeConfig.mock || alternateMockData;
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

  protected _userMiddlewareWrapper = () => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const params: MiddlewareParams = { req, res, next, data: res.locals.data, globals: this._globals, locals: <Locals>res.locals };
        const userMiddleware = this._middlewares?.[res.locals.middleware];
        _.isFunction(userMiddleware) ? userMiddleware(params) : next();
      } catch (err) {
        console.error("\n userMiddlewareWrapper : " + chalk.red(err.message));
        res.send(err);
      }
    };
  };

  protected _finalMiddleware = (_req: express.Request, res: express.Response) => {
    try {
      const { data, statusCode, initialMock, initialMockData, alternateMock, alternateMockData } = <Locals>res.locals;
      if (!res.headersSent) {
        if (statusCode && statusCode >= 100 && statusCode < 600) res.statusCode = statusCode;

        if (this.#isValidFileMockUrl(initialMockData, initialMock)) {
          res.sendFile(this.parseUrl((initialMock as UrlRequestConfig).url as string));
        } else if (!data && this.#isValidFileMockUrl(alternateMockData, alternateMock)) {
          res.sendFile(this.parseUrl((alternateMock as UrlRequestConfig).url as string));
        } else {
          typeof data === "object" ? res.jsonp(data) : res.send(data);
        }
      }
    } catch (err) {
      console.error("\n finalMiddleware : " + chalk.red(err.message));
      res.send(err);
    }
  };

  #isValidFileMockUrl = (mockData: any, iamock: any): boolean => {
    return !mockData && !_.isString(iamock) && iamock?.isFile && iamock?.url && this.isFileExist(iamock?.url)
  }

  #getInitialAndAlternateMockData = async (req: express.Request, routePath: string, routeConfig: RouteConfig): Promise<{ initialMockData: any; alternateMockData: any }> => {
    const initialMockData = routeConfig.initialMock ? await this.#getMockFromUrl(req, routePath, routeConfig.initialMock) : false;
    const alternateMockData = !(initialMockData || routeConfig.mock) && routeConfig.alternateMock
      ? await this.#getMockFromUrl(req, routePath, routeConfig.alternateMock)
      : false;
    return { initialMockData, alternateMockData }
  }

  #getMockFromUrl = async (req: express.Request, routePath: string, mockUrl: string | UrlRequestConfig): Promise<any> => {

    if (!mockUrl) return false;

    try {
      if (!_.isString(mockUrl)) {
        if (mockUrl.isFile && mockUrl.url) {
          const parsedUrl = this.parseUrl(mockUrl.url);
          if (!this.isFileExist(parsedUrl)) return false;
          const fileExtension = path.extname(parsedUrl);

          if (fileExtension === ".json") {
            return JSON.parse(fs.readFileSync(parsedUrl, "utf8"));
          } else if (fileExtension === ".txt") {
            return fs.readFileSync(parsedUrl, "utf8");
          }
          return false;
        }
      }
      const request = this.#getValidReq(req, routePath, mockUrl)
      return (await axios(request)).data;
    } catch (err) {
      console.error('getMockFromUrl : ' + chalk.red(err.message));
      return false;
    }
  }

  #getValidReq = (req: express.Request, routePath, mockUrl: string | UrlRequestConfig): UrlRequestConfig => {
    const replacedPath = _.isString(mockUrl)
      ? mockUrl.replace(':routePath', routePath.substring(1))
      : mockUrl.url?.replace(':routePath', routePath.substring(1));
    const mockUrlReqConfig = _.isString(mockUrl) ? {} : mockUrl;
    const axiosReq = _.fromPairs(Object.entries(req).filter(([key]) => AxiosRequestConfig.includes(key)));
    return {
      ...axiosReq,
      ...mockUrlReqConfig,
      url: replacedPath
    } as UrlRequestConfig
  }

  #redirectIfMissingParams = (req: express.Request, res: express.Response): boolean => {
    const params: object = req.params;
    const windowUrl = req.path;
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
