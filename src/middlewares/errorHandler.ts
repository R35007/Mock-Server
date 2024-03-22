import chalk from 'chalk';

/**
 * The default export is an error handling middleware function.
 * It sends a response with the error status and message, or defaults to a 500 Internal Server Error if not specified.
 * @param {any} err - The error object that may contain a response object with status and data properties.
 * @param {express.Request} _req - The request object.
 * @param {express.Response} res - The response object.
 * @param {express.NextFunction} next - The next middleware function in the stack.
 */
export default (err, _req, res, next) => {
  if (!err) return next();
  const response = err.response;
  if (response) {
    res.status(response.status || 500);
    res.send(response.data);
  } else {
    res.status(err.status || 500);
    res.send(err.message || 'Internal Server Error');
    if (err.message !== 'Page Not Found') {
      console.log(chalk.red('\nError. Something went wrong !'));
      console.log(chalk.gray(err.message) + '\n');
    }
  }
};
