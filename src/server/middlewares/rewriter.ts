import * as express from 'express';
import rewrite from 'express-urlrewrite';
import { KeyValString } from '../model';

export default (rewriters: KeyValString) => {
  const router = express.Router();
  Object.keys(rewriters).forEach(key => router.use(rewrite(key, rewriters[key])));
  return router;
}