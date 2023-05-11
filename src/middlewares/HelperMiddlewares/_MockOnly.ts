import type { Locals } from '../../types/common.types';

export const _MockOnly = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  locals.data = routeConfig.mock;
  next();
};
