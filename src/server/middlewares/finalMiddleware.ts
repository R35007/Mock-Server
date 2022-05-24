import { Locals } from '../types/common.types';

export default async (_req, res, _next) => {
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
        if (fetchData && fetchData.status) {
          if (fetchData.isError) {
            !routeConfig.skipFetchError && res.status(fetchData.status);
          } else {
            res.status(fetchData.status);
          }
        }
        typeof response === "object" ? res.jsonp(response) : res.send(response);
      } else if (routeConfig._isFile && locals.routeConfig._request?.url && ![".json", ".jsonc", ".har", ".txt"].includes(routeConfig._extension || '')) {
        if (routeConfig.fetchCount == 0) {
          res.send(locals.routeConfig.mock || {});
          return;
        }
        locals.routeConfig.fetchCount!--;
        res.sendFile(locals.routeConfig._request!.url!);
      } else {
        typeof response === "object" ? res.jsonp(response) : res.send(response);
      }
    }
  } catch (err) {
    res.send(err.message || '')
  }
}