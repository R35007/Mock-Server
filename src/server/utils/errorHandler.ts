import chalk from 'chalk';
import express from "express";

export const ErrorHandler = (err, _req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    } else {
      console.log(chalk.red("\n" + err.message));
    }
  }
};