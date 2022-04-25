
import path from "path";
import { MockServer } from "../../../src/server/index";
import { invalidInputChecks } from '../Helpers';

export const getValidStore = () => {
  describe('mockServer.getValidStore() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => { mockServer = MockServer.Create() });
    afterEach(async () => { await MockServer.Destroy() });

    describe('should return Default store on invalid input', () => {
      test.each(invalidInputChecks({}))('If %s is passed', (_condition, input, expected) => {
        const store = mockServer.getValidStore(input as any);
        expect(store).toEqual(expected);
      });
    });

    describe('should return custom store from a valid Path string', () => {

      const jsFile = require("../../mock/store/store.js");
      const jsonFile = require("../../mock/store/store.json");

      test.each([
        ["valid .js file", "./store.js", jsFile],
        ["valid .json file", "/store.json", jsonFile],
        ["valid folder", "./", { ...jsFile, ...jsonFile }],
      ])('If %s path is passed', (_condition, input, expected) => {
        const storePath = path.join(__dirname, "../../mock/store", input as string)
        const store = mockServer.getValidStore(storePath);
        expect(store).toEqual(expected);
      });
    });
  });
}