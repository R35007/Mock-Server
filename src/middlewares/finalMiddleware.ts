import * as express from "express";
import _, { isPlainObject } from 'lodash';
import { Locals } from '../types/common.types';
import { interpolate } from '../utils';

const sendResponse = (req: express.Request, res: express.Response, response) => {
  const locals = <Locals>res.locals;
  if (typeof response === "object") return res.jsonp(response);
  if (typeof response === "string") return res.send(interpolate({ config: locals.config, req: _.cloneDeep(req) }, response));
  res.sendFile(response);
}

const setStatus = (res: express.Response, status?: number) => {
  if (!status) return;
  if (status && status >= 100 && status < 600) res.status(status);
}

const setHeaders = (res: express.Response, headers?: object) => {
  if (!isPlainObject(headers) || _.isEmpty(headers)) return;

  Object.entries(headers as object).forEach(([headerName, value]) => {
    res.set(headerName, value);
  })

  // Removing Content-Length if Transfer-Encoding is present: 
  // Content-Length can't be present with Transfer-Encoding
  if (res.hasHeader('Transfer-Encoding')) {
    res.removeHeader("Content-Length");
  }

  // set no cache
  if (res.locals.config.noCache) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '-1');
  }
}

export default async (req: express.Request, res: express.Response, _next) => {
  try {
    if (res.headersSent) return; // return if headers are already sent

    const locals = <Locals>res.locals;
    const routeConfig = locals.routeConfig

    const fetchData = routeConfig.fetchData;

    const response = routeConfig.mockFirst ? locals.routeConfig.mock : locals.data ?? fetchData?.response ?? locals.routeConfig.mock;
    const status = routeConfig.mockFirst ? (!fetchData || !fetchData.statusCode || (fetchData.isError && !routeConfig.skipFetchError)) ? routeConfig.statusCode : fetchData.statusCode : routeConfig.statusCode;
    const headers = routeConfig.mockFirst || (routeConfig.skipFetchError && fetchData?.isError) ? !_.isEmpty(fetchData?.headers) ? fetchData!.headers : routeConfig.headers : routeConfig.headers;

    setStatus(res, status);
    setHeaders(res, headers);

    if (fetchData?.isImage) {
      res.setHeader('Content-Type', 'image/png');
      return res.send(Buffer.from(fetchData.response));
    }

    // send File for the the file types other than ".json", ".jsonc", ".har", ".txt", ""
    if (routeConfig._isFile && locals.routeConfig._request?.url && ![".json", ".jsonc", ".har", ".txt", ""].includes(routeConfig._extension || '')) {
      if (routeConfig.fetchCount == 0) {
        return sendResponse(req, res, locals.routeConfig.mock);
      }
      locals.routeConfig.fetchCount!--;
      return res.sendFile(locals.routeConfig._request!.url!);
    }

    return sendResponse(req, res, response);
  } catch (err: any) {
    res.send(err.message || '')
  }
}
