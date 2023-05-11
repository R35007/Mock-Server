import * as Defaults from '../../src/defaults';
import { MockServer } from '../../src/index';
import { toBase64 } from '../../src/utils';

const constructor = () => {
  describe('new MockServer() : ', () => {
    it('should create with default config', async () => {
      const mockServer = new MockServer();
      expect(mockServer.data.config).toEqual(Defaults.Config);
    });

    it('should create with custom config', async () => {
      const mockServer = new MockServer({ root: __dirname });
      expect(mockServer.data.config).toEqual({ ...Defaults.Config, root: __dirname });
    });
  });
};

const setConfig = () => {
  describe('mockServer.setConfig() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => {
      mockServer = MockServer.Create();
    });
    afterEach(async () => {
      await MockServer.Destroy();
    });

    it('should set default config', async () => {
      expect(mockServer.data.config).toEqual(Defaults.Config);
      mockServer.setConfig();
      expect(mockServer.data.config).toEqual(Defaults.Config);
    });

    it('should set custom config', async () => {
      expect(mockServer.data.config).toEqual(Defaults.Config);
      mockServer.setConfig({ root: __dirname });
      expect(mockServer.data.config).toEqual({ ...Defaults.Config, root: __dirname });
    });
  });
};

const setMiddleware = () => {
  describe('mockServer.setMiddleware() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => {
      mockServer = MockServer.Create();
    });
    afterEach(async () => {
      await MockServer.Destroy();
    });

    it('should set default middlewares', async () => {
      mockServer.setMiddlewares();
      expect(mockServer.data.middlewares).toEqual(Defaults.Middlewares);
    });

    it('should set custom middlewares', async () => {
      const middleware = { logger: () => {} };
      mockServer.setMiddlewares(middleware);
      expect(Object.keys(mockServer.data.middlewares)).toStrictEqual(Object.keys({ ...Defaults.Middlewares, ...middleware }));
    });
  });
};

const setInjectors = () => {
  describe('mockServer.setInjectors() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => {
      mockServer = MockServer.Create();
    });
    afterEach(async () => {
      await MockServer.Destroy();
    });

    it('should set default injectors', async () => {
      mockServer.setInjectors();
      expect(mockServer.data.injectors).toEqual([]);
    });

    it('should set custom injectors', async () => {
      const injectors = [{ routes: ['/posts'], delay: 100 }];
      mockServer.setInjectors(injectors);
      expect(mockServer.data.injectors).toEqual(injectors);
    });
  });
};

const setStore = () => {
  describe('mockServer.setStore() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => {
      mockServer = MockServer.Create();
    });
    afterEach(async () => {
      await MockServer.Destroy();
    });

    it('should set default store', async () => {
      mockServer.setStore();
      expect(mockServer.data.store).toEqual({});
    });

    it('should set custom store', async () => {
      const store = { '/posts': { id: '1', name: 'Siva' }, '/comments': { id: '1', postId: '1', name: 'Siva' } };
      mockServer.setStore(store);
      expect(mockServer.data.store).toEqual(store);
    });
  });
};

const setData = () => {
  describe('mockServer.setData() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => {
      mockServer = MockServer.Create();
    });
    afterEach(async () => {
      await MockServer.Destroy();
    });

    it('should set default data', async () => {
      mockServer.setData();
      expect(mockServer.data.db).toEqual({});
      expect(mockServer.data.config).toEqual(Defaults.Config);
      expect(mockServer.data.middlewares).toEqual(Defaults.Middlewares);
      expect(mockServer.data.store).toEqual({});
      expect(mockServer.data.injectors).toEqual([]);
    });

    it('should set custom data', async () => {
      const db = { '/posts': { id: '1', name: 'Siva' }, '/comments': { id: '1', postId: '1', name: 'Siva' } };
      const injectors = [{ routes: ['/posts'], delay: 1000 }];
      const store = { '/posts': { id: '1', name: 'Siva' } };
      const middlewares = { logger: () => {} };
      const rewriters = { '/api/*': '/$1' };
      const config = { root: __dirname };

      mockServer.setData({ injectors, middlewares, store, config });
      mockServer.rewriter(rewriters);
      mockServer.resources(db);
      expect(mockServer.data.db).toEqual({
        '/comments': {
          _config: true,
          id: toBase64('/comments'),
          mock: { id: '1', postId: '1', name: 'Siva' },
        },
        '/posts': {
          _config: true,
          id: toBase64('/posts'),
          delay: 1000,
          mock: { id: '1', name: 'Siva' },
        },
      });
      expect(mockServer.data.config).toEqual({ ...Defaults.Config, root: __dirname });
      expect(Object.keys(mockServer.data.middlewares)).toStrictEqual(Object.keys({ ...Defaults.Middlewares, ...middlewares }));
      expect(mockServer.data.store).toEqual(store);
      expect(mockServer.data.injectors).toEqual(injectors);
    });
  });
};

const getData = () => {
  describe('mockServer.getData() : ', () => {
    let mockServer: MockServer;
    beforeEach(() => {
      mockServer = MockServer.Create();
    });
    afterEach(async () => {
      await MockServer.Destroy();
    });

    it('should get data', async () => {
      const { db, injectors, store, middlewares, config, rewriters } = mockServer.data as any;
      expect(db).toBeDefined();
      expect(injectors).toBeDefined();
      expect(store).toBeDefined();
      expect(middlewares).toBeDefined();
      expect(config).toBeDefined();
      expect(rewriters).toBeDefined();
    });
  });
};

describe('Getter and Setter', () => {
  constructor(); // Create a MockServer instance with a custom config
  setConfig(); // Set config
  setMiddleware(); // Set middlewares
  setInjectors(); // Set injectors
  setStore(); // Set store
  setData(); // Set db, middlewares, injectors, rewriters, store, config
  getData(); // Get data
});
