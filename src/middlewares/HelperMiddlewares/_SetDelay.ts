import type { Locals } from '../../types/common.types';

export const _SetDelay = (req, res, next) => {
  const locals = res.locals as Locals;

  const delay = locals.routeConfig?.delay || [].concat(req.query?._delay || 0)[0];
  const _delay = parseInt((delay as any) || 0, 10);

  if (!_delay || isNaN(_delay)) return next();

  setTimeout(() => next(), _delay);
};
