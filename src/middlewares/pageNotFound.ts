export default (_req, _res, next) => {
  const err: any = new Error('Page Not Found');
  err.status = 404;
  next(err);
};
