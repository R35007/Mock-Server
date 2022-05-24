import { Locals } from '../types/common.types';

export default (_req, res, next) => {
  const locals = res.locals as Locals;
  const { delay } = locals.routeConfig || {};
  setTimeout(() => { next() }, !isNaN(delay || 0) ? delay : 0);
}