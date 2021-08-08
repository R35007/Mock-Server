import { Locals } from '../model';
import { getFileData, getUrlData } from '../utils/fetch';

export default (req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  if (!routeConfig.fetch || !routeConfig._request?.url) return next();

  if (routeConfig.fetchCount == 0) {
    locals.data = routeConfig.fetchData ?? (routeConfig.skipFetchError ? routeConfig.mock : routeConfig.fetchError);
    return next();
  }

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
    locals.data = routeConfig.fetchData ?? (routeConfig.skipFetchError ? routeConfig.mock : routeConfig.fetchError);
    return next();
  }

  const { fetchData, fetchError } = await getUrlData(_request!);
  routeConfig.fetchData = fetchData;
  routeConfig.fetchError = fetchError;
  routeConfig.fetchCount!--;
  delete routeConfig.store?.["_IterateResponse"];
  delete routeConfig.store?.["_IterateRoutes"];
  delete routeConfig.store?.["_CrudOperation"];

  locals.data = fetchData ?? (routeConfig.skipFetchError ? routeConfig.mock : fetchError);

  next();
}
const _FetchFile = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;

  const { _request, _extension = '' } = routeConfig;
  if (_request?.url?.startsWith("http") || ![".json", ".har", ".txt"].includes(_extension)) return next();

  if (routeConfig.fetchCount == 0) {
    locals.data = routeConfig.fetchData ?? (routeConfig.skipFetchError ? routeConfig.mock : routeConfig.fetchError);
    return next();
  }

  const { fetchData, fetchError } = getFileData(_request!.url!, _extension);
  routeConfig.fetchData = fetchData;
  routeConfig.fetchError = fetchError;
  routeConfig.fetchCount!--;
  delete routeConfig.store?.["_IterateResponse"];
  delete routeConfig.store?.["_IterateRoutes"];
  delete routeConfig.store?.["_CrudOperation"];

  locals.data = fetchData ?? (routeConfig.skipFetchError ? routeConfig.mock : fetchError);

  next();
}