import { Router } from 'express';
import ip from 'ip';
import request from 'supertest';
import * as Defaults from '../../src/defaults';
import { MockServer } from '../../src/index';
import { Db, Injectors, Middlewares, Rewriters, Store } from '../../src/types/user.types';

const constructor = () => {
  describe('new MockServer()', () => {
    it('should return a new instance of a mock server', () => {
      const mockServer1 = new MockServer();
      const mockServer2 = new MockServer();
      expect(mockServer1).not.toEqual(mockServer2);
    });
  });
};

const create = () => {
  describe('MockServer.Create() :', () => {
    afterEach(async () => {
      await MockServer.Destroy();
    });

    it('should return instance of mock server', async () => {
      const mockServer = MockServer.Create();
      expect(mockServer).toBeInstanceOf(MockServer);
    });

    it('should return same instance on multiple creation', async () => {
      const mockServer1 = MockServer.Create();
      const mockServer2 = MockServer.Create();
      expect(mockServer1).toEqual(mockServer2);
    });

    it('should create with default config', async () => {
      const mockServer = MockServer.Create();
      expect(mockServer.data.config).toEqual(Defaults.Config);
    });

    it('should create with custom config', async () => {
      const mockServer = MockServer.Create({ root: __dirname });
      expect(mockServer.data.config).toEqual({ ...Defaults.Config, root: __dirname });
    });
  });
};

const rewriter = () => {
  describe('mockserver.rewriter() : ', () => {
    let mockServer: MockServer;
    let rewrites: Router;

    beforeAll(() => {
      mockServer = MockServer.Create();
      rewrites = mockServer.rewriter({ '/api/*': '/$1' });
      mockServer.app.use(rewrites);
    });
    afterAll(async () => {
      await MockServer.Destroy();
    });

    it('should return express router with custom rewriter', async () => {
      const routers = mockServer.app._router.stack;
      expect(routers[routers.length - 1].handle).toEqual(rewrites);
      expect(routers[routers.length - 1].handle.stack.length).toBe(1);
    });

    it('should rewrite the routes. /api/post -> /post ', async () => {
      const mockPost = { userId: '1', id: '1', title: 'Testing Rewriters', body: 'Successful' };
      mockServer.app.get('/post', (_req, res) => {
        res.json(mockPost);
      });

      await mockServer.startServer();

      const response = await request(mockServer.app).get('/api/post');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockPost);
    });
  });
};

const defaults = () => {
  describe('mockserver.defaults() :', () => {
    let mockServer: MockServer;

    beforeEach(() => {
      mockServer = MockServer.Create();
    });
    afterEach(async () => {
      await MockServer.Destroy();
    });

    it('should return a express router defaults', async () => {
      const defaults = mockServer.defaults();
      mockServer.app.use(defaults);

      const routers = mockServer.app._router.stack;
      expect(routers.length).toBe(12);
    });

    it('should go to homepage', async () => {
      const defaults = mockServer.defaults();
      mockServer.app.use(defaults);

      await mockServer.startServer();
      const response = await request(mockServer.app).get('/');
      expect(response.statusCode).toBe(200);
    });

    it('should return 403 (Forbidden) error for all api method calls except GET call', async () => {
      const defaults = mockServer.defaults({ readOnly: true });
      mockServer.app.use(defaults);

      const mockPost = { name: 'siva' };
      mockServer.app.all('/post', (req, res) => {
        req.method === 'GET' ? res.json(mockPost) : res.json(req.body);
      });

      await mockServer.startServer();

      const response1 = await request(mockServer.app).post('/post').send(mockPost);
      expect(response1.statusCode).toBe(403);

      const response2 = await request(mockServer.app).put('/post').send(mockPost);
      expect(response2.statusCode).toBe(403);

      const response3 = await request(mockServer.app).get('/post');
      expect(response3.statusCode).toBe(200);
      expect(response3.body).toEqual(mockPost);
    });
  });
};

