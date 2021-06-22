import _ from 'lodash';
import { CURD } from './crud';
import { Config, Injectors, Locals, Middlewares, Routes } from "./model";

export const default_Routes: Routes = {};
export const default_Store: Object = {};

export const default_Config: Config = {
  port: 3000,
  rootPath: "./",
  baseUrl: "/",
  staticUrl: "",
  routeRewrite: {},
  excludeRoutes: [],
  reverseRouteOrder: false,
  throwError: false
};

export const default_Injectors: Injectors = {};

export const default_Middlewares: Middlewares = {
  loopMock: (req, res, next) => {
    const path = req.path;
    const locals = res.locals as Locals;

    if (!Array.isArray(locals.data)) {
      console.error("To use loopMock method the data must be of type Array");
      next();
      return;
    }

    if (!(locals.store[path] && locals.store[path].length)) {
      locals.store[path] = JSON.parse(JSON.stringify(locals.data));
    }

    locals.data = locals.store[path].shift();
    next();
  },
  groupMock: (req, res, next) => {
    const path = req.path;
    const locals = res.locals as Locals;

    if (!_.isPlainObject(locals.data)) {
      console.error("To use groupMock method the data must be of type objects");
      next();
      return;
    }

    locals.data = locals.data[path] || locals.data[Object.keys(locals.data)[0]];
    next();
  },
  crudMock: (req, res, next) => {

    const path = req.path;
    const method = req.method;
    const locals = res.locals as Locals;

    if (!(_.isArray(locals.data) && locals.data.every(d => _.isPlainObject(d)))) {
      console.error("To use crudMock method the data must be of type Array of objects");
      next();
      return;
    }

    const store = locals.store;

    if (!store[path]) store[path] = JSON.parse(JSON.stringify(locals.data));

    if (method?.toLowerCase() === 'get') {
      locals.data = CURD.find(req, store[path]);
      next();
      return;
    } else if (method?.toLowerCase() === 'put') {
      locals.data = CURD.updateData(req, store[path]);
      next();
      return;
    } else if (method?.toLowerCase() === 'post') {
      store[path] = CURD.addData(req, store[path]);
    } if (method?.toLowerCase() === 'delete') {
      store[path] = CURD.removeData(req, store[path]);
    }
    locals.data = store[path];
    next();
  },
  fetchOnce: (_req, res, next) => {
    const locals = res.locals as Locals;
    if (!locals.routeConfig.mockFirst && locals.fetchData) {
      locals.routeConfig.mockFirst = true;
      locals.routeConfig.mock = locals.fetchData;
    }
    next();
  }
};