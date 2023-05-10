import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import methodOverride from 'method-override';
import morgan from 'morgan';
import responseTime from 'response-time';
import * as Defaults from '../defaults';
import type { DefaultOptions } from '../types/common.types';
import type * as ValidTypes from '../types/valid.types';

export default (opts: DefaultOptions) => {
  const _opts = { ...Defaults.Config, ...opts } as ValidTypes.Config;

  const arr: any[] = [];

  // gives response time in Response Header X-Response-Time
  arr.push(responseTime());

  // Serve static files
  if (fs.existsSync(_opts.static)) {
    const router = express.Router();
    router.use(_opts.base, express.static(_opts.static));
    arr.push(router);
  }

  // Compress all requests
  if (!_opts.noGzip) {
    arr.push(compression());
  }

  // Enable CORS for all the requests, including static files
  if (!_opts.noCors) {
    arr.push(
      cors({
        credentials: true,
        origin: true,
      })
    );
  }

  // Logger
  if (_opts.logger) {
    arr.push(
      morgan('dev', {
        skip: (req: any) => process.env.NODE_ENV === 'test' || req.originalUrl?.includes('/_assets/') || false,
      })
    );
  }

  // No cache for IE
  // https://support.microsoft.com/en-us/kb/234067
  if (_opts.noCache) {
    arr.push((_req, res, next) => {
      res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '-1');
      next();
    });
  }

  // Read-only
  if (_opts.readOnly) {
    arr.push((req, res, next) => {
      if (req.method === 'GET') {
        next(); // Continue
      } else {
        res.sendStatus(403); // Forbidden
      }
    });
  } // Add middlewares

  // Body Parser
  if (_opts.bodyParser) {
    arr.push(express.urlencoded({ extended: true }));
    arr.push(express.json({ limit: '10mb' }));
  }

  // Cookie parser
  if (_opts.cookieParser) {
    arr.push(cookieParser());
  }

  arr.push(methodOverride());

  return arr;
};
