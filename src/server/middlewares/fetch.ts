import { Locals } from '../model';
import { getFileData, getUrlData } from '../utils/fetch';

export default (req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  if (routeConfig._request?.url?.startsWith("http")) {
    _FetchUrl(req, res, next)
  } else {
    _FetchFile(req, res, next)
  }
}
const _FetchUrl = async (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  const _request = routeConfig._request;
  if (!_request?.url?.startsWith("http")) return next();

  if (routeConfig.fetchCount == 0) {
    const { isError, response } = routeConfig.fetchData || {};
    locals.data = isError ? (routeConfig.skipFetchError ? routeConfig.mock : response) : response;
    return next();
  }

  const fetchData = await getUrlData(_request!);
  routeConfig.fetchData = fetchData;
  routeConfig.fetchCount!--;
  delete routeConfig.store?.["_IterateResponse"];
  delete routeConfig.store?.["_IterateRoutes"];
  delete routeConfig.store?.["_CrudOperation"];

  locals.data = fetchData.isError ? (routeConfig.skipFetchError ? routeConfig.mock : fetchData.response) : fetchData.response;

  next();
}
const _FetchFile = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  const { _request, _extension = '' } = routeConfig;
  if (_request?.url?.startsWith("http") || ![".json", ".jsonc", ".har", ".txt"].includes(_extension)) return next();

  if (routeConfig.fetchCount == 0) {
    const { isError, response } = routeConfig.fetchData || {};
    locals.data = isError ? (routeConfig.skipFetchError ? routeConfig.mock : response) : response;
    return next();
  }

  const fetchData = getFileData(_request!.url!, _extension);
  routeConfig.fetchData = fetchData;
  routeConfig.fetchCount!--;
  delete routeConfig.store?.["_IterateResponse"];
  delete routeConfig.store?.["_IterateRoutes"];
  delete routeConfig.store?.["_CrudOperation"];

  locals.data = fetchData.isError ? (routeConfig.skipFetchError ? routeConfig.mock : fetchData.response) : fetchData.response;

  next();
}