import { AxiosRequestConfig } from 'axios';
import _ from 'lodash';
import { Locals } from '../types/common.types';
import { cleanObject, interpolate } from '../utils';
import { getFileData, getStats, getUrlData, parseUrl } from '../utils/fetch';

const Fetch = async (req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  if (!routeConfig._request?.url) return next();
  if (routeConfig._request?.url?.startsWith("http")) { FetchUrl(req, res, next) }
  else { FetchFile(req, res, next) }
}

export const FetchUrl = async (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  if (!routeConfig._request?.url?.startsWith("http")) return next();

  if (routeConfig.fetchCount == 0) {
    const { isError, response } = routeConfig.fetchData || {};
    locals.data = isError ? (routeConfig.skipFetchError ? routeConfig.mock : response) : response;
    return next();
  }

  const fetchData = await getUrlData(routeConfig._request!);
  routeConfig.fetchData = fetchData;
  routeConfig.fetchCount!--;
  delete routeConfig.store?.["_IterateResponse"];
  delete routeConfig.store?.["_IterateRoutes"];
  delete routeConfig.store?.["_CrudOperation"];

  locals.data = fetchData.isError ? (routeConfig.skipFetchError ? routeConfig.mock : fetchData.response) : fetchData.response;

  next();
}

export const FetchFile = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  const { _request, _extension = '' } = routeConfig;
  if (_request?.url?.startsWith("http") || ![".json", ".jsonc", ".har", ".txt", ""].includes(_extension)) return next();

  if (routeConfig.fetchCount == 0) {
    const { isError, response } = routeConfig.fetchData || {};
    locals.data = isError ? (routeConfig.skipFetchError ? routeConfig.mock : response) : response;
    return next();
  }

  const fetchData = getFileData(_request!.url!, _extension);
  routeConfig.fetchData = fetchData;
  routeConfig.fetchCount!--;
  delete routeConfig.store?.["_IterateResponse"];
  delete routeConfig.store?.["_IterateRoutes"];
  delete routeConfig.store?.["_CrudOperation"];

  locals.data = fetchData.isError ? (routeConfig.skipFetchError ? routeConfig.mock : fetchData.response) : fetchData.response;

  next();
}

export const setRequestUrl = (req, res) => {
  const locals = res.locals;
  const routeConfig = locals.routeConfig;

  const fetchCount = parseInt(`${routeConfig.fetchCount ?? ''}`);
  routeConfig.fetchCount = isNaN(fetchCount) ? 1 : fetchCount;
  const fetch = getUrlDetail(req, res);
  
  if (!fetch) return;
  
  routeConfig._request = fetch.request;
  routeConfig._isFile = fetch.isFile;
  routeConfig._extension = fetch.extension;
}

const getUrlDetail = (req, res) => {
  const locals = res.locals as Locals;
  const fetch = locals.routeConfig.fetch;

  let request = {} as AxiosRequestConfig;
  if (_.isString(fetch)) {
    request = { url: fetch }
  } else if (_.isPlainObject(fetch)) {
    request = _.cloneDeep(fetch) as AxiosRequestConfig;
  } else {
    return;
  }

  if (request.url?.startsWith("http")) {
    request = getValidReq(req, res, request);
    return { request, isFile: false, extension: "" };
  } else {
    const parsedUrl = parseUrl(request.url, locals.config.rootPath).replace(/\\/g, "/");
    const interpolatedUrl = interpolate({ config: locals.config, req: _.cloneDeep(req) }, parsedUrl);
    const stats = getStats(interpolatedUrl);
    request.url = interpolatedUrl;
    return { request, ...stats };
  }
}

const getValidReq = (req, res, fetch: AxiosRequestConfig): AxiosRequestConfig => {
  const locals = res.locals as Locals;
  const config = locals.config;
  const replacedPath = interpolate({ config, req: _.cloneDeep(req) }, fetch.url?.replace(/\\/g, "/"))
  const fetchEntries = Object.entries(fetch).map(([key, val]) => {
    return [key, interpolate({ config, req: _.cloneDeep(req) }, val.replace(/\\/g, "/"))]
  })
  const request = { ..._.fromPairs(fetchEntries), url: replacedPath };
  cleanObject(request);
  return request as AxiosRequestConfig;
}

export default Fetch