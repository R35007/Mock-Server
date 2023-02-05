import * as express from "express";
import * as _ from "lodash";
import { Locals } from '../types/common.types';
import * as ValidTypes from '../types/valid.types';
import { setRequestUrl } from './fetch';

export default (routePath: string, config: ValidTypes.Config, getDb: (routePath?: string | string[]) => ValidTypes.RouteConfig | ValidTypes.Db, getStore: () => ValidTypes.Store) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const routeConfig = (getDb(routePath) || {}) as ValidTypes.RouteConfig;
    routeConfig.store && !_.isPlainObject(routeConfig.store) && (routeConfig.store = {});

    const locals = res.locals as Locals
    locals.routePath = routePath;
    locals.routeConfig = routeConfig;
    locals.getDb = getDb;
    locals.getStore = getStore;
    locals.config = config;

    locals.data = routeConfig.mock;
    locals.statusCode = routeConfig.statusCode;
    locals.headers = routeConfig.headers;

    delete locals.routeConfig._request;
    delete locals.routeConfig._isFile;
    delete locals.routeConfig._extension;

    if (routeConfig.mockFirst && routeConfig.mock !== undefined) return next();

    if (!_.isEmpty(routeConfig.fetch)) {
      setRequestUrl(req, res);
      return next();
    }

    next();
  };
};
