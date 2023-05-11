import path from 'path';
import * as Defaults from '../../../src/defaults';
import * as ParamTypes from '../../../src/types/param.types';
import { getValidInjectors } from '../../../src/utils/validators';
import { invalidInputChecks } from '../Helpers';

describe('getValidInjectors() : ', () => {
  describe('should return Default Injectors on invalid input', () => {
    test.each(invalidInputChecks(Defaults.Injectors))('If %s is passed', (_condition, input, expected) => {
      const injectors = getValidInjectors(input as ParamTypes.Injectors);
      expect(injectors).toEqual(expected);
    });
  });

  describe('should return custom Injectors from a valid Path string', () => {
    const jsFile = require('../../mock/injectors/injectors.js');
    jsFile[0].routes = [jsFile[0].routes]; // always give list for routes
    const jsonFile = require('../../mock/injectors/injectors.json');

    test.each([
      ['valid .js file', './injectors.js', jsFile],
      ['valid .json file', './injectors.json', jsonFile],
      ['valid folder', './', [...jsFile, ...jsonFile]],
    ])('If %s path is passed', (_condition, injectorsPath, expected) => {
      const root = path.join(__dirname, '../../mock/injectors');
      const injectors = getValidInjectors(injectorsPath as string, { root });
      expect(injectors).toEqual(expected);
    });
  });

  describe('should return valid Injectors', () => {
    const testMiddleware = () => {};
    test.each([
      ['routes is not a list', [{ routes: '/posts', delay: 1000 }], [{ routes: ['/posts'], delay: 1000 }]],
      [
        'middlewares is not a list',
        [{ routes: '/posts', middlewares: testMiddleware }],
        [{ routes: ['/posts'], middlewares: [testMiddleware] }],
      ],
      ['middlewares is not given', [{ routes: '/posts' }], [{ routes: ['/posts'] }]],
      ['middlewares is an empty list', [{ routes: '/posts', middlewares: [] }], [{ routes: ['/posts'], middlewares: [] }]],
    ])('If %s', (_condition, testInjectors, expected) => {
      const injectors = getValidInjectors(testInjectors as ParamTypes.Injectors);
      expect(injectors).toEqual(expected);
    });
  });
});
