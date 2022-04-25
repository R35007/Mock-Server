
import path from "path";
import { MockServer } from "../../../src/server/index";
import { invalidInputChecks } from '../Helpers';

export const getValidRewriters = () => {
  describe('mockServer.getValidRewriters() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => { mockServer = MockServer.Create() });
    afterEach(async () => { await MockServer.Destroy() });

    describe('should return Default rewriters on invalid input', () => {
      test.each(invalidInputChecks({}))('If %s is passed', (_condition, input, expected) => {
        const rewriters = mockServer.getValidRewriters(input as any);
        expect(rewriters).toEqual(expected);
      });
    });

    describe('should return custom rewriters from a valid Path string', () => {

      const jsFile = require("../../mock/rewriters/rewriters.js");
      const jsonFile = require("../../mock/rewriters/rewriters.json");

      test.each([
        ["valid .js file", "./rewriters.js", jsFile],
        ["valid .json file", "/rewriters.json", jsonFile],
        ["valid folder", "./", { ...jsFile, ...jsonFile }],
      ])('If %s path is passed', (_condition, input, expected) => {
        const storePath = path.join(__dirname, "../../mock/rewriters", input as string)
        const rewriters = mockServer.getValidRewriters(storePath);
        expect(rewriters).toEqual(expected);
      });
    });
  });
}