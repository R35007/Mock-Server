import path from "path";
import request from 'supertest';
import { MockServer } from '../../../src/server';


export const routeConfig = () => {
  describe('Testing all Route Configs', () => {
    let mockServer: MockServer;

    beforeAll(async () => { await MockServer.Destroy() });
    beforeEach(() => { mockServer = MockServer.Create({ root: path.join(__dirname, "../../../") }) });
    afterEach(async () => { await MockServer.Destroy() });
    afterAll(async () => { await MockServer.Destroy() });

    it('should get string response', async () => {
      const mock = "Working !"
      const db = { "/Hi": mock }
      await mockServer.launchServer(db);
      const response = await request(mockServer.app).get("/Hi");
      expect(response.text).toBe(mock);
      expect(response.statusCode).toBe(200)
      expect(response.type).toBe("text/html");
    });

    it('should get string response if a mock is a number', async () => {
      const db = { "/Hi": 1234 }
      await mockServer.launchServer(db);
      const response = await request(mockServer.app).get("/Hi");
      expect(response.text).toBe("1234");
      expect(typeof response.text).toBe("string");
      expect(response.statusCode).toBe(200)
      expect(response.type).toBe("text/html");
    });

    it('should get json object response', async () => {
      const mock = { id: "1", name: "Siva" };
      const db = { "/user": mock };
      await mockServer.launchServer(db);
      const response = await request(mockServer.app).get("/user");
      expect(response.body).toEqual(mock);
      expect(response.statusCode).toBe(200);
      expect(response.type).toEqual('application/json');
    });

    it('should get list response', async () => {
      const mock = [{ id: "1", name: "Siva" }];
      const db = { "/users": mock };
      await mockServer.launchServer(db);
      const response = await request(mockServer.app).get("/users");
      expect(response.body).toEqual(mock);
      expect(response.statusCode).toBe(200);
      expect(response.type).toEqual('application/json');
    });

    it('should get response with delay 2s', async () => {
      const mock = { id: "1", name: "Siva" };
      const db = { "/user": { _config: true, delay: 2000, mock } };
      await mockServer.launchServer(db);
      const response = await request(mockServer.app).get("/user");
      const responseTime = parseInt(response.header["x-response-time"]);
      expect(responseTime).toBeGreaterThan(2000);
    });

    it('should get response with statusCode 500', async () => {
      const mock = { id: "1", name: "Siva" };
      const db = { "/user": { _config: true, statusCode: 500, mock } };
      await mockServer.launchServer(db);
      const response = await request(mockServer.app).get("/user");
      expect(response.statusCode).toBe(500);
    });

    it('should fetch data from file path', async () => {
      const db = { "/users": { _config: true, fetch: "./src/samples/data/users.json" } }
      await mockServer.launchServer(db);
      const response = await request(mockServer.app).get("/users");
      expect(response.body).toEqual(require("../../../src/samples/data/users.json"));
    });

    it('should fetch data from http url', async () => {
      const mock = { id: "1", name: "Siva" };
      const db = { "/user/1": mock, "/customer/:id": { _config: true, fetch: "http://${config.host}:${config.port}/user/${req.params.id}" } }
      await mockServer.launchServer(db);
      const response = await request(mockServer.app).get("/customer/1");
      expect(response.body).toEqual(mock);
    });

    it('should fetch data only once', async () => {
      const mock = [{ id: "1", name: "Siva" }, { id: "2", name: "Ram" }, { id: "3", name: "Harish" }];
      const db = {
        "/user": { _config: true, mock, middlewares: ["_IterateResponse"] },
        "/customer": { _config: true, fetch: "http://${config.host}:${config.port}/user" }
      }
      await mockServer.launchServer(db);
      expect((await request(mockServer.app).get("/customer")).body).toEqual(mock[0]);
      expect((await request(mockServer.app).get("/customer")).body).toEqual(mock[0]);
    });

    it('should fetch data from http url not more than twice', async () => {
      const mock = [{ id: "1", name: "Siva" }, { id: "2", name: "Ram" }, { id: "3", name: "Harish" }];
      const db = {
        "/user": { _config: true, mock, middlewares: ["_IterateResponse"] },
        "/customer": { _config: true, fetch: "http://${config.host}:${config.port}/user", fetchCount: 2 }
      }
      await mockServer.launchServer(db);
      expect((await request(mockServer.app).get("/customer")).body).toEqual(mock[0]);
      expect((await request(mockServer.app).get("/customer")).body).toEqual(mock[1]);
      expect((await request(mockServer.app).get("/customer")).body).toEqual(mock[1]);
    });

    it('should fetch data from http url infinite times', async () => {
      const mock = [{ id: "1", name: "Siva" }, { id: "2", name: "Ram" }, { id: "3", name: "Harish" }];
      const db = {
        "/user": { _config: true, mock, middlewares: ["_IterateResponse"] },
        "/customer": { _config: true, fetch: "http://${config.host}:${config.port}/user", fetchCount: -1 }
      }
      await mockServer.launchServer(db);
      expect((await request(mockServer.app).get("/customer")).body).toEqual(mock[0]);
      expect((await request(mockServer.app).get("/customer")).body).toEqual(mock[1]);
      expect((await request(mockServer.app).get("/customer")).body).toEqual(mock[2]);
      expect((await request(mockServer.app).get("/customer")).body).toEqual(mock[0]);
    });

    it('should get mock first instead of fetch', async () => {
      const users = [{ id: "1", name: "Siva" }, { id: "2", name: "Ram" }, { id: "3", name: "Harish" }];
      const mock = { data: "Its Working !" };
      const db = {
        "/user": { _config: true, mock: users, middlewares: ["_IterateResponse"] },
        "/customer": { _config: true, mock, fetch: "http://${config.host}:${config.port}/user", mockFirst: true }
      }
      await mockServer.launchServer(db);
      expect((await request(mockServer.app).get("/customer")).body).toEqual(mock);
    });

    it('should fetch instead of mock if there is no mock an mockFirst is true', async () => {
      const users = [{ id: "1", name: "Siva" }, { id: "2", name: "Ram" }, { id: "3", name: "Harish" }];
      const db = {
        "/user": { _config: true, mock: users, middlewares: ["_IterateResponse"] },
        "/customer": { _config: true, fetch: "http://${config.host}:${config.port}/user", mockFirst: true }
      }
      await mockServer.launchServer(db);
      expect((await request(mockServer.app).get("/customer")).body).toEqual(users[0]);
    });

    it('should fetch from url and show error from fetch data', async () => {
      const users = [{ id: "1", name: "Siva" }, { id: "2", name: "Ram" }, { id: "3", name: "Harish" }];
      const mock = { data: "Its Working !" };
      const db = {
        "/user": { _config: true, mock: users, middlewares: ["_IterateResponse"], statusCode: 404 },
        "/customer": { _config: true, mock, fetch: "http://${config.host}:${config.port}/user" }
      }
      await mockServer.launchServer(db);
      const response = await request(mockServer.app).get("/customer");
      expect(response.body).toEqual(users[0]);
      expect(response.statusCode).toEqual(404);
    });

    it('should mock if any error from fetch', async () => {
      const users = [{ id: "1", name: "Siva" }, { id: "2", name: "Ram" }, { id: "3", name: "Harish" }];
      const mock = { data: "Its Working !" };
      const db = {
        "/user": { _config: true, mock: users, middlewares: ["_IterateResponse"], statusCode: 404 },
        "/customer": { _config: true, mock, fetch: "http://${config.host}:${config.port}/user", skipFetchError: true }
      }
      await mockServer.launchServer(db);
      const response = await request(mockServer.app).get("/customer");
      expect(response.body).toEqual(mock);
      expect(response.statusCode).toEqual(200);
    });

    it('should run the given middleware name', async () => {
      const mock = { id: "1", name: "Siva" };
      const db = { "/user": { _config: true, middlewares: ["getUser"] } };
      const middlewares = { "getUser": (_req, res) => { res.send(mock) } }
      await mockServer.launchServer(db, { middlewares });
      const response = await request(mockServer.app).get("/user");
      expect(response.body).toEqual(mock);
      expect(response.statusCode).toEqual(200);
    });

    it('should run the given middleware', async () => {
      const mock = { id: "1", name: "Siva" };
      const db = { "/user": { _config: true, middlewares: [(_req, res) => { res.send(mock) }] } };
      await mockServer.launchServer(db);
      const response = await request(mockServer.app).get("/user");
      expect(response.body).toEqual(mock);
      expect(response.statusCode).toEqual(200);
    });
  });
}