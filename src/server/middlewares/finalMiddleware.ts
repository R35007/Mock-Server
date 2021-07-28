import { Locals } from '../model';

export default async (_req, res, next) => {
  const locals = <Locals>res.locals;
  const routeConfig = locals.routeConfig

  if (!res.headersSent) {
    const status = routeConfig.statusCode;
    if (status && status >= 100 && status < 600) res.status(status);

    if (locals.data !== undefined) {
      if (locals.data.isAxiosError) return next(locals.data);
      typeof locals.data === "object" ? res.jsonp(locals.data || {}) : res.send(locals.data || {})
    } else if (routeConfig._isFile && locals.routeConfig._request?.url && ![".json", ".har", ".txt"].includes(routeConfig._extension || '')) {
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