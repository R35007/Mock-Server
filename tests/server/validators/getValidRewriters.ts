
import path from "path";
import * as Defaults from "../../../src/server/defaults";
import * as ParamTypes from '../../../src/server/types/param.types';
import { getValidRewriters } from '../../../src/server/utils/validators';
import { invalidInputChecks } from '../Helpers';


export const shouldGetValidRewriters = () => {
  describe('getValidRewriters() : ', () => {

    describe('should return Default rewriters on invalid input', () => {
      test.each(invalidInputChecks(Defaults.Rewriters))('If %s is passed', (_condition, input, expected) => {
        const rewriters = getValidRewriters(input as ParamTypes.Rewriters);
        expect(rewriters).toEqual(expected);
      });
    });

    describe('should return custom rewriters from a valid Path string', () => {

      const jsFile = require("../../mock/rewriters/rewriters.js");
      const jsonFile = require("../../mock/rewriters/rewriters.json");

      test.each([
        ["valid .js file", "./rewriters.js", jsFile],
        ["valid .json file", "./rewriters.json", jsonFile],
        ["valid folder", "./", { ...jsFile, ...jsonFile }],
      ])('If %s path is passed', (_condition, rewritersPath, expected) => {
        const rewriters = getValidRewriters(rewritersPath as string, path.join(__dirname, "../../mock/rewriters"));
        expect(rewriters).toEqual(expected);
      });
    });
  });
}