const resources = () => {
  describe('mockServer.resources() : ', () => {
    let mockServer: MockServer;

    beforeEach(() => {
      mockServer = MockServer.Create();
    });
    afterEach(async () => {
      await MockServer.Destroy();
    });

    it('should load with default resources', () => {
      const resources = mockServer.resources();
      mockServer.app.use(resources.router);

      const { db, middlewares, injectors, store } = mockServer.data;
      expect(db).toEqual({});
      expect(Object.keys(middlewares).length).toBe(Object.keys(Defaults.Middlewares).length);
      expect(injectors).toEqual([]);
      expect(store).toEqual({});
    });

    it('should load with custom resources', () => {
      const mockDb: Db = { '/post': { _config: true, id: '1', mock: { id: '1', name: 'Siva' } } };
      const mockMiddleware: Middlewares = {
        logger: (req, _res, next) => {
          console.log(req.path);
          next();
        },
      };
      const mockInjectors: Injectors = [{ routes: ['/post'], delay: 1000 }];
      const mockStore: Store = { post: { id: '2', name: 'ram' } };

      mockServer.setData({ injectors: mockInjectors, middlewares: mockMiddleware, store: mockStore });
      const resources = mockServer.resources(mockDb);
      mockServer.app.use(resources.router);

      const { db, injectors, middlewares, store } = mockServer.data;

      expect(db).toEqual({ '/post': { _config: true, id: '1', delay: 1000, mock: { id: '1', name: 'Siva' } } });
      expect(Object.keys(middlewares).length).toBe(Object.keys(Defaults.Middlewares).length + 1);
      expect(injectors).toEqual(mockInjectors);
      expect(store).toEqual(mockStore);
    });
  });
};

