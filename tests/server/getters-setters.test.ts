
import Default_Config from "../../src/server/config";
import { MockServer } from "../../src/server/index";
import Default_Middlewares from '../../src/server/middlewares';
import { forwardSlash } from './Helpers';

const constructor = () => {
  describe('new MockServer() : ', () => {
    it('should create with default config', async () => {
      const mockServer = new MockServer();
      expect(mockServer.data.config).toEqual(Default_Config);
    });

    it('should create with custom config', async () => {
      const mockServer = new MockServer({ root: __dirname });
      expect(mockServer.data.config).toEqual({ ...Default_Config, root: forwardSlash(__dirname) })
    });
  });
}

const setConfig = () => {
  describe('mockServer.setConfig() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => { mockServer = MockServer.Create() });
    afterEach(async () => { await MockServer.Destroy() });

    it('should set default config', async () => {
      expect(mockServer.data.config).toEqual(Default_Config);
      mockServer.setConfig();
      expect(mockServer.data.config).toEqual(Default_Config);
    });

    it('should set custom config', async () => {
      expect(mockServer.data.config).toEqual(Default_Config);
      mockServer.setConfig({ root: __dirname });
      expect(mockServer.data.config).toEqual({ ...Default_Config, root: forwardSlash(__dirname) })
    });
  });
}

const setMiddleware = () => {
  describe('mockServer.setMiddleware() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => { mockServer = MockServer.Create() });
    afterEach(async () => { await MockServer.Destroy() });

    it('should set default middlewares', async () => {
      mockServer.setMiddleware();
      expect(mockServer.data.middleware).toEqual(Default_Middlewares);
    });

    it('should set custom middlewares', async () => {
      const middleware = { "logger": () => { } }
      mockServer.setMiddleware(middleware)
      expect(mockServer.data.middleware).toEqual({ ...Default_Middlewares, ...middleware });
    });
  });
}

const setInjectors = () => {
  describe('mockServer.setInjectors() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => { mockServer = MockServer.Create() });
    afterEach(async () => { await MockServer.Destroy() });

    it('should set default injectors', async () => {
      mockServer.setInjectors();
      expect(mockServer.data.injectors).toEqual([]);
    });

    it('should set custom injectors', async () => {
      const injectors = [{ routes: ["/posts"], delay: 100 }]
      mockServer.setInjectors(injectors)
      expect(mockServer.data.injectors).toEqual(injectors);
    });
  });
}

const setDb = () => {
  describe('mockServer.setDb() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => { mockServer = MockServer.Create() });
    afterEach(async () => { await MockServer.Destroy() });

    it('should set default db', async () => {
      mockServer.setDb();
      expect(mockServer.data.db).toEqual({});
    });

    it('should set custom db with rever order', async () => {
      const db = { "/posts": { id: "1", name: "Siva" }, "/comments": { id: "1", postId: "1", name: "Siva" } }
      const injectors = [{ routes: ["/posts"], delay: 1000 }]
      mockServer.setDb(db, injectors, { reverse: true })

      expect(mockServer.data.db).toEqual({
        "/comments": {
          _config: true,
          id: "2",
          mock: { id: "1", postId: "1", name: "Siva" }
        },
        "/posts": {
          _config: true,
          id: "1",
          delay: 1000,
          mock: { id: "1", name: "Siva" }
        }
      });
      expect(Object.keys(mockServer.data.db)[0]).toBe("/comments")
    });

    it('should set custom db without rever order', async () => {
      const db = { "/posts": { id: "1", name: "Siva" }, "/comments": { id: "1", postId: "1", name: "Siva" } }
      const injectors = [{ routes: ["/posts"], delay: 1000 }]
      mockServer.setDb(db, injectors, { reverse: false })

      expect(mockServer.data.db).toEqual({
        "/posts": {
          _config: true,
          id: "1",
          delay: 1000,
          mock: { id: "1", name: "Siva" }
        },
        "/comments": {
          _config: true,
          id: "2",
          mock: { id: "1", postId: "1", name: "Siva" }
        },
      });
      expect(Object.keys(mockServer.data.db)[0]).toBe("/posts")
    });
  });
}

const setStore = () => {
  describe('mockServer.setStore() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => { mockServer = MockServer.Create() });
    afterEach(async () => { await MockServer.Destroy() });

    it('should set default store', async () => {
      mockServer.setStore();
      expect(mockServer.data.store).toEqual({});
    });

    it('should set custom store', async () => {
      const store = { "/posts": { id: "1", name: "Siva" }, "/comments": { id: "1", postId: "1", name: "Siva" } }
      mockServer.setStore(store)
      expect(mockServer.data.store).toEqual(store);
    });
  });
}

