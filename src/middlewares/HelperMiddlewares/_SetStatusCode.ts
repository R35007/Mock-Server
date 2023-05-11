import type { Locals } from '../../types/common.types';

export const _SetStatusCode = (req, res, next) => {
  const locals = res.locals as Locals;

  const statusCode = locals.statusCode || locals.routeConfig?.statusCode || [].concat(req.query?._statusCode || 0)[0];
  const _statusCode = parseInt((statusCode as any) || 0, 10);
  const isStatusInRange = _statusCode >= 100 && _statusCode < 600;

  if (!_statusCode || isNaN(_statusCode) || !isStatusInRange) return next();

  res.status(_statusCode);
  next();
};
