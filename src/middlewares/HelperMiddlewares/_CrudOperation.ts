import * as _ from 'lodash';
import type { Locals } from '../../types/common.types';
import CRUD from '../../utils/crud';

export const _CrudOperation = async (req, res, next) => {
  const storeKey = '_CrudOperation';
  const method = req.method;
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  // return if the data is not a collection.
  if (!(_.isArray(locals.data) && locals.data.every((d) => _.isPlainObject(d)))) return next();

  routeConfig.store = _.isPlainObject(routeConfig.store) ? routeConfig.store : {};
  const store = routeConfig.store || {};

  if (!store[storeKey]) store[storeKey] = _.cloneDeep(locals.data);
  const data = store[storeKey];

  if (method.toLowerCase() === 'get') {
    locals.data = CRUD.search(req, res, data);
  } else if (method.toLowerCase() === 'put') {
    locals.data = CRUD.replace(req, res, data);
  } else if (method.toLowerCase() === 'patch') {
    locals.data = CRUD.update(req, res, data);
  } else if (method.toLowerCase() === 'post') {
    locals.data = CRUD.insert(req, res, data);
  } else if (method.toLowerCase() === 'delete') {
    locals.data = CRUD.remove(req, res, data);
  }
  next();
};
