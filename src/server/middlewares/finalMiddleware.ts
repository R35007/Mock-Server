import _ from 'lodash';
import { Locals } from '../types/common.types';
import { interpolate } from '../utils';

const sendResponse = (req, res, response) => {
  const locals = <Locals>res.locals;
  if (typeof response === "object") return res.jsonp(response);
  if (typeof response === "string") return res.send(interpolate({ config: locals.config, req: _.cloneDeep(req) }, response));
  res.send(response);
}

export default async (req, res, _next) => {
  try {
    const locals = <Locals>res.locals;
    const routeConfig = locals.routeConfig

    if (!res.headersSent) {
      const status = routeConfig.statusCode;
      if (status && status >= 100 && status < 600) res.status(status);

      let response = locals.data !== undefined ? (locals.data ?? {}) : (locals.routeConfig.mock ?? {});
      response = (["object", "string", "boolean"].includes(typeof response)) ? response : `${response}`;

      if (locals.data !== undefined) {
        const fetchData = routeConfig.fetchData;

        // Set status from fetchData
        if (fetchData && fetchData.status) {
          if (fetchData.isError) {
            !routeConfig.skipFetchError && res.status(fetchData.status);
          } else {
            res.status(fetchData.status);
          }
        }
        sendResponse(req, res, response);
      } else if (routeConfig._isFile && locals.routeConfig._request?.url && ![".json", ".jsonc", ".har", ".txt", ""].includes(routeConfig._extension || '')) {
        if (routeConfig.fetchCount == 0) {
          sendResponse(req, res, locals.routeConfig.mock || {});
          return;
        }
        locals.routeConfig.fetchCount!--;
        res.sendFile(locals.routeConfig._request!.url!);
      } else {
        sendResponse(req, res, response);
      }
    }
  } catch (err) {
    res.send(err.message || '')
  }
}