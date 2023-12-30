import type * as express from 'express';
import * as _ from 'lodash';
import * as lodashIdMixin from 'lodash-id';
import { nanoid } from 'nanoid';
import { flatQuery } from '.';

const lodashId = _ as any; // just to remove type when using mixin
lodashId.mixin(lodashIdMixin);

export default class {
  static search = (req: express.Request, res: express.Response, data: any[]) => {
    const query = req.query;
    const params = req.params;

    if (!Object.keys(query).length && !Object.keys(params).length) return data;

    const config = res.locals?.config || {};
    lodashId.id = config.id || 'id';
    const id = lodashId.id || config.id || 'id';

    let _data = _.cloneDeep(data);

    const ids = flatQuery(params[id] || query[id]);
    const _sort = flatQuery(query._sort);
    const _order = flatQuery(query._order);
    const _start = flatQuery(query._start, true)[0] as number;
    const _end = flatQuery(query._end, true)[0] as number;
    const _limit = flatQuery(query._limit, true)[0] as number;
    const _page = flatQuery(query._page, true)[0] as number;
    const _first = flatQuery(query._first)[0];
    const _last = flatQuery(query._last)[0];
    const _text = flatQuery(query._text);
    const q = flatQuery(query.q);
    const isRange = _start || _end;

    delete query._sort;
    delete query._order;
    delete query._start;
    delete query._end;
    delete query._limit;
    delete query._page;
    delete query._text;
    delete query._first;
    delete query._last;
    delete query.q;

    // Filters By Id
    if (ids.length) {
      _data = ids.map((id) => lodashId.getById(_data, id)).filter(Boolean);
    }

    // Automatically delete query parameters that can't be found in database
    Object.keys(query).forEach((key) => {
      for (const i in _data) {
        const path = key.replace(/(_lte|_gte|_ne|_like)$/, '');
        if (_.has(_data[i], path) || key === 'callback' || key === '_') return;
      }
      delete query[key];
    });

    // Makes query.id=1,2 to query.id=[1,2]
    for (const key in query) {
      query[key] = flatQuery(query[key]) as string[];
    }

    // Partial Text Search
    const searchTexts = [..._text, ...q].filter(Boolean);
    if (searchTexts.filter(Boolean).length) {
      _data = _data.filter((d) =>
        searchTexts.some(
          (_t) =>
            _.values(d)
              .join(', ')
              ?.toLowerCase()
              .indexOf(`${_t || ''}`?.toLowerCase()) >= 0
        )
      );
    }

    // Attribute Filter
    _.toPairs(query).forEach(([key, val]) => {
      const _val = ([] as any).concat(val);
      const isDifferent = /_ne$/.test(key);
      const isRange = /_lte$/.test(key) || /_gte$/.test(key);
      const isLike = /_like$/.test(key);
      const path = key.replace(/(_lte|_gte|_ne|_like)$/, '');

      _data = _data.filter((obj) => {
        const objVal = _.get(obj, path);
        const valMatchList = _val.map((v) => {
          if (objVal === undefined || objVal === null) {
            return undefined;
          }
          if (isRange) {
            const isLowerThan = /_gte$/.test(key);
            return isLowerThan ? v <= objVal : v >= objVal;
          } else if (isDifferent) {
            return v != objVal.toString();
          } else if (isLike) {
            return new RegExp(v, 'i').test(objVal.toString());
          } else {
            return v == objVal.toString();
          }
        });
        const isMatched = valMatchList.reduce((a, b) => (isDifferent ? a && b : a || b));
        return isMatched;
      });
    });

    // Sort and Order
    _data = _.orderBy(_data, _sort, _order.map((o) => `${o || ''}`.toLowerCase()) as Array<'asc' | 'desc'>);

    // Ranging
    if (isRange) {
      const startIndex = _start ?? 0;
      const endIndex = _end ?? _data.length;
      _data = _data.slice(startIndex, endIndex) || [];
    }

    // Pagination
    if (_page !== undefined) {
      const chunks = _.chunk(_data, _limit ?? 10);
      const links: any = {};
      const fullURL = `http://${req.get('host')}${req.originalUrl}`;

      links.first = fullURL.replace(`_page=${_page}`, '_page=1');
      if (_page > 1) links.prev = fullURL.replace(`_page=${_page}`, `_page=${_page - 1}`);
      if (_page < chunks.length) links.next = fullURL.replace(`_page=${_page}`, `_page=${_page + 1}`);
      links.last = fullURL.replace(`_page=${_page}`, `_page=${chunks.length}`);

      res.links(links);
      _data = chunks[_page - 1] || [];
    }

    // Limit
    if (_limit !== undefined) {
      _data = _.take(_data, _limit) || [];
    }

    // First
    if (_first == 'true') {
      _data = _.head(_data);
    }

    // Last
    if (_last == 'true') {
      _data = _.last(_data);
    }

    // Set Headers
    if (_start || _end || _limit || _page) {
      res.setHeader('X-Total-Count', data.length);
      res.setHeader('Access-Control-Expose-Headers', `X-Total-Count${_page ? ', Link' : ''}`);
    }

    if (params[id] && _.isArray(_data) && _data?.length === 0) return {};
    if (params[id] && _.isArray(_data) && _data?.length === 1) return _data[0];
    return _data;
  };

  static insert = (req: express.Request, res: express.Response, data: any[]) => {
    const config = res.locals?.config || {};
    lodashId.id = config.id || 'id';
    const id = lodashId.id || config.id || 'id';

    lodashId.createId = (coll) => {
      if (_.isEmpty(coll)) {
        return 1;
      } else {
        let maxId = parseInt(lodashId.maxBy(coll, id)[id], 10); // Increment integer id or generate string id
        return !_.isNaN(maxId) ? ++maxId : nanoid(7);
      }
    };
    const body = [].concat(req.body);
    if (_.isEmpty(body)) return;
    body.forEach((b: any) => delete b.id);
    const insertedData = body.reduce((res, b) => res.concat(lodashId.insert(data, b)), []);
    return insertedData;
  };

  static remove = (req: express.Request, res: express.Response, data: any[]) => {
    const config = res.locals?.config || {};
    lodashId.id = config.id || 'id';
    const id = lodashId.id || config.id || 'id';

    if (req.params[id]) {
      return lodashId.removeById(data, req.params[id]);
    } else if (!_.isEmpty(req.query)) {
      return lodashId.removeWhere(data, req.query);
    }
    return {};
  };

  static update = (req: express.Request, res: express.Response, data: any[]) => {
    const config = res.locals?.config || {};
    lodashId.id = config.id || 'id';
    const id = lodashId.id || config.id || 'id';

    const body = [].concat(req.body)[0];
    if (_.isEmpty(body)) return {};

    if (req.params[id]) {
      return lodashId.updateById(data, req.params[id], body);
    } else if (!_.isEmpty(req.query)) {
      return lodashId.updateWhere(data, req.query, body);
    }
    return {};
  };

  static replace = (req: express.Request, res: express.Response, data: any[]) => {
    const config = res.locals?.config || {};
    lodashId.id = config.id || 'id';
    const id = lodashId.id || config.id || 'id';

    const body = [].concat(req.body)[0];
    if (_.isEmpty(body)) return {};

    if (req.params[id]) {
      return lodashId.replaceById(data, req.params[id], body);
    } else if (!_.isEmpty(req.query)) {
      const matchedIds = _.filter(data, req.query).map((d) => d[id]);
      return matchedIds.reduce((res, matchedId) => res.concat(lodashId.replaceById(data, matchedId, body)), []);
    }
    return {};
  };
}
