import * as express from "express";
import _ from 'lodash';

export class CURD {

  static find = (req: express.Request, data: any[]) => {
    const id = req?.params?.id;
    return typeof id !== "undefined"
      ? data.find(d => d.id == id) : CURD.search(req, data);
  }

  static search = (req: express.Request, data: any[]) => {
    const query = req.query;
    const queryEntries = Object.entries(query);
    return queryEntries.length ? data.filter(d => queryEntries.some(([key, val]) => d[key] == val)) : data;
  }

  static addData = (req: express.Request, data: any[]) => {
    const body = req.body;

    const maxId = data.length ? Math.max(...data.map(d => d.id)) : 0;

    if (body && _.isPlainObject(body)) {
      body.id = maxId + 1;
      data.push(body);
    } else if (_.isArray(body)) {
      const newBody = body.map((b, i) => {
        b.id = maxId + i + 1;
        return b;
      })
      data = data.concat(newBody);
    }
    return data;
  }

  static removeData = (req: express.Request, data: any[]) => {
    const id = req.params?.id;
    return typeof id !== "undefined" ? data.filter(d => d.id != id) : data;
  }

  static updateData = (req: express.Request, data: any[]) => {
    const { body } = req;
    const id = body?.id;

    if (body && _.isPlainObject(body) && typeof id !== "undefined") {
      return data.map(d => {
        if (d.id == id) {
          return { ...d, ...body }
        }
        return d
      });
    }
    return data;
  }

}
