import type { Locals } from '../../types/common.types';

export const _FetchTillData = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  if (!routeConfig.fetchData) return next();

  if (!routeConfig.fetchData.isError) {
    routeConfig.fetchCount = 0;
  } else if (routeConfig.fetchCount !== undefined && routeConfig.fetchCount == 0) {
    routeConfig.fetchCount = -1;
  }
  next();
};
