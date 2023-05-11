import type { AxiosRequestConfig } from 'axios';
import * as _ from 'lodash';
import type { Locals } from '../../types/common.types';
import { cleanObject, interpolate } from '../../utils';
import { getFileData, getStats, getUrlData, parseUrl } from '../../utils/fetch';

const setFetchData = (locals, next) => {
  const routeConfig = locals.routeConfig;

  const { isError, response, statusCode, headers, isImage } = routeConfig.fetchData || {};
  locals.data = isError
    ? routeConfig.skipFetchError
      ? locals.data
      : isImage
      ? Buffer.from(response)
      : response
    : isImage
    ? Buffer.from(response)
    : response;
  locals.statusCode = isError ? (routeConfig.skipFetchError ? locals.statusCode : statusCode) : statusCode;
  locals.headers = isError ? (routeConfig.skipFetchError ? locals.headers : headers) : headers;

  next();
};

const getValidReq = (req, res, fetch: AxiosRequestConfig): AxiosRequestConfig => {
  const locals = res.locals as Locals;
  const config = locals.config;
  const replacedPath = interpolate({ config, req: _.cloneDeep(req) }, fetch.url?.replace(/\\/g, '/'));
  const fetchEntries = Object.entries(fetch).map(([key, val]) => {
    return [key, interpolate({ config, req: _.cloneDeep(req) }, val.replace(/\\/g, '/'))];
  });
  const request = { ..._.fromPairs(fetchEntries), url: replacedPath };
  cleanObject(request);
  return request as AxiosRequestConfig;
};

const getUrlDetail = (req, res) => {
  const locals = res.locals as Locals;
  const fetch = locals.routeConfig.fetch;

  let request = {} as AxiosRequestConfig;
  if (_.isString(fetch)) {
    request = { url: fetch };
  } else if (_.isPlainObject(fetch)) {
    request = _.cloneDeep(fetch) as AxiosRequestConfig;
  } else {
    return;
  }

  if (request.url?.startsWith('http')) {
    request = getValidReq(req, res, request);
    return { extension: '', isFile: false, request };
  } else {
    const parsedUrl = parseUrl(request.url, locals.config.root).replace(/\\/g, '/');
    const interpolatedUrl = interpolate({ config: locals.config, req: _.cloneDeep(req) }, parsedUrl);
    const stats = getStats(interpolatedUrl);
    request.url = interpolatedUrl;
    return { request, ...stats };
  }
};

const setRequestUrl = (req, res) => {
  const locals = res.locals;
  const routeConfig = locals.routeConfig;

  const fetchCount = parseInt(`${routeConfig.fetchCount ?? ''}`);
  routeConfig.fetchCount = isNaN(fetchCount) ? 1 : fetchCount;
  const fetch = getUrlDetail(req, res);

  if (!fetch) return;

  routeConfig._request = fetch.request;
  routeConfig._isFile = fetch.isFile;
  routeConfig._extension = fetch.extension;
};

export const _Fetch = async (req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  // If mockFirst is true and mock data is defined then skip fetch
  if (routeConfig.mockFirst && routeConfig.mock !== undefined) return next();

  // If Data is already fetched and the fetch count is zero then send fetch response from fetchData
  if (routeConfig.fetchCount == 0 && !_.isEmpty(routeConfig.fetchData)) return setFetchData(locals, next);

  // If it don't has any fetch url or request object then skip fetch
  if (_.isEmpty(routeConfig.fetch)) return next();

  // generate valid request object from fetch attribute
  setRequestUrl(req, res);

  // if it doesn't has a valid request url then skip fetch
  if (!routeConfig._request?.url) return next();

  // url starts with http then fetch data from url else skip fetch
  if (routeConfig._request.url.startsWith('http')) {
    routeConfig.fetchData = await getUrlData(routeConfig._request!);
  }

  // if url is a file and is one of .json, .jsonc, .har, .txt file then fetch file else skip fetch
  if (routeConfig._isFile && ['.json', '.jsonc', '.har', '.txt'].includes(routeConfig._extension || '')) {
    routeConfig.fetchData = await getFileData(routeConfig._request!.url!);
  }

  // reduce fetch count
  routeConfig.fetchCount!--;

  // delete route config store cache due to new fetch data.
  delete routeConfig.store?._IterateResponse;
  delete routeConfig.store?._IterateRoutes;
  delete routeConfig.store?._CrudOperation;

  // set fetch data to locals
  return setFetchData(locals, next);
};
