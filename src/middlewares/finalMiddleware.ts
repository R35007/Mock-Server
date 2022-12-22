import _, { isPlainObject } from 'lodash';
import * as express from "express";
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

  // Removing Content-Length and Transfer-Encoding due to Parse Error: 
  // Content-Length can't be present with Transfer-Encoding
  res.removeHeader("Content-Length");
  res.removeHeader("Transfer-Encoding");
}

export default async (req: express.Request, res: express.Response, _next) => {
  try {
    if (res.headersSent) return; // return if headers are already sent

    const locals = <Locals>res.locals;
    const routeConfig = locals.routeConfig

    const fetchData = routeConfig.fetchData;

    const response = fetchData?.response ?? locals.data ?? locals.routeConfig.mock;
    const status = (!fetchData || !fetchData.statusCode || (fetchData.isError && !routeConfig.skipFetchError)) ? routeConfig.statusCode : fetchData.statusCode;
    const headers = _.isEmpty(fetchData?.headers) ? routeConfig.headers : fetchData!.headers;

    setStatus(res, status);
    setHeaders(res, headers);

    if (fetchData?.isImage) {
      res.set('Content-Type', 'image/png');
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
