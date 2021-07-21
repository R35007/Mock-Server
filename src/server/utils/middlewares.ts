import * as _ from 'lodash';
import { getFileData, getUrlData } from '.';
import { Locals } from '../model';
import { CRUD } from './crud';

const _LoopResponse = (_req, res, next) => {
  const storeKey = "_LoopResponse"
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  routeConfig._store = _.isPlainObject(routeConfig._store) ? routeConfig._store : {};
  const store = routeConfig._store || {};

  if (!Array.isArray(locals.data)) {
    console.error("To use _LoopResponse method the data must be of type Array");
    return next();
  }

  if (!(store[storeKey]?.length)) {
    store[storeKey] = _.cloneDeep(locals.data || '');
  }

  locals.data = store[storeKey].shift();
  next();
}
const _GroupResponse = (req, res, next) => {
  const path = req.path;
  const locals = res.locals as Locals;

  if (!_.isPlainObject(locals.data)) {
    console.error("To use _GroupResponse method the data must be of type objects");
    next();
    return;
  }

  locals.data = locals.data[path] || locals.data[Object.keys(locals.data)[0]];
  next();
}
const _CrudResponse = (req, res, next) => {

  const storeKey = "_CurdResponse";
  const method = req.method;
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  routeConfig._store = _.isPlainObject(routeConfig._store) ? routeConfig._store : {};
  const store = routeConfig._store || {};

  if (!(_.isArray(locals.data) && locals.data.every(d => _.isPlainObject(d)))) {
    console.error("To use _CurdResponse method the data must be of type Array of objects");
    next();
    return;
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
  return next();
}
const _Fetch = (req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  if (!routeConfig._request?.url) next();

  if (routeConfig._request?.url?.startsWith("http")) {
    _FetchUrl(req, res, next)
  } else {
    _FetchFile(req, res, next)
  }
}
const _FetchUrl = async (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  const { _request } = routeConfig
  if (!_request?.url?.startsWith("http")) return next();

  if (routeConfig.fetchCount == 0) {
    locals.data = routeConfig._fetchData ?? routeConfig._fetchError;
    return;
  }

  const { fetchData, fetchError } = await getUrlData(_request!);
  routeConfig._fetchData = fetchData;
  routeConfig._fetchError = fetchError;
  routeConfig._store = {};
  routeConfig.fetchCount!--;

  locals.data = fetchData ?? fetchError;

  next();
}
const _FetchFile = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  const { _request, _extension = '' } = routeConfig;
  if (_request?.url?.startsWith("http") || ![".json", ".har", ".txt"].includes(_extension)) return next();

  if (routeConfig.fetchCount == 0) {
    locals.data = routeConfig._fetchData ?? routeConfig._fetchError;
    return;
  }

  const { fetchData, fetchError } = getFileData(_request!.url!, _extension);
  routeConfig._fetchData = fetchData;
  routeConfig._fetchError = fetchError;
  routeConfig._store = {};
  routeConfig.fetchCount!--;

  locals.data = fetchData ?? fetchError;

  next();
}
const _SkipFetchError = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  if (routeConfig._fetchError) {
    locals.data = routeConfig.mock;
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
    routeConfig.mock = routeConfig._fetchData ?? routeConfig._fetchError;
    delete routeConfig._fetchData;
    delete routeConfig._fetchError;
  }

  if (routeConfig.fetchCount == 0) {
    delete routeConfig._fetchData;
    delete routeConfig._fetchError;
  }

  next();
}
const _SendOnlyMock = (_req, res) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  res.send(routeConfig.mock);
}

export const Default_Middlewares = {
  _LoopResponse,
  _GroupResponse,
  _CrudResponse,
  _Fetch,
  _FetchUrl,
  _FetchFile,
  _SkipFetchError,
  _FetchTillData,
  _SetFetchDataToMock,
  _SendOnlyMock
}