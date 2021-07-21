import express from "express";

export const PageNotFound = (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
  const err: any = new Error("Page Not Found");
  err.status = 404;
  next(err);
}