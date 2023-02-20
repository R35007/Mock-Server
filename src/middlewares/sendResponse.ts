import _ from 'lodash';
import { Locals } from '../types/common.types';
import { interpolate } from '../utils';

export default async (req, res, _next) => {
  if (res.headersSent) return; // return if response is already sent

  const locals = <Locals>res.locals;
  const routeConfig = locals.routeConfig;

  // send File for the the file types other than ".json", ".jsonc", ".har", ".txt", ""
  if (
    routeConfig._isFile
    && routeConfig._request?.url
    && ![".json", ".jsonc", ".har", ".txt", ""].includes(routeConfig._extension || '')
  ) {
    routeConfig.fetchCount!--;
    res.sendFile(routeConfig._request.url);
    return;
  }

  const response = locals.data || {};

  if (_.isBuffer(response) || _.isArrayBuffer(response)) return res.send(response);
  if (_.isPlainObject(response) || _.isArray(response)) return res.jsonp(response);
  if (_.isString(response)) return res.send(interpolate({ config: locals.config, req: _.cloneDeep(req) }, response));
  if (_.isInteger(response)) return res.send(response.toString());
  res.send(response);
}
