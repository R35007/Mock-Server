import _ from 'lodash';
import { Locals } from '../types/common.types';

export default (_req, res, next) => {
  const locals = res.locals as Locals || {};

  const headers = locals.headers || locals.routeConfig?.headers;

  if (!_.isPlainObject(headers) || _.isEmpty(headers)) return next();

  Object.entries(headers as object).forEach(([headerName, value]) => {
    res.set(headerName, value);
  })

  // Removing Content-Length if Transfer-Encoding is chunked: 
  // Content-Length can't be present with Transfer-Encoding
  if (res.get('Transfer-Encoding') === 'chunked') {
    res.removeHeader("Content-Length");
  }

  // set no cache
  if (res.locals.config.noCache) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '-1');
  }

  next();
}
