"use strict";

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import methodOverride from 'method-override';
import morgan from 'morgan';
import * as Defaults from '../defaults';
import { Default_Options } from '../types/common.types';
import * as ValidTypes from '../types/valid.types';
const errorhandler = require('errorhandler');
var responseTime = require('response-time');

export default (opts: Default_Options) => {


  const _opts = { ...Defaults.Config, ...opts } as ValidTypes.Config;

  const arr: any[] = [];

  // gives response time in Response Header X-Response-Time
  arr.push(responseTime({ suffix: false }));

  // Compress all requests
  if (!_opts.noGzip) {
    arr.push(compression());
  }

  // Enable CORS for all the requests, including static files
  if (!_opts.noCors) {
    arr.push(cors({
      origin: true,
      credentials: true
    }));
  }

  // only use in development
  if (process.env.NODE_ENV === 'development') {
    arr.push(errorhandler());
  }

  // Serve static files
  const router = express.Router();
  router.use(_opts.base, express.static(_opts.staticDir!))
  arr.push(router);

  // Logger
  if (_opts.logger) {
    arr.push(morgan('dev', {
      skip: req => process.env.NODE_ENV === 'test' ||
        req.url === '/favicon.ico'
    }));
  }

  // No cache for IE
  // https://support.microsoft.com/en-us/kb/234067
  arr.push((_req, res, next) => {
    res.header('Cache-Control', 'no-cache');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '-1');
    next();
  });


  // Add delay
  arr.push((req, _res, next) => {
    const delay = parseInt(req.query._delay);
    setTimeout(() => {
      delete req.query._delay;
      next();
    }, !isNaN(delay) ? delay : 0);
  });

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


  if (_opts.bodyParser) {
    arr.push(express.urlencoded({ extended: true }));
    arr.push(express.json({ limit: '10mb' }));
  }

  arr.push(methodOverride())

  return arr;
};