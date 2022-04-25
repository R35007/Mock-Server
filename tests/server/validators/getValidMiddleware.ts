import path from "path";
import { MockServer } from '../../../src/server';
import Default_Middlewares from '../../../src/server/middlewares';
import { invalidInputChecks } from '../Helpers';

export const getValidMiddleware = () => {
  describe('mockServer.getValidMiddleware() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => { mockServer = MockServer.Create() });
    afterEach(async () => { await MockServer.Destroy() });

    describe('should return Default Middlewares on invalid input', () => {
      test.each(invalidInputChecks(Default_Middlewares))('If %s is passed', (_condition, input, expected) => {
        const middlewares = mockServer.getValidMiddleware(input as any);
        expect(middlewares).toEqual(expected);
      });
    });

    describe('should return custom Middlewares from a valid Path string', () => {

      const expectedMiddleware = { ...Default_Middlewares, ...require("../../mock/middlewares/middlewares.js") };
      delete expectedMiddleware.dummy; // deletes it sinces its not a functions
      expectedMiddleware._globals = [expectedMiddleware._globals[0]] // filters to only function

      test.each([
        ["invalid .json file", "/middlewares.json", Default_Middlewares],
        ["valid .js file", "./middlewares.js", expectedMiddleware],
        ["valid folder", "./", expectedMiddleware],
      ])('If %s path is passed', (_condition, input, expected) => {
        const middlewarePath = path.join(__dirname, "../../mock/middlewares", input as string)
        const middlewares = mockServer.getValidMiddleware(middlewarePath);
        expect(middlewares).toEqual(expected);
      });
    });
  });
}