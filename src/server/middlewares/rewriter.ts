import * as express from 'express';
import rewrite from 'express-urlrewrite';
import { KeyValString } from '../model';

export default (rewriterRoutes: KeyValString) => {
  const router = express.Router();
  Object.keys(rewriterRoutes).forEach(key => router.use(rewrite(key, rewriterRoutes[key])));
  return router;
}