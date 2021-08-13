import { AxiosRequestConfig } from 'axios';
import chalk from 'chalk';
import express from "express";
import * as _ from "lodash";
import { Config, Locals, PathDetails, Db } from '../model';
import { clean } from '../utils';
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

    if (!_.isEmpty(routeConfig.fetch)) {
      const fetchCount = parseInt(routeConfig.fetchCount+"");
      routeConfig.fetchCount = isNaN(fetchCount) ? 1 : fetchCount;
      const fetch = getUrlDetail(req, res);
      if (fetch) {
        locals.routeConfig._request = fetch.request;
        locals.routeConfig._isFile = fetch.isFile;
        locals.routeConfig._extension = fetch.extension;
      }
      next();
    }else{
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
    const parsedUrl = parseUrl(request.url, locals.config.root);
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

  const replacedPath = fetch.url?.
    replace(/{{port}}/gi, config.port + '')
    .replace(/{{host}}/gi, config.host)
    .replace(/{{base}}/gi, config.base)
    .replace(/\/{{routePath}}|{{routePath}}/gi, req.path)
    .replace(/\?{{params}}|{{params}}/gi, req.url.replace(req.path, ""))
    .replace(/\?{{query}}|{{query}}/gi, req.url.replace(req.path, ""));

  const expReq = _.fromPairs(Object.entries(req).filter(([key]) => AxiosRequestConfig.includes(key)));

  // removes unwanted headers
  Object.keys(expReq.headers).forEach(h => {
    !AxiosHeadersConfig.includes(h) && delete expReq.headers[h];
  })

  if (fetch.headers?.proxy) {
    const request = {
      ...expReq,
      data: req.body,
      params: req.query,
      url: replacedPath
    };
    delete request.query;
    delete request.body;

    return clean(request) as AxiosRequestConfig
  }

  const fetchEntries = Object.entries(fetch).map(([key, val]) => {
    if (val === '{{' + key + '}}') {
      if(key === 'data') return [key, expReq.body]
      if(key === 'body') return ['data', expReq.body]
      if(key === 'params') return [key, expReq.query]
      if(key === 'query') return ['params', expReq.query]
      return [key, expReq[key]]
    };
    return [key, val]
  })

  const request = { ..._.fromPairs(fetchEntries), url: replacedPath };
  delete request.query;
  delete request.body;

  return clean(request)
}

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