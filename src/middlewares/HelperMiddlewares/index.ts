export * from './_CrudOperation';
export * from './_Fetch';
export * from './_FetchOnly';
export * from './_FetchTillData';
export * from './_IterateResponse';
export * from './_IterateRoutes';
export * from './_MockOnly';
export * from './_ReadOnly';
export * from './_SendResponse';
export * from './_SetDelay';
export * from './_SetFetchDataToMock';
export * from './_SetHeaders';
export * from './_SetStatusCode';

export const globals = [
  (_req, _res, next) => {
    next();
  },
];
