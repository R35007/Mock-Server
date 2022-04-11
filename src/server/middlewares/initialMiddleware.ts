import { AxiosRequestConfig } from 'axios';
import chalk from 'chalk';
import express from "express";
import * as _ from "lodash";
import { Config, Db, Locals, PathDetails } from '../model';
import { cleanObject } from '../utils';
import { getStats, parseUrl } from '../utils/fetch';

export default (routePath: string, db: Db, getDb: (ids?: string[], routePaths?: string[]) => Db, config: Config, store: object) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {

    const routeConfig = db[routePath];
    routeConfig.store && !_.isPlainObject(routeConfig.store) && (routeConfig.store = {});

    const locals = res.locals as Locals
    locals.routePath = routePath;
    locals.routeConfig = routeConfig;
    locals.getDb = getDb;
    locals.store = store;
    locals.config = _.cloneDeep(config);

    locals.data = undefined;

    delete locals.routeConfig._request;
    delete locals.routeConfig._isFile;
    delete locals.routeConfig._extension;

    if (routeConfig.mockFirst && routeConfig.mock !== undefined) {
      locals.data = routeConfig.mock;
      next();
    } else if (!_.isEmpty(routeConfig.fetch)) {
      const fetchCount = parseInt(routeConfig.fetchCount + "");
      routeConfig.fetchCount = isNaN(fetchCount) ? 1 : fetchCount;
      const fetch = getUrlDetail(req, res);
      if (fetch) {
        locals.routeConfig._request = fetch.request;
        locals.routeConfig._isFile = fetch.isFile;
        locals.routeConfig._extension = fetch.extension;
      }
      next();
    } else {
      locals.data = routeConfig.mock;
      next();
    }
  };
};

const getUrlDetail = (req, res) => {

  const locals = res.locals as Locals;
  const fetch = locals.routeConfig.fetch;

  let request = {} as AxiosRequestConfig;
  if (typeof fetch === 'string') {
    request = { url: fetch, headers: { proxy: true } }
  } else if (_.isPlainObject(fetch)) {
    request = _.cloneDeep(fetch) as AxiosRequestConfig;
  } else {
    return;
  }

  if (request.url?.startsWith("http")) {
    request = getValidReq(req, res, request);
    return { request, isFile: false, extension: "" };
  } else {
    const parsedUrl = interpolate({ config: locals.config, req }, parseUrl(request.url, locals.config.root));
    console.log(chalk.gray("parsed Fetch url : "), chalk.green(parsedUrl));
    const stats = getStats(parsedUrl) || {} as PathDetails;
    request.url = parsedUrl;
    delete request.headers;
    return { request, ...stats };
  }
}

const getValidReq = (req, res, fetch: AxiosRequestConfig): AxiosRequestConfig => {
  const locals = res.locals as Locals;
  const config = locals.config;
  const replacedPath = interpolate({ config, req }, fetch.url)

  const expReq = _.fromPairs(Object.entries(req).filter(([key]) => AxiosRequestConfig.includes(key)));

  // removes unwanted headers
  Object.keys(expReq.headers).forEach(h => {
    !AxiosHeadersConfig.includes(h) && delete expReq.headers[h];
  })

  expReq.data = req.body;
  expReq.params = req.query;
  expReq.url = replacedPath;

  if (fetch.headers?.proxy) {
    cleanObject(expReq);
    return expReq as AxiosRequestConfig;
  }

  const fetchEntries = Object.entries(fetch).map(([key, val]) => [key, interpolate({ config, req: expReq }, val)])
  const request = { ..._.fromPairs(fetchEntries), url: replacedPath };
  cleanObject(request);
  return request as AxiosRequestConfig;
}

// Helps to convert template literal strings to applied values.
// Ex : Object = { config: { host: "localhost", port: 3000 } } , format = "${config.host}:${config.port}" -> "localhost:3000"
const interpolate = (object: Object, format: string = "") => {
  const keys = Object.keys(object);
  const values = Object.values(object);
  return new Function(...keys, `return \`${format}\`;`)(...values);
};

const AxiosRequestConfig: string[] = [
  "headers",
  "method",
  "baseURL",
  "params",
  "query",
  "data",
  "body",
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