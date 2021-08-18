import { Locals } from '../model';

export default async (_req, res, _next) => {
  const locals = <Locals>res.locals;
  const routeConfig = locals.routeConfig

  if (!res.headersSent) {
    const status = routeConfig.statusCode;
    if (status && status >= 100 && status < 600) res.status(status);

    if (locals.data !== undefined) {
      const fetchData = routeConfig.fetchData;
      if (fetchData && fetchData.status) {
        if (fetchData.isError) {
          !routeConfig.skipFetchError && res.status(fetchData.status);
        } else {
          res.status(fetchData.status);
        }
      }
      const response = locals.data ?? {};
      typeof locals.data === "object" ? res.jsonp(response) : res.send(response);
    } else if (routeConfig._isFile && locals.routeConfig._request?.url && ![".json", ".jsonc", ".har", ".txt"].includes(routeConfig._extension || '')) {
      if (routeConfig.fetchCount == 0) {
        res.send(locals.routeConfig.mock || {});
        return;
      }
      locals.routeConfig.fetchCount!--;
      res.sendFile(locals.routeConfig._request!.url!);
    } else {
      res.send(locals.routeConfig.mock || {});
    }
  }
}