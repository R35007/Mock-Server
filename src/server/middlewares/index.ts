import * as _ from 'lodash';
import { Locals, Middlewares } from '../model';
import CRUD from '../utils/crud';

const _IterateResponse = (_req, res, next) => {
  const storeKey = "_IterateResponse"
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  routeConfig._store = _.isPlainObject(routeConfig._store) ? routeConfig._store : {};
  const store = routeConfig._store || {};

  if (!Array.isArray(locals.data)) {
    console.error("To use _IterateResponse method the data must be of type Array");
    return next();
  }

  if (!(store[storeKey]?.length)) {
    store[storeKey] = _.cloneDeep(locals.data || '');
  }

  locals.data = store[storeKey].shift();
  next();
}
const _IterateRoutes = (req, res, next) => {
  const storeKey = "_IterateRoutes"
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  routeConfig._store = _.isPlainObject(routeConfig._store) ? routeConfig._store : {};
  const store = routeConfig._store || {};

  if (!Array.isArray(locals.data)) {
    console.error("To use _IterateRoutes method the data must be of type Array");
    return next();
  }

  if (!(store[storeKey]?.length)) {
    store[storeKey] = _.cloneDeep(locals.data || '');
  }

  req.url = store[storeKey].shift();
  next("route");
}
const _CrudOperation = (req, res, next) => {

  const storeKey = "_CurdResponse";
  const method = req.method;
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  routeConfig._store = _.isPlainObject(routeConfig._store) ? routeConfig._store : {};
  const store = routeConfig._store || {};

  if (!(_.isArray(locals.data) && locals.data.every(d => _.isPlainObject(d)))) {
    console.error("To use _CurdResponse method the data must be of type Array of objects");
    return next();
  }
  if (!store[storeKey]) store[storeKey] = _.cloneDeep(locals.data);
  const data = store[storeKey];

  if (method.toLowerCase() === 'get') {
    locals.data = CRUD.search(req, res, data, locals.config.id);
  } else if (method.toLowerCase() === 'put') {
    locals.data = CRUD.replace(req, res, data, locals.config.id);
  } else if (method.toLowerCase() === 'patch') {
    locals.data = CRUD.update(req, res, data, locals.config.id);
  } else if (method.toLowerCase() === 'post') {
    locals.data = CRUD.insert(req, res, data, locals.config.id);
  } else if (method.toLowerCase() === 'delete') {
    locals.data = CRUD.remove(req, res, data, locals.config.id);
  }
  next();
}
const _AdvancedSearch = (req, res, next) => {
  const method = req.method;
  const locals = res.locals as Locals;
  if (method.toLowerCase() === 'get') {
    locals.data = CRUD.search(req, res, locals.data, locals.config.id);
  }
  next();
}
const _FetchTillData = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  if (routeConfig._fetchData !== undefined) {
    routeConfig.fetchCount = 0;
  } else if (routeConfig.fetchCount !== undefined && routeConfig.fetchCount == 0) {
    routeConfig.fetchCount = -1;
  }
  next();
}
const _SetFetchDataToMock = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  if (routeConfig._fetchData !== undefined || routeConfig._fetchError !== undefined) {
    routeConfig.mock = routeConfig._fetchData ?? (routeConfig.skipFetchError ? routeConfig.mock : routeConfig._fetchError);
  }
  next();
}
const _SetStoreDataToMock = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  if (routeConfig._store !== undefined) {
    routeConfig.mock = routeConfig._store;
  }
  next();
}
const _SendOnlyMock = (_req, res) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  res.send(routeConfig.mock);
}

const Default_Middlewares: Middlewares = {
  _IterateResponse,
  _IterateRoutes,
  _CrudOperation,
  _AdvancedSearch,
  _FetchTillData,
  _SetFetchDataToMock,
  _SetStoreDataToMock,
  _SendOnlyMock
}

export default Default_Middlewares;