const homePage = () => {
  describe('mockServer.homePage() : ', () => {
    let mockServer: MockServer;
    let homePage: Router;

    let mockDb: Db;
    let mockMiddleware: Middlewares;
    let mockRewriters: Rewriters;
    let mockStore: Store;
    const homePageRoutes = ['/_assets/bootstrap', '/_assets', '/_db/:id?', '/_rewriters', '/_store', '/_reset/:id?', '/_routes'];

    const assertResponse = (response: any, expected: any) => {
      homePageRoutes.forEach((route) => delete response.body[route]);
      homePageRoutes.forEach((route) => delete expected[route]);
      Object.entries(response.body).forEach(([route]) => delete response.body[route].store);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(expected);
    };

    const get = async (url: string, expected: any) => {
      const response = await request(mockServer.app).get(url);
      assertResponse(response, expected);
    };

    const put = async (url: string, payload: { [key: string]: any }, expected: any) => {
      const response = await request(mockServer.app).put(url).send(payload);
      assertResponse(response, expected);
      mockDb = { ...mockDb, ...expected } as Db;
    };

    const post = async (url: string, payload: object, expected: any) => {
      const response = await request(mockServer.app).post(url).send(payload);
      assertResponse(response, expected);
      mockDb = { ...mockDb, ...expected } as Db;
    };

    beforeAll(() => {
      mockServer = MockServer.Create();

      const defaults = mockServer.defaults();
      mockServer.app.use(defaults);

      mockRewriters = { '/api/*': '/$1' };
      const rewriters = mockServer.rewriter(mockRewriters);
      mockServer.app.use(rewriters);

      mockDb = {
        '/posts': {
          _config: true,
          id: '1',
          mock: [{ id: '1', name: 'Siva' }],
        },
        '/comments': {
          _config: true,
          id: '2',
          mock: [{ id: '1', postId: '2', name: 'Siva' }],
        },
        '/setStorePost': {
          _config: true,
          id: '3',
          middlewares: ['SetStorePost'],
        },
        '/setStoreComment': {
          _config: true,
          id: '4',
          middlewares: ['SetStoreComment'],
        },
      };
      mockMiddleware = {
        SetStorePost: (_req, res) => {
          const store = res.locals.getStore();
          store.post.name = 'Sivaraman';
          res.send({ status: 'Store Updated' });
        },
        SetStoreComment: (_req, res) => {
          const store = res.locals.getStore();
          store.comment.name = 'Sivaraman';
          res.send({ status: 'Store Updated' });
        },
      };
      mockStore = { post: { id: '1', name: 'Siva' }, comment: { id: '1', postId: '1', name: 'Ram' } };
      mockServer.setData({ middlewares: mockMiddleware, store: mockStore });
      const resources = mockServer.resources(mockDb);
      mockServer.app.use(resources.router);

      homePage = mockServer.homePage();
      mockServer.app.use(mockServer.config.base, homePage);

      return mockServer.startServer();
    });

    afterAll(async () => {
      await MockServer.Destroy();
    });

    it('should return a mock server default routes', async () => {
      const router = mockServer.app._router.stack[mockServer.app._router.stack.length - 1];
      expect(router.handle).toBe(homePage);
      expect(router.handle.stack.length).toBe(homePage.stack.length);
    });

    describe('/_db/:id?', () => {
      it('should get db', async () => {
        await get('/_db', { ...mockDb });
      });

      it('should get db of id 2', async () => {
        await get('/_db/2', { '/comments': mockDb['/comments'] });
      });

      it('should update route config of db in /comments route', async () => {
        const updatedComments = { '/comments': { _config: true, id: '2', mock: [{ id: '1', postId: '1', name: 'Ram' }] } };
        await put('/_db', updatedComments, updatedComments); // updating /comments route
        await get('/comments', updatedComments['/comments'].mock); // checking /comments
      });

      it('should add new route to db', async () => {
        const newRoute = { '/user': { _config: true, id: '5', mock: { id: '1', name: 'Siva' } } };
        const expected = { ...mockDb, ...newRoute };

        await post('/_db', newRoute, newRoute); // adding /user route
        await get('/_db', expected); // checking /_db
        await get('/user', newRoute['/user'].mock); // checking /user route
      });
    });

    describe('/_store', () => {
      it('should get store', async () => {
        await get('/_store', mockStore);
      });
    });

    describe('/_rewriters', () => {
      it('should get rewriters', async () => {
        await get('/_rewriters', mockRewriters);
      });
    });

    describe('/_reset/:id?', () => {
      it('should reset db', async () => {
        const updatedUser = { '/user': { _config: true, id: '5', mock: { id: '1', name: 'Ram', action: 'Updated' } } };
        await put('/_db', updatedUser, updatedUser); // updating /user

        const updatedComments = { '/comments': { _config: true, id: '2', mock: [{ id: '1', name: 'Ram', action: 'Updated' }] } };
        await put('/_db', updatedComments, updatedComments); // updating /comments

        await get('/_reset', mockServer.initialDb); // resetting db to initial state
      });

      it('should reset db of id 5', async () => {
        const updatedUser = { '/user': { _config: true, id: '5', mock: { id: '1', name: 'Ram', action: 'Updated2' } } };
        await put('/_db/5', updatedUser, updatedUser); // updating /user

        const updatedComments = { '/comments': { _config: true, id: '2', mock: [{ id: '1', name: 'Sivaraman', action: 'Updated2' }] } };
        await put('/_db/2', updatedComments, updatedComments); // updating /comments

        await get('/_reset/2', { '/comments': mockServer.initialDb['/comments'] }); // reset only /comments
        mockDb = { ...mockDb, '/comments': mockServer.initialDb['/comments'] };
      });
    });
  });
};

