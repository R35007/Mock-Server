import { Locals } from '../types/common.types';

export default (_req, res, next) => {
  const locals = res.locals as Locals;
  const { delay } = locals.routeConfig || {};
  !isNaN(delay as any) ? setTimeout(() => { next() }, delay) : next();
}
