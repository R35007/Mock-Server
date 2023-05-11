import type { Locals } from '../../types/common.types';

export const _FetchOnly = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  locals.data = routeConfig.fetchData?.response || {};
  next();
};
