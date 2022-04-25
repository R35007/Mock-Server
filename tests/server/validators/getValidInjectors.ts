import path from "path";
import { MockServer } from '../../../src/server';
import { invalidInputChecks } from '../Helpers';

export const getValidInjectors = () => {
  describe('mockServer.getValidInjectors() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => { mockServer = MockServer.Create() });
    afterEach(async () => { await MockServer.Destroy() });

    describe('should return Default Injectors on invalid input', () => {
      test.each(invalidInputChecks([]))('If %s is passed', (_condition, input, expected) => {
        const injectors = mockServer.getValidInjectors(input as any);
        expect(injectors).toEqual(expected);
      });
    });

    describe('should return custom Injectors from a valid Path string', () => {

      const jsFile = require("../../mock/injectors/injectors.js");
      const jsonFile = require("../../mock/injectors/injectors.json");

      test.each([
        ["valid .js file", "./injectors.js", jsFile],
        ["valid .json file", "/injectors.json", jsonFile],
        ["valid folder", "./", [...jsFile, ...jsonFile]],
      ])('If %s path is passed', (_condition, input, expected) => {
        const injectorsPath = path.join(__dirname, "../../mock/injectors", input as string)
        const injectors = mockServer.getValidInjectors(injectorsPath);
        expect(injectors).toEqual(expected);
      });
    });
  });
}