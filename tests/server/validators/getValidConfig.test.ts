import ip from 'ip';
import path from 'path';
import * as Defaults from '../../../src/defaults';
import * as ParamTypes from '../../../src/types/param.types';
import { getValidConfig } from '../../../src/utils/validators';
import { invalidInputChecks } from '../Helpers';

describe('getValidConfig() : ', () => {
  describe('should return Default Config on invalid input', () => {
    test.each(invalidInputChecks(Defaults.Config))('If %s is passed', (_condition, input, expected) => {
      const config = getValidConfig(input as ParamTypes.Config);
      expect(config).toEqual(expected);
    });
  });

  describe('should return custom Config from a valid Path string', () => {
    const jsFile = require('../../mock/config/config.js');
    const jsonFile = require('../../mock/config/config.json');

    test.each([
      ['valid .js file', './config.js', jsFile],
      ['valid .json file', './config.json', jsonFile],
      ['valid folder', './', { ...jsFile, ...jsonFile }],
    ])('If %s path is passed', (_condition, configPath, expected) => {
      const root = path.join(__dirname, '../../mock/config');
      const config = getValidConfig(configPath as string, { root });
      expect(config).toEqual(expected);
    });
  });

  describe('should return a valid Config', () => {
    test.each([
      [
        'root path is not a directory',
        { root: path.resolve(__dirname, '../../mock/config/config.json') },
        { root: decodeURIComponent(path.resolve(__dirname, '../../../')) },
      ],
      ['root path is a directory', { root: path.join(__dirname, '../../mock') }, { root: path.join(__dirname, '../../mock') }],
      ['port is not a number', { port: '' }, {}],
      ['port is a number string', { port: '4000' }, { port: 4000 }],
      ['port is a number', { port: 4000 }, { port: 4000 }],
      ['base is empty string', { base: '' }, {}],
      ["base is '/' ", { base: '/' }, {}],
      ["base is '/api' ", { base: '/api' }, { base: '/api' }],
      ['static is a empty string', { static: '' }, { static: '' }],
      [
        'static is not a valid path',
        { root: path.join(__dirname, '../../mock'), static: '/mock' },
        { root: path.join(__dirname, '../../mock'), static: 'C:\\mock' },
      ],
      [
        'static is a valid path',
        { root: path.join(__dirname, '../../mock'), static: '../../public' },
        { root: path.join(__dirname, '../../mock'), static: path.join(__dirname, '../../mock', '../../public') },
      ],
      ['host is a empty string', { host: '' }, { host: ip.address() }],
      ['host is not a string', { host: 129 }, {}],
      ['host is a string', { host: 'localhost' }, { host: 'localhost' }],
    ])('If %s', (_condition, input, expected) => {
      const config = getValidConfig(input as ParamTypes.Config);
      expect(config).toEqual(expected);
    });
  });
});
