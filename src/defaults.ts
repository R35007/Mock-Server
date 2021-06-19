import _ from 'lodash';
import { CURD } from './crud';
import { Config, Injectors, Middlewares, Routes } from "./model";

export const default_Routes: Routes = {};

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

    if (!Array.isArray(res.locals.data)) {
      console.error("To use loopMock method the data must be of type Array");
      next();
      return;
    }

    if (!(res.locals.store.get(path) && res.locals.store.get(path).length)) {
      res.locals.store.set(path, [...res.locals.data])
    }

    res.send(res.locals.store.get(path).shift());
  },
  groupMock: (req, res, next) => {
    const path = req.path;

    if (!_.isPlainObject(res.locals.data)) {
      console.error("To use groupMock method the data must be of type objects");
      next();
      return;
    }

    res.send(res.locals.data[path] || res.locals.data[Object.keys(res.locals.data)[0]])
  },
  crudMock: (req, res, next) => {

    const path = req.path;
    const method = req.method;


    if (!(_.isArray(res.locals.data) && res.locals.data.every(d => _.isPlainObject(d)))) {
      console.error("To use crudMock method the data must be of type Array of objects");
      next();
      return;
    }

    const store = res.locals.store;

    if (!store.get(path)) store.set(path, [...res.locals.data]);

    if (method?.toLowerCase() === 'get') {
      res.send(CURD.find(req, store.get(path)));
      return;
    } else if (method?.toLowerCase() === 'put') {
      res.send(CURD.updateData(req, store.get(path)))
      return;
    } else if (method?.toLowerCase() === 'post') {
      store.set(path, CURD.addData(req, store.get(path)));
    } if (method?.toLowerCase() === 'delete') {
      store.set(path, CURD.removeData(req, store.get(path)));
    }

    res.send(store.get(path));
  }
};