
import path from "path";
import * as Defaults from "../../../src/server/defaults";
import * as ParamTypes from '../../../src/server/types/param.types';
import { getValidStore } from '../../../src/server/utils/validators';
import { invalidInputChecks } from '../Helpers';


export const shouldGetValidStore = () => {
  describe('getValidStore() : ', () => {

    describe('should return Default store on invalid input', () => {
      test.each(invalidInputChecks(Defaults.Store))('If %s is passed', (_condition, input, expected) => {
        const store = getValidStore(input as ParamTypes.Store);
        expect(store).toEqual(expected);
      });
    });

    describe('should return custom store from a valid Path string', () => {

      const jsFile = require("../../mock/store/store.js");
      const jsonFile = require("../../mock/store/store.json");

      test.each([
        ["valid .js file", "./store.js", jsFile],
        ["valid .json file", "./store.json", jsonFile],
        ["valid folder", "./", { ...jsFile, ...jsonFile }],
      ])('If %s path is passed', (_condition, storePath, expected) => {
        const store = getValidStore(storePath as string, path.join(__dirname, "../../mock/store"));
        expect(store).toEqual(expected);
      });
    });
  });
}