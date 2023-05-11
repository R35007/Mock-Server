import type * as express from 'express';
import * as _ from 'lodash';
import type MockServer from '..';
import type { Locals } from '../types/common.types';
import type * as ValidTypes from '../types/valid.types';

export default (routePath: string, mockServewr: MockServer) => {
  return async (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    const routeConfig = (mockServewr.getDb(routePath) || {}) as ValidTypes.RouteConfig;
    routeConfig.store && !_.isPlainObject(routeConfig.store) && (routeConfig.store = {});

    const locals = res.locals as Locals;
    locals.routePath = routePath;
    locals.routeConfig = routeConfig;
    locals.getDb = mockServewr.getDb;
    locals.getStore = mockServewr.getStore;
    locals.config = mockServewr.config;

    locals.data = routeConfig.mock;
    locals.statusCode = routeConfig.statusCode;
    locals.headers = routeConfig.headers;

    next();
  };
};
