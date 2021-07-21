import { AxiosRequestConfig } from 'axios';
import chalk from 'chalk';
import express from "express";
import * as _ from "lodash";
import { getStats, parseUrl } from '.';
import { Config, Locals, PathDetails, RouteConfig } from '../model';

export const InitialMiddleware = (routePath: string, routeConfig: RouteConfig, config: Config, store: { [key: string]: any }) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {

    routeConfig._store && !_.isPlainObject(routeConfig._store) && (routeConfig._store = {});

    const locals = res.locals as Locals
    locals.routePath = routePath;
    locals.routeConfig = routeConfig;
    locals.store = store;
    locals.config = _.cloneDeep(config);
    
    if (!_.isEmpty(routeConfig.fetch)) {
      routeConfig.fetchCount = routeConfig.fetchCount ?? 1
      const fetch = getUrlDetail(req, res);
      if (fetch) {
        locals.routeConfig._request = fetch.request;
        locals.routeConfig._isFile = fetch.isFile;
        locals.routeConfig._extension = fetch.extension;
      }
    }
    
    locals.data = routeConfig.mock;
    
    setTimeout(() => {
      next();
    }, routeConfig.delay || 0);
  };
};

const getUrlDetail = (req: express.Request, res: express.Response) => {

  const locals = res.locals as Locals;
  const fetch = locals.routeConfig.fetch;

  let request = {} as AxiosRequestConfig;
  if (typeof fetch === 'string') {
    request = { url: fetch, headers: { proxy: true } }
  } else if (_.isPlainObject(fetch)) {
    request = fetch as AxiosRequestConfig;
  } else {
    return;
  }

  if (request.url?.startsWith("http")) {
    request = getValidReq(req, res, request);
    return { request, isFile: false, extension: "" };
  } else {
    const parsedUrl = parseUrl(request.url, locals.config.root);
    console.log(chalk.gray("parsed Fetch url : "), chalk.green(parsedUrl));
    const stats = getStats(parsedUrl) || {} as PathDetails;
    request.url = parsedUrl
    return { request, ...stats };
  }
}

const getValidReq = (req: express.Request, res: express.Response, fetch: AxiosRequestConfig): AxiosRequestConfig => {
  const locals = res.locals as Locals;
  const config = locals.config;

  const replacedPath = fetch.url?.
    replace(/{{port}}/gi, config.port + '')
    .replace(/{{baseUrl}}/gi, config.base)
    .replace(/\/{{routePath}}/gi, req.path)
    .replace(/\/{{params}}/gi, req.url.replace(req.path, ""));

  const expReq = _.fromPairs(Object.entries(req).filter(([key]) => AxiosRequestConfig.includes(key)));

  // removes unwanted headers
  Object.keys(expReq.headers).forEach(h => {
    !AxiosHeadersConfig.includes(h) && delete expReq.headers[h];
  })

  if (fetch.headers?.proxy) {
    return {
      ...expReq,
      data: req.body,
      params: req.query,
      url: replacedPath
    } as AxiosRequestConfig
  }

  const fetchEntries = Object.entries(fetch).map(([key, val]) => {
    if (val === '{{' + key + '}}') {
      const reqVal = key === 'data' ? expReq.body : key === 'params' ? expReq.query : expReq[key]
      return [key, reqVal]
    };
    return [key, val]
  })

  return { ..._.fromPairs(fetchEntries), url: replacedPath }
}

const AxiosRequestConfig: string[] = [
  "headers",
  "method",
  "baseURL",
  "query",
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