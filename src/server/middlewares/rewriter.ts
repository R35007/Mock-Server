import * as express from 'express';
import rewrite from 'express-urlrewrite';
import { KeyValString } from '../model';

export default (routeRewriters: KeyValString) => {
  const router = express.Router();
  Object.keys(routeRewriters).forEach(key => router.use(rewrite(key, routeRewriters[key])));
  return router;
}