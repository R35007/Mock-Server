import chalk from 'chalk';
import * as _ from 'lodash';
import type { Locals } from '../types/common.types';
import Defaults from './defaults';
import Delay from './delay';
import StatusCode from './statusCode';
import Headers from './headers';
import ErrorHandler from './errorHandler';
import Fetch from './fetch';
import CrudOperation from './crudOperation';
import SendResponse from './sendResponse';
import Initializer from './initializer';
import PageNotFound from './pageNotFound';

const _IterateResponse = (_req, res, next) => {
  const storeKey = '_IterateResponse';
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  routeConfig.store = _.isPlainObject(routeConfig.store) ? routeConfig.store : {};
  const store = routeConfig.store || {};

  if (!Array.isArray(locals.data)) {
    console.error(chalk.red('To use ') + chalk.yellowBright('_IterateResponse') + chalk.red(' method the data must be of type Array'));
    return next();
  }

  if (!store[storeKey]?.nextIndex || store[storeKey].nextIndex > locals.data.length - 1) {
    store[storeKey] = { currentIndex: -1, nextIndex: 0 };
  }
  locals.data = locals.data[store[storeKey].nextIndex];
  store[storeKey].currentIndex++;
  store[storeKey].nextIndex++;

  next();
};
const _IterateRoutes = (req, res, next) => {
  const storeKey = '_IterateRoutes';
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  routeConfig.store = _.isPlainObject(routeConfig.store) ? routeConfig.store : {};
  const store = routeConfig.store || {};

  if (!Array.isArray(locals.data)) {
    console.error(chalk.red('To use ') + chalk.yellowBright('_IterateRoutes') + chalk.red(' method the data must be of type Array'));
    return next();
  }

  if (!store[storeKey]?.nextIndex || store[storeKey].nextIndex > locals.data.length - 1) {
    store[storeKey] = { currentIndex: -1, nextIndex: 0 };
  }

  req.url = locals.data[store[storeKey].nextIndex];
  store[storeKey].currentIndex++;
  store[storeKey].nextIndex++;

  next('route');
};
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
};
const _SetFetchDataToMock = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  if (routeConfig.fetchData) {
    const { isError, response } = routeConfig.fetchData;
    routeConfig.mock = isError ? (routeConfig.skipFetchError ? routeConfig.mock : response) : response;
  }
  next();
};
const _SetStoreDataToMock = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  if (routeConfig.store !== undefined) {
    routeConfig.mock = routeConfig.store;
  }
  next();
};
const _MockOnly = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  locals.data = routeConfig.mock;
  next();
};
const _FetchOnly = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  locals.data = routeConfig.fetchData?.response || {};
  next();
};
const _ReadOnly = (req, res, next) => {
  if (req.method === 'GET') {
    next(); // Continue
  } else {
    res.sendStatus(403); // Forbidden
  }
};
const _Fetch = Fetch;

const HelperMiddlewares = {
  _Fetch,
  _FetchOnly,
  _FetchTillData,
  _IterateResponse,
  _IterateRoutes,
  _MockOnly,
  _ReadOnly,
  _SetFetchDataToMock,
  _SetStoreDataToMock,
  globals: [
    (_req, _res, next) => {
      next();
    },
  ],
};

export { Initializer, Delay, StatusCode, Headers, Defaults, Fetch, CrudOperation, PageNotFound, ErrorHandler, SendResponse };

export default HelperMiddlewares;
