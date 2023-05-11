import * as _ from 'lodash';
import type { Locals } from '../../types/common.types';

export const _SetHeaders = (_req, res, next) => {
  const locals = (res.locals as Locals) || {};

  const headers = locals.headers || locals.routeConfig?.headers;

  if (!_.isPlainObject(headers) || _.isEmpty(headers)) return next();

  // Set Response Headers
  Object.entries(headers).forEach(([headerName, value]) => {
    res.set(headerName, value);
  });

  // set no cache
  if (res.locals.config.noCache) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '-1');
  }

  next();
};