const setRewriters = () => {
  describe('mockServer.setRewriters() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => { mockServer = MockServer.Create() });
    afterEach(async () => { await MockServer.Destroy() });

    it('should set default rewriters', async () => {
      mockServer.setRewriters();
      expect(mockServer.data.rewriters).toEqual({});
    });

    it('should set custom store', async () => {
      const rewriters = { "api/*": "/$1" }
      mockServer.setRewriters(rewriters)
      expect(mockServer.data.rewriters).toEqual(rewriters);
    });
  });
}

const setData = () => {
  describe('mockServer.setData() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => { mockServer = MockServer.Create() });
    afterEach(async () => { await MockServer.Destroy() });

    it('should set default data', async () => {
      mockServer.setData();
      expect(mockServer.data.db).toEqual({});
      expect(mockServer.data.config).toEqual(Default_Config);
      expect(mockServer.data.middleware).toEqual(Default_Middlewares);
      expect(mockServer.data.store).toEqual({});
      expect(mockServer.data.injectors).toEqual([]);
    });

    it('should set custom data', async () => {
      const db = { "/posts": { id: "1", name: "Siva" }, "/comments": { id: "1", postId: "1", name: "Siva" } }
      const injectors = [{ routes: ["/posts"], delay: 1000 }];
      const store = { "/posts": { id: "1", name: "Siva" } }
      const middleware = { "logger": () => { } }
      const rewriters = { "/api/*": "/$1" }
      const config = { root: __dirname }

      mockServer.setData(db, middleware, injectors, rewriters, store, config);
      expect(mockServer.data.db).toEqual({
        "/comments": {
          _config: true,
          id: "2",
          mock: { id: "1", postId: "1", name: "Siva" }
        },
        "/posts": {
          _config: true,
          id: "1",
          delay: 1000,
          mock: { id: "1", name: "Siva" }
        }
      });
      expect(mockServer.data.config).toEqual({ ...Default_Config, root: forwardSlash(__dirname) });
      expect(mockServer.data.middleware).toEqual({ ...Default_Middlewares, ...middleware });
      expect(mockServer.data.store).toEqual(store);
      expect(mockServer.data.injectors).toEqual(injectors);
    });
  });
}

const getDb = () => {
  describe('mockServer.getDb() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => { mockServer = MockServer.Create() });
    afterEach(async () => { await MockServer.Destroy() });

    it('should get db', async () => {
      const db = { "/posts": { id: "1", name: "Siva" }, "/comments": { id: "1", postid: "1", name: "Siva" } }
      mockServer.setDb(db);
      const result = mockServer.getDb()
      expect(result).toEqual({
        "/comments": {
          _config: true,
          id: "2",
          mock: { id: "1", postid: "1", name: "Siva" }
        },
        "/posts": {
          _config: true,
          id: "1",
          mock: { id: "1", name: "Siva" }
        }
      })
    });

    it('should get db by id', async () => {
      const db = { "/posts": { id: "1", name: "Siva" }, "/comments": { id: "1", postid: "1", name: "Siva" } }
      mockServer.setDb(db);
      const result = mockServer.getDb(["1"])
      expect(result).toEqual({
        "/posts": {
          _config: true,
          id: "1",
          mock: { id: "1", name: "Siva" }
        }
      })
    });

    it('should get db by routePath', async () => {
      const db = { "/posts": { id: "1", name: "Siva" }, "/comments": { id: "1", postid: "1", name: "Siva" } }
      mockServer.setDb(db);
      const result = mockServer.getDb([], ["/comments"])
      expect(result).toEqual({
        "/comments": {
          _config: true,
          id: "2",
          mock: { id: "1", postid: "1", name: "Siva" }
        }
      })
    });
  });
}

const getData = () => {
  describe('mockServer.getData() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => { mockServer = MockServer.Create() });
    afterEach(async () => { await MockServer.Destroy() });

    it('should get data', async () => {
      const { db, injectors, store, middleware, config, rewriters } = mockServer.data as any
      expect(db).toBeDefined();
      expect(injectors).toBeDefined();
      expect(store).toBeDefined();
      expect(middleware).toBeDefined();
      expect(config).toBeDefined();
      expect(rewriters).toBeDefined();
    });
  });
}

describe("Getter and Setter", () => {
  constructor(); // Create a MockServer instane with a custom config
  setConfig(); // Set config
  setMiddleware(); // Set middlewares
  setInjectors(); // Set injectors
  setDb(); // Set db
  setStore(); // Set store
  setRewriters(); // Set rewriters
  setData(); // Set db, middlewares, injectors, rewriters, store, config
  getDb(); // Get db
  getData(); // Get data
})