const launchServer = () => {
  describe('mockServer.launchServer() : ', () => {
    let mockServer: MockServer;

    beforeEach(() => {
      mockServer = MockServer.Create();
    });
    afterEach(async () => {
      await MockServer.Destroy();
    });

    it('should launchServer with default resources', async () => {
      const server = await mockServer.launchServer();
      expect(server).toBeDefined();
      const response = await request(mockServer.app).get('/');
      expect(response.statusCode).toBe(200);
    });

    it('should call rewriter, defaults, resources, homePage, startServer', async () => {
      const rewriter = jest.spyOn(mockServer, 'rewriter');
      const defaults = jest.spyOn(mockServer, 'defaults');
      const resources = jest.spyOn(mockServer, 'resources');
      const homePage = jest.spyOn(mockServer, 'homePage');
      const startServer = jest.spyOn(mockServer, 'startServer');

      const server = await mockServer.launchServer();
      expect(server).toBeDefined();
      expect(rewriter).toBeCalledTimes(1);
      expect(defaults).toBeCalledTimes(1);
      expect(resources).toBeCalledTimes(1);
      expect(homePage).toBeCalledTimes(1);
      expect(startServer).toBeCalledTimes(1);

      const response = await request(mockServer.app).get('/');
      expect(response.statusCode).toBe(200);
    });

    it('should launchServer with custom resources', async () => {
      const mockDb: Db = {
        '/posts': {
          _config: true,
          id: '1',
          mock: [{ id: '1', name: 'Siva' }],
        },
      };
      const mockMiddleware: Partial<Middlewares> = {
        globals: [
          (req, _res, next) => {
            console.log(req.path);
            next();
          },
        ],
      };
      const mockInjectors: Injectors = [{ routes: ['/posts'], delay: 1000 }];
      const mockRewriters: Rewriters = { '/api/*': '/$1' };
      const mockStore: Store = { post: { id: '1', name: 'Siva' } };

      await mockServer.launchServer(mockDb, {
        injectors: mockInjectors,
        middlewares: mockMiddleware,
        rewriters: mockRewriters,
        store: mockStore,
      });
      expect(mockServer.server).toBeDefined();
      const { db, middlewares, injectors, rewriters, store } = mockServer.data;
      expect(Object.keys(db).length).toBeGreaterThan(0);
      expect(Object.keys(middlewares).length).toBe(Object.keys(Defaults.Middlewares).length);
      expect(Object.keys(injectors).length).toBeGreaterThan(0);
      expect(Object.keys(rewriters).length).toBeGreaterThan(0);
      expect(Object.keys(store).length).toBeGreaterThan(0);
      expect(Object.keys(mockServer.initialDb).length).toBeGreaterThan(0);
    });
  });
};

const startServer = () => {
  describe('mockserver.startServer() :', () => {
    let mockServer: MockServer;
    beforeEach(() => {
      mockServer = MockServer.Create();

      const defaults = mockServer.defaults();
      mockServer.app.use(defaults);
    });
    afterEach(async () => {
      await MockServer.Destroy();
    });

    it('should start server with default port and host', async () => {
      const server = await mockServer.startServer();

      const { port, host } = mockServer.data.config;
      expect(port).toBe(3000);
      expect(host).toBe('localhost');

      const { port: serverPort, address: serverHost } = server!.address() as { address: string; family: string; port: number };
      expect(server).toBeDefined();
      expect(serverPort).toBe(3000);
      expect(serverHost).toBeDefined();

      const response = await request(mockServer.app).get('/');
      expect(response.statusCode).toBe(200);
    });

    it('should start mock server with custom port and host', async () => {
      const PORT = 4000;
      const HOST = ip.address(); //  My localhost ip address.

      const server = await mockServer.startServer(PORT, HOST);

      const { port, host } = mockServer.data.config;
      expect(port).toBe(PORT);
      expect(host).toBe(HOST);

      const { port: serverPort, address: serverHost } = server!.address() as { address: string; family: string; port: number };
      expect(serverPort).toBe(PORT);
      expect(serverHost).toBe(HOST);

      const response = await request(mockServer.app).get('/');
      expect(response.statusCode).toBe(200);
    });

    it('should throw error when a server is already started', async () => {
      expect.assertions(2);
      try {
        await mockServer.startServer();
        await mockServer.startServer();
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBe('Server already listening to port : 3000');
      }
    });
  });
};

const stopServer = () => {
  describe('mockserver.stopServer() :', () => {
    let mockServer: MockServer;
    beforeEach(() => {
      mockServer = MockServer.Create();

      const defaults = mockServer.defaults();
      mockServer.app.use(defaults);
    });
    afterEach(async () => {
      await MockServer.Destroy();
    });

    it('should stop server if its already running', async () => {
      await mockServer.startServer();
      const isStopped = await mockServer.stopServer();
      expect(isStopped).toBeTruthy();
    });

    it('should throw error when a there is no server to stop', async () => {
      expect.assertions(2);
      try {
        await mockServer.stopServer();
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBe('No Server to Stop');
      }
    });
  });
};

