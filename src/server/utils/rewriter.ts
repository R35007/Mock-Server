import express from "express";
import rewrite from 'express-urlrewrite';

export const Rewriter = (rewriter: {[key: string]: string}) => {
  const router = express.Router();
  Object.keys(rewriter).forEach(key => {
    router.use(rewrite(key, rewriter[key]));
  });
  return router;
}