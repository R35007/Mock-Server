
import path from "path";
import * as Defaults from "../../../src/defaults";
import * as ParamTypes from "../../../src/types/param.types";
import { toBase64 } from '../../../src/utils';
import { getValidDb } from "../../../src/utils/validators";
import { invalidInputChecks } from '../Helpers';

export const shouldGetValidDb = () => {
  describe('getValidDb() : ', () => {

    describe('should return Default db on invalid input', () => {
      test.each(invalidInputChecks(Defaults.Db))('If %s is passed', (_condition, dbInput, expected) => {
        const db = getValidDb(dbInput as ParamTypes.Db);
        expect(db).toEqual(expected);
      });
    });

    describe('should return custom db from a valid Path string', () => {
      const jsFile = require("../../mock/db/db.js");
      delete jsFile["/comment"].middlewares; //deletes /comments middleware since its empty
      const jsonFile = require("../../mock/db/db.json");

      test.each([
        ["valid .js file", "./db.js", jsFile],
        ["valid .json file", "./db.json", jsonFile],
        ["valid folder", "./", { ...jsFile, ...jsonFile }],
      ])('If %s path is passed', (_condition, dbPath, expected) => {


        const root = path.join(__dirname, "../../mock/db");
        const db = getValidDb(dbPath as string, { root });
        expect(db).toEqual(expected);
      });
    });

    describe('should return valid db', () => {

      test('If db with direct response string', () => {
        const db = { post: "Working" };
        const expectedDb = { "/post": { _config: true, id: toBase64("/post"), mock: "Working" } };
        const validDb = getValidDb(db as ParamTypes.Db);
        expect(validDb).toEqual(expectedDb);
      });

      test('If db with direct response object', () => {
        const db = { post: { id: "1", name: "Siva" } };
        const expectedDb = { "/post": { _config: true, id: toBase64("/post"), mock: { id: "1", name: "Siva" } } };
        const validDb = getValidDb(db as ParamTypes.Db);
        expect(validDb).toEqual(expectedDb);
      });

      test('If db with direct response List', () => {
        const db = { posts: [{ id: "1", name: "Siva" }] };
        const expectedDb = { "/posts": { _config: true, id: toBase64("/posts"), mock: [{ id: "1", name: "Siva" }] } };
        const validDb = getValidDb(db as ParamTypes.Db);
        expect(validDb).toEqual(expectedDb);
      });

      test('If db with config', () => {
        const db = { post: { _config: true, id: 1, mock: { id: "1", name: "Siva" }, description: "testing" } };
        const expectedDb = { "/post": { _config: true, id: "1", mock: { id: "1", name: "Siva" }, description: "testing" } };
        const validDb = getValidDb(db as ParamTypes.Db);
        expect(validDb).toEqual(expectedDb);
      });

      test('If db with single middlewares', () => {
        const testMiddleware = () => { };
        const db = { post: { _config: true, id: 1, mock: { id: "1", name: "Siva" }, middlewares: testMiddleware } };
        const expectedDb = { "/post": { _config: true, id: "1", mock: { id: "1", name: "Siva" }, middlewares: [testMiddleware] } };
        const validDb = getValidDb(db as ParamTypes.Db);
        expect(validDb).toEqual(expectedDb);
      });

      test('If db with multiple middlewares', () => {
        const testMiddleware = () => { };
        const db = { post: { _config: true, id: 1, mock: { id: "1", name: "Siva" }, middlewares: ["_MockOnly", testMiddleware] } };
        const expectedDb = { "/post": { _config: true, id: "1", mock: { id: "1", name: "Siva" }, middlewares: ["_MockOnly", testMiddleware] } };
        const validDb = getValidDb(db as ParamTypes.Db);
        expect(validDb).toEqual(expectedDb);
      });

      test('If db with empty middlewares', () => {
        const db = { post: { _config: true, id: 1, mock: { id: "1", name: "Siva" }, middlewares: [] } };
        const expectedDb = { "/post": { _config: true, id: "1", mock: { id: "1", name: "Siva" } } };
        const validDb = getValidDb(db as ParamTypes.Db);
        expect(validDb).toEqual(expectedDb);
      });

      test('If db without middlewares', () => {
        const db = { post: { _config: true, id: 1, mock: { id: "1", name: "Siva" } } };
        const expectedDb = { "/post": { _config: true, id: "1", mock: { id: "1", name: "Siva" } } };
        const validDb = getValidDb(db as ParamTypes.Db);
        expect(validDb).toEqual(expectedDb);
      });

      test('If db with comma separated routes', () => {
        const db = { "/post1,/post2": { id: "1", name: "Siva" } };
        const expectedDb = {
          "/post1": { _config: true, id: toBase64("/post1"), mock: { id: "1", name: "Siva" } },
          "/post2": { _config: true, id: toBase64("/post2"), mock: { id: "1", name: "Siva" } }
        };
        const validDb = getValidDb(db as ParamTypes.Db);
        expect(validDb).toEqual(expectedDb);
      });

      test('If db with comma separated routes and overriding rotes', () => {
        const db = {
          "/post1,/post2": { id: "1", name: "Siva" },
          "/post1": { id: "1", name: "Ram", age: 27 }
        };
        const expectedDb = {
          "/post2": { _config: true, id: toBase64("/post2"), mock: { id: "1", name: "Siva" } },
          "/post1": { _config: true, id: toBase64("/post1"), mock: { id: "1", name: "Ram", age: 27 } },
        };
        const validDb = getValidDb(db as ParamTypes.Db);
        expect(validDb).toEqual(expectedDb);
      });

      test('If db with no id', () => {
        const db = { "/post": { _config: true, mock: "Working" } };
        const expectedDb = { "/post": { _config: true, id: toBase64("/post"), mock: "Working" } };
        const validDb = getValidDb(db as ParamTypes.Db);
        expect(validDb).toEqual(expectedDb);
      });

      test('If db with custom id', () => {
        const db = { "/post": { _config: true, id: 1, mock: "Working" } };
        const expectedDb = { "/post": { _config: true, id: "1", mock: "Working" } };
        const validDb = getValidDb(db as ParamTypes.Db);
        expect(validDb).toEqual(expectedDb);
      });

      test('If db without slash prefix for route path', () => {
        const db = { "post,comment": "Working" };
        const expectedDb = {
          "/post": { _config: true, id: toBase64("/post"), mock: "Working" },
          "/comment": { _config: true, id: toBase64("/comment"), mock: "Working" },
        };
        const validDb = getValidDb(db as ParamTypes.Db);
        expect(validDb).toEqual(expectedDb);
      });
    });

    describe('Db with Injectors', () => {

      it('should inject delay only to post', () => {
        const db = { "post,comment": "Working" };
        const injectors = [{ routes: ["/post"], delay: 1000 }];
        const expectedDb = {
          "/post": { _config: true, id: toBase64("/post"), delay: 1000, mock: "Working" },
          "/comment": { _config: true, id: toBase64("/comment"), mock: "Working" }
        }
        const validDb = getValidDb(db, { injectors });
        expect(validDb).toEqual(expectedDb);
      });

      it('should inject delay to all routes and not override the existing delay', () => {
        const db = { "post,comment": "Working", "user": { _config: true, delay: 2000, mock: "Working" } };
        const injectors = [{ routes: ["/(.*)"], delay: 1000 }];
        const expectedDb = {
          "/post": { _config: true, id: toBase64("/post"), delay: 1000, mock: "Working" },
          "/comment": { _config: true, id: toBase64("/comment"), delay: 1000, mock: "Working" },
          "/user": { _config: true, id: toBase64("/user"), delay: 2000, mock: "Working" }
        }
        const validDb = getValidDb(db, { injectors });
        expect(validDb).toEqual(expectedDb);
      });

      it('should inject delay to all routes and override the existing delay', () => {
        const db = { "post,comment": "Working", "user": { _config: true, delay: 2000, mock: "Working" } };
        const injectors = [{ routes: ["/(.*)"], delay: 1000, override: true }];
        const expectedDb = {
          "/post": { _config: true, id: toBase64("/post"), delay: 1000, mock: "Working" },
          "/comment": { _config: true, id: toBase64("/comment"), delay: 1000, mock: "Working" },
          "/user": { _config: true, id: toBase64("/user"), delay: 1000, mock: "Working" }
        }
        const validDb = getValidDb(db, { injectors });
        expect(validDb).toEqual(expectedDb);
      });

      it('should inject statusCode only to exact matching routes', () => {
        const db = {
          "/post/1": { _config: true, id: "1", mock: "Working" },
          "/post/2": { _config: true, id: "2", mock: "Working" },
          "/post/:id": { _config: true, id: "3", mock: "Working" }
        };
        const injectors = [{ routes: ["/post/:id"], statusCode: 500, exact: true }];
        const expectedDb = {
          "/post/1": { _config: true, id: "1", mock: "Working" },
          "/post/2": { _config: true, id: "2", mock: "Working" },
          "/post/:id": { _config: true, id: "3", mock: "Working", statusCode: 500 }
        }
        const validDb = getValidDb(db, { injectors });
        expect(validDb).toEqual(expectedDb);
      });

      it('should inject statusCode all pattern matching routes', () => {
        const db = {
          "/post/1": { _config: true, id: "1", mock: "Working" },
          "/post/2": { _config: true, id: "2", mock: "Working" },
          "/post/3/comment": { _config: true, id: "3", mock: "Working" }
        };
        const injectors = [{ routes: ["/post/:id"], statusCode: 500 }];
        const expectedDb = {
          "/post/1": { _config: true, id: "1", mock: "Working", statusCode: 500 },
          "/post/2": { _config: true, id: "2", mock: "Working", statusCode: 500 },
          "/post/3/comment": { _config: true, id: "3", mock: "Working" }
        };
        const validDb = getValidDb(db, { injectors });
        expect(validDb).toEqual(expectedDb);
      });

      it('should inject middlewares and override the existing middlewares', () => {
        const db = { "/post": { _config: true, id: "1", mock: "Working", middlewares: ["_MockOnly"] } };
        const injectors = [{ routes: ["/post"], middlewares: ["_ReadOnly"] }];
        const expectedDb = { "/post": { _config: true, id: "1", mock: "Working", middlewares: ["_ReadOnly"] } };
        const validDb = getValidDb(db, { injectors });
        expect(validDb).toEqual(expectedDb);
      });

      it('should inject middlewares and merge the existing middlewares', () => {
        const db = { "/post": { _config: true, id: "1", mock: "Working", middlewares: ["_MockOnly"] } };
        const injectors = [{ routes: ["/post"], middlewares: ["...", "_ReadOnly"] }];
        const expectedDb = { "/post": { _config: true, id: "1", mock: "Working", middlewares: ["_MockOnly", "_ReadOnly"] } };
        const validDb = getValidDb(db, { injectors });
        expect(validDb).toEqual(expectedDb);
      });

      it('should inject middlewares and merge the existing middlewares', () => {
        const db = { "/post": { _config: true, id: "1", mock: "Working", middlewares: ["_MockOnly"] } };
        const injectors = [{ routes: ["/post"], middlewares: ["...", "_ReadOnly"] }];
        const expectedDb = { "/post": { _config: true, id: "1", mock: "Working", middlewares: ["_MockOnly", "_ReadOnly"] } };
        const validDb = getValidDb(db, { injectors });
        expect(validDb).toEqual(expectedDb);
      });

      it('should inject empty middlewares and remove existing middlewares', () => {
        const db = { "/post": { _config: true, id: "1", mock: "Working", middlewares: ["_MockOnly"] } };
        const injectors = [{ routes: ["/post"], middlewares: [] }];
        const expectedDb = { "/post": { _config: true, id: "1", mock: "Working" } };
        const validDb = getValidDb(db, { injectors });
        expect(validDb).toEqual(expectedDb);
      });
    });
  });
}