const resetServer = () => {
  describe('mockServer.resetServer() : ', () => {
    it('should reset mock server', async () => {
      const mockServer = MockServer.Create({ root: __dirname });
      const mockMiddlewares: Middlewares = {
        globals: [
          (req, _res, next) => {
            console.log(req.path);
            next();
          },
        ],
      };
      const mockInjectors: Injectors = [{ routes: ['/posts'], delay: 1000 }];
      const mockStore: Store = { post: { id: '1', name: 'Siva' } };

      mockServer.setData({ injectors: mockInjectors, middlewares: mockMiddlewares, store: mockStore });
      await MockServer.Destroy();
      expect(mockServer.server).toBeUndefined();
      const { db, middlewares, injectors, rewriters, store } = mockServer.data;
      expect(Object.keys(db).length).toBe(0);
      expect(Object.keys(middlewares).length).toBe(Object.keys(Defaults.Middlewares).length);
      expect(Object.keys(injectors).length).toBe(0);
      expect(Object.keys(rewriters).length).toBe(0);
      expect(Object.keys(store).length).toBe(0);
      expect(Object.keys(mockServer.initialDb).length).toBe(0);
    });
  });
};

const destroy = () => {
  describe('MockServer.Destroy() :', () => {
    it('should stop running server and destroy mock server instance', async () => {
      const mockServer = MockServer.Create();
      await mockServer.startServer();
      expect(mockServer.server).toBeDefined(); // check is server started

      const stopServer = jest.spyOn(mockServer, 'stopServer');
      await MockServer.Destroy();
      expect(stopServer).toBeCalledTimes(1);
      expect(mockServer.server).toBeUndefined(); // check is server is stopped
    });

    it('should not throw error when there is no server to stop', async () => {
      const mockServer = MockServer.Create();
      await mockServer.startServer();
      expect(mockServer.server).toBeDefined(); // check is server started

      const stopServer = jest.spyOn(mockServer, 'stopServer');
      await MockServer.Destroy(); // Stops Server
      expect(stopServer).toBeCalledTimes(1);
      expect(mockServer.server).toBeUndefined(); // check is server is stopped

      const mockServer2 = MockServer.Create();
      await mockServer2.startServer();
      expect(mockServer2.server).toBeDefined(); // check is server started

      const stopServer2 = jest.spyOn(mockServer2, 'stopServer');
      await MockServer.Destroy(mockServer2); // Stops Server
      expect(stopServer2).toBeCalledTimes(1);
      expect(mockServer2.server).toBeUndefined(); // check is server is stopped
    });

    it('should call stopServer and resetServer on destroy', async () => {
      const mockServer = MockServer.Create();
      mockServer.resetServer = jest.fn();
      mockServer.stopServer = jest.fn();

      await MockServer.Destroy();

      expect(mockServer.stopServer).toBeCalledTimes(1);
      expect(mockServer.resetServer).toBeCalledTimes(1);
    });

    it('should destroy server by the given instance', async () => {
      const mockServer = new MockServer();

      MockServer.Create(); // create a new private instance of a MockServer

      mockServer.resetServer = jest.fn();
      mockServer.stopServer = jest.fn(() => Promise.resolve(true));

      await MockServer.Destroy(mockServer); // Should destroy only with the given instance and not with the private instance

      expect(mockServer.stopServer).toBeCalledTimes(1);
      expect(mockServer.resetServer).toBeCalledTimes(1);
    });
  });
};

describe('MockServer', () => {
  constructor(); // Create a new instance of a MockSever
  create(); // Create single instance of a MockServer Instance
  rewriter(); // Add any route rewriters to the middleware
  defaults(); // Add default middlewares -> noGzip, noCors, errorhandler, static Home page, etc..
  resources(); // Add db, middlewares, injectors, store
  homePage(); // Add Default Routes -> /_db/:id?, /_store/:key?, /_rewriters, /_reset/:id?, /_reset/store/:key?
  launchServer(); // Add defaults, homePage, rewriters, resources and start the server in one flow
  startServer(); // Start the mock server
  stopServer(); // Stop the mock server
  resetServer(); // Stop the mock server
  destroy(); // Destroy MockServer Instance
});
