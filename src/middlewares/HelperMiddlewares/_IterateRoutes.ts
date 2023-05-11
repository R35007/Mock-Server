import chalk from 'chalk';
import * as _ from 'lodash';
import type { Locals } from '../../types/common.types';

export const _IterateRoutes = (req, res, next) => {
  const storeKey = '_IterateRoutes';
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  routeConfig.store = _.isPlainObject(routeConfig.store) ? routeConfig.store : {};
  const store = routeConfig.store || {};

  if (!Array.isArray(locals.data)) {
    console.error(chalk.red('To use ') + chalk.yellowBright('_IterateRoutes') + chalk.red(' method the data must be of type Array'));
    return next();
  }

  if (!store[storeKey]?.nextIndex || store[storeKey].nextIndex > locals.data.length - 1) {
    store[storeKey] = { currentIndex: -1, nextIndex: 0 };
  }

  req.url = locals.data[store[storeKey].nextIndex];
  store[storeKey].currentIndex++;
  store[storeKey].nextIndex++;

  next('route');
};
