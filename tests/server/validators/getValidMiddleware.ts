import path from "path";
import * as Defaults from '../../../src/defaults';
import * as ParamTypes from '../../../src/types/param.types';
import { getValidMiddlewares } from '../../../src/utils/validators';
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
      delete expectedMiddleware.dummy; // deletes it since its not a functions
      expectedMiddleware.globals = [expectedMiddleware.globals[0]] // filters to only function

      test.each([
        ["invalid .json file", "/middlewares.json", Defaults.Middlewares],
        ["valid .js file", "./middlewares.js", expectedMiddleware],
        ["valid folder", "./", expectedMiddleware],
      ])('If %s path is passed', (_condition, middlewaresPath, expected) => {
        const root = path.join(__dirname, "../../mock/middlewares");
        const middlewares = getValidMiddlewares(middlewaresPath as string, { root });
        expect(middlewares).toEqual(expected);
      });
    });
  });
}
