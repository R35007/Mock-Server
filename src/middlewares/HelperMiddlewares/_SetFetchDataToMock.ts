import type { Locals } from '../../types/common.types';

export const _SetFetchDataToMock = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  if (routeConfig.fetchData) {
    const { isError, response } = routeConfig.fetchData;
    routeConfig.mock = isError ? (routeConfig.skipFetchError ? routeConfig.mock : response) : response;
  }
  next();
};
