import path from "path";
import * as Defaults from '../../../src/server/defaults';
import * as ParamTypes from '../../../src/server/types/param.types';
import { getValidMiddlewares } from '../../../src/server/utils/validators';
import { invalidInputChecks } from '../Helpers';

export const shouldGetValidMiddleware = () => {
  describe('getValidMiddlewares() : ', () => {

    describe('should return Default Middlewares on invalid input', () => {
      test.each(invalidInputChecks(Defaults.Middlewares))('If %s is passed', (_condition, input, expected) => {
        const middlewares = getValidMiddlewares(input as ParamTypes.Middlewares);
        expect(middlewares).toEqual(expected);
      });
    });

    describe('should return custom Middlewares from a valid Path string', () => {
      const expectedMiddleware = { ...Defaults.Middlewares, ...require("../../mock/middlewares/middlewares.js") };
      delete expectedMiddleware.dummy; // deletes it sinces its not a functions
      expectedMiddleware._globals = [expectedMiddleware._globals[0]] // filters to only function

      test.each([
        ["invalid .json file", "/middlewares.json", Defaults.Middlewares],
        ["valid .js file", "./middlewares.js", expectedMiddleware],
        ["valid folder", "./", expectedMiddleware],
      ])('If %s path is passed', (_condition, middlewaresPath, expected) => {
        const middlewares = getValidMiddlewares(middlewaresPath as string, path.join(__dirname, "../../mock/middlewares"));
        expect(middlewares).toEqual(expected);
      });
    });
  });
}