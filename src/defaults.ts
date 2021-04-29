import _ from 'lodash';
import { CURD } from './crud';
import { Config, Globals, Injectors, Middlewares, Routes } from "./model";

export const default_Routes: Routes = {};

export const default_Config: Config = {
  port: 3000,
  rootPath: "./",
  baseUrl: "",
  staticUrl: "",
  proxy: {},
  excludeRoutes: [],
  reverseRouteOrder: false,
  throwError: false
};

export const default_Globals: Globals = {};

export const default_Injectors: Injectors = {};

export const default_Middlewares: Middlewares = {
  loopMock: ({ data, res, globals, locals, next }) => {
    const path = locals.routePath;

    if (!Array.isArray(data)) {
      console.error("To use this method the data must be of type Array");
      next();
    }

    if (!globals[path] || !globals[path]?.length) {
      globals[path] = [...data];
    }

    res.send(globals[path].shift());
  },
  groupMock: ({ data, res, locals, next }) => {
    const path = locals.routePath;

    if (!_.isPlainObject(data)) {
      console.error("To use this method the data must be of type objects");
      next();
    }

    res.send(data[path] || data[Object.keys(data)[0]])
  },
  crudMock: ({ req, res, data, globals, locals, next }) => {

    const path = locals.routePath;
    const method = req.method;


    if (!(_.isArray(data) && data.every(d => _.isPlainObject(d)))) {
      console.error("To use this method the data must be of type Array of objects");
      next();
    }

    if (!globals[path]) globals[path] = [...data];

    if (method?.toLowerCase() === 'get') {
      res.send(CURD.find(req, globals[path]));
      return;
    } else if (method?.toLowerCase() === 'put') {
      res.send(CURD.updateData(req, globals[path]))
      return;
    } else if (method?.toLowerCase() === 'post') {
      globals[path] = CURD.addData(req, globals[path])
    } if (method?.toLowerCase() === 'delete') {
      globals[path] = CURD.removeData(req, globals[path])
    }

    res.send(globals[path]);
  }
};