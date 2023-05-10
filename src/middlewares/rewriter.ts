import * as express from 'express';
import rewrite from 'express-urlrewrite';
import type * as ValidTypes from '../types/valid.types';

export default (rewriters: ValidTypes.Rewriters) => {
  const router = express.Router();
  Object.keys(rewriters).forEach((key) => router.use(rewrite(key, rewriters[key])));
  return router;
};
