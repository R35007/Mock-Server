
import path from "path";
import { MockServer } from "../../../src/server/index";
import { invalidInputChecks } from '../Helpers';

export const getValidDb = () => {
  describe('mockServer.getValidDb() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => { mockServer = MockServer.Create() });
    afterEach(async () => { await MockServer.Destroy() });

    describe('should return Default db on invalid input', () => {
      test.each(invalidInputChecks({}))('If %s is passed', (_condition, dbInput, expected) => {
        const db = mockServer.getValidDb(dbInput as any);
        expect(db).toEqual(expected);
      });
    });

    describe('should return custom db from a valid Path string', () => {
      const jsFile = require("../../mock/db/db.js");
      const jsonFile = require("../../mock/db/db.json");

      test.each([
        ["valid .js file", "./db.js", jsFile],
        ["valid .json file", "/db.json", jsonFile],
        ["valid folder", "./", { ...jsFile, ...jsonFile }],
      ])('If %s path is passed', (_condition, dbInput, expected) => {
        const storePath = path.join(__dirname, "../../mock/db", dbInput as string)
        const db = mockServer.getValidDb(storePath);
        expect(db).toEqual(expected);
      });
    });

    describe('should return valid db', () => {
      test.each([
        ["direct string", { post: "Working" }, { "/post": { _config: true, id: "1", mock: "Working" } }],
        ["direct object", { post: { id: "1", name: "Siva" } }, { "/post": { _config: true, id: "1", mock: { id: "1", name: "Siva" } } }],
        ["direct List", { posts: [{ id: "1", name: "Siva" }] }, { "/posts": { _config: true, id: "1", mock: [{ id: "1", name: "Siva" }] } }],
        ["multiple routes", { "/post1,/post2": { id: "1", name: "Siva" } }, {
          "/post1": { _config: true, id: "1", mock: { id: "1", name: "Siva" } },
          "/post2": { _config: true, id: "2", mock: { id: "1", name: "Siva" } }
        }],
        ["multiple routes overallaping", { "/post1,/post2": { id: "1", name: "Siva" }, "/post1": { id: "1", name: "Ram" } }, {
          "/post1": { _config: true, id: "3", mock: { id: "1", name: "Ram" } },
          "/post2": { _config: true, id: "2", mock: { id: "1", name: "Siva" } }
        }],
        ["no id", { "/post": { _config: true, mock: "Working" } }, { "/post": { _config: true, id: "1", mock: "Working" } }],
        ["id", { "/post": { _config: true, id: "1", mock: "Working" } }, { "/post": { _config: true, id: "1", mock: "Working" } }],
        ["no slash prefix for route", { "post,comment": "Working" }, {
          "/post": { _config: true, id: "1", mock: "Working" },
          "/comment": { _config: true, id: "2", mock: "Working" },
        }],
      ])('If db with %s', (_condition, input, expected) => {
        const db = mockServer.getValidDb(input);
        expect(db).toEqual(expected);
      });
    });

    describe('Db with Injectors', () => {
      it.each([
        [
          "inject delay only to post",
          { "post,comment": "Working" },
          [{ routes: ["/post"], delay: 1000 }],
          { "/post": { _config: true, id: "1", delay: 1000, mock: "Working" }, "/comment": { _config: true, id: "2", mock: "Working" } }
        ],
        [
          "inject delay to all routes and not override the exisitng delay",
          { "post,comment": "Working", "user": { _config: true, delay: 2000, mock: "Working" } },
          [{ routes: ["/(.*)"], delay: 1000 }],
          {
            "/post": { _config: true, id: "1", delay: 1000, mock: "Working" },
            "/comment": { _config: true, id: "2", delay: 1000, mock: "Working" },
            "/user": { _config: true, id: "3", delay: 2000, mock: "Working" }
          }
        ],
        [
          "inject delay to all routes and override the exisitng delay",
          { "post,comment": "Working", "user": { _config: true, delay: 2000, mock: "Working" } },
          [{ routes: ["/(.*)"], delay: 1000, override: true }],
          {
            "/post": { _config: true, id: "1", delay: 1000, mock: "Working" },
            "/comment": { _config: true, id: "2", delay: 1000, mock: "Working" },
            "/user": { _config: true, id: "3", delay: 1000, mock: "Working" }
          }
        ],
        [
          "inject statusCode only to exact matching routes",
          {
            "/post/1": { _config: true, id: "1", mock: "Working" },
            "/post/2": { _config: true, id: "2", mock: "Working" },
            "/post/:id": { _config: true, id: "3", mock: "Working" }
          },
          [{ routes: ["/post/:id"], statusCode: 500, exact: true }],
          {
            "/post/1": { _config: true, id: "1", mock: "Working" },
            "/post/2": { _config: true, id: "2", mock: "Working" },
            "/post/:id": { _config: true, id: "3", mock: "Working", statusCode: 500 }
          },
        ],
        [
          "inject statusCode all pattern matching routes",
          {
            "/post/1": { _config: true, id: "1", mock: "Working" },
            "/post/2": { _config: true, id: "2", mock: "Working" },
            "/post/3/comment": { _config: true, id: "3", mock: "Working" }
          },
          [{ routes: ["/post/:id(.*)"], statusCode: 500 }],
          {
            "/post/1": { _config: true, id: "1", mock: "Working", statusCode: 500 },
            "/post/2": { _config: true, id: "2", mock: "Working", statusCode: 500 },
            "/post/3/comment": { _config: true, id: "3", mock: "Working", statusCode: 500 }
          },
        ],
        [
          "inject middlewareNames and override the existing middlewareNames",
          {
            "/post": { _config: true, id: "1", mock: "Working", middlewareNames: ["_MockOnly"] },
          },
          [{ routes: ["/post"], middlewareNames: ["_ReadOnly"] }],
          {
            "/post": { _config: true, id: "1", mock: "Working", middlewareNames: ["_ReadOnly"] },
          },
        ],
        [
          "inject middlewareNames and merge the existing middlewareNames",
          {
            "/post": { _config: true, id: "1", mock: "Working", middlewareNames: ["_MockOnly"] },
          },
          [{ routes: ["/post"], middlewareNames: ["...", "_ReadOnly"] }],
          {
            "/post": { _config: true, id: "1", mock: "Working", middlewareNames: ["_MockOnly", "_ReadOnly"] },
          },
        ],
      ])('should %s', (_condition, dbInput, injectorInput, expected) => {
        const db = mockServer.getValidDb(dbInput, injectorInput);
        expect(db).toEqual(expected);
      });
    });
  });
}