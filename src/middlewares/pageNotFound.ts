/**
 * The default export is a middleware function that creates a new Error object for Page Not Found (404) and passes it to the next error handler in the stack.
 * @param {express.Request} _req - The request object.
 * @param {express.Response} _res - The response object.
 * @param {express.NextFunction} next - The next middleware function in the stack.
 */
export default (_req, _res, next) => {
  const err: any = new Error('Page Not Found');
  err.status = 404;
  next(err);
};
