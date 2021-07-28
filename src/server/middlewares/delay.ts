import { Locals } from '../model';

export default (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  setTimeout(() => {
    next();
  }, routeConfig.delay || 0);
}