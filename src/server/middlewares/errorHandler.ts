import chalk from 'chalk';

export default (err, _req, res, next) => {
  if (!err) return next();
  const response = err.response;
  if (response) {
    res.status(response.status || 500);
    res.send(response.data);
  } else {
    res.status(err.status || 500);
    res.send(err.message || "Internal Server Error")
    if (err.message !== "Page Not Found") {
      console.log(chalk.red("\nError. Something went wrong !"));
      console.log(chalk.gray(err.stack) + "\n");
    }
  }
};