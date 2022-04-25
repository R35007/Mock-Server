import * as _ from 'lodash';
import { Default_Middlewares, Locals } from '../model';
import CRUD from '../utils/crud';

const _IterateResponse = (_req, res, next) => {
  const storeKey = "_IterateResponse"
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  routeConfig.store = _.isPlainObject(routeConfig.store) ? routeConfig.store : {};
  const store = routeConfig.store || {};

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
  routeConfig.store = _.isPlainObject(routeConfig.store) ? routeConfig.store : {};
  const store = routeConfig.store || {};

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

  const storeKey = "_CrudOperation";
  const method = req.method;
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  routeConfig.store = _.isPlainObject(routeConfig.store) ? routeConfig.store : {};
  const store = routeConfig.store || {};

  if (!(_.isArray(locals.data) && locals.data.every(d => _.isPlainObject(d)))) {
    console.error("To use _CurdResponse method the data must be of type Array of objects");
    return next();
  }
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
}
const _AdvancedSearch = (req, res, next) => {
  const method = req.method;
  const locals = res.locals as Locals;
  if (method.toLowerCase() === 'get') {
    locals.data = CRUD.search(req, res, locals.data);
  }
  next();
}
const _FetchTillData = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  if (!routeConfig.fetchData) return next();

  if (!routeConfig.fetchData.isError) {
    routeConfig.fetchCount = 0;
  } else if (routeConfig.fetchCount !== undefined && routeConfig.fetchCount == 0) {
    routeConfig.fetchCount = -1;
  }
  next();
}
const _SetFetchDataToMock = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  if (routeConfig.fetchData) {
    const { isError, response } = routeConfig.fetchData;
    routeConfig.mock = isError ? (routeConfig.skipFetchError ? routeConfig.mock : response) : response;
  }
  next();
}
const _SetStoreDataToMock = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  if (routeConfig.store !== undefined) {
    routeConfig.mock = routeConfig.store;
  }
  next();
}
const _MockOnly = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  locals.data = routeConfig.mock;
  next();
}
const _FetchOnly = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  locals.data = routeConfig.fetchData?.response || {};
  next();
}
const _ReadOnly = (req, res, next) => {
  if (req.method === 'GET') {
    next(); // Continue
  } else {
    res.sendStatus(403); // Forbidden
  }
}

const Default_Middlewares: Default_Middlewares = {
  _IterateResponse,
  _IterateRoutes,
  _CrudOperation,
  _AdvancedSearch,
  _FetchTillData,
  _SetFetchDataToMock,
  _SetStoreDataToMock,
  _MockOnly,
  _FetchOnly,
  _ReadOnly
}

export default Default_Middlewares;