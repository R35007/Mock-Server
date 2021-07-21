"use strict";

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import methodOverride from 'method-override';
import morgan from 'morgan';
import { Default_Config } from './config';
const errorhandler = require('errorhandler');

export function Defaults(opts) {
  opts = { ...Default_Config, ...opts }

  const arr: any[] = [];

  // Compress all requests
  if (!opts.noGzip) {
    arr.push(compression());
  }

  // Enable CORS for all the requests, including static files
  if (!opts.noCors) {
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
  arr.push(express.static(opts.static));

  // Logger
  if (opts.logger) {
    arr.push(morgan('dev', {
      skip: req => process.env.NODE_ENV === 'test' || req["path"] === '/favicon.ico'
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
  if (opts.readOnly) {
    arr.push((req, res, next) => {
      if (req.method === 'GET') {
        next(); // Continue
      } else {
        res.sendStatus(403); // Forbidden
      }
    });
  } // Add middlewares


  if (opts.bodyParser) {
    arr.push(express.urlencoded({ extended: true }));
    arr.push(express.json({ limit: '10mb' }));
  }

  arr.push(methodOverride())

  return arr;
};