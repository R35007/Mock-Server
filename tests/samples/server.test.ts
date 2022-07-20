import path from 'path';
import { MockServer } from '../../src/server';

const server = () => {
  describe('Server Testing', () => {

    beforeEach(async () => await MockServer.Destroy())

    it('should run without any exception', async () => {
      const mockServer = MockServer.Create({ root: path.resolve(__dirname, "../../samples") });

      const app = mockServer.app;

      const rewriter = mockServer.rewriter("./rewriters.json");
      app.use(rewriter);

      const defaultsMiddlewares = mockServer.defaults();
      app.use(defaultsMiddlewares);

      app.use((req, res, next) => {
        if (isAuthorized(req)) { next() } else { res.sendStatus(401) }
      })
      const isAuthorized = (_req) => true

      app.get('/echo', (req, res) => {
        res.jsonp(req.query)
      })

      const resources = mockServer.resources(
        "./db.json",
        "./injectors.json",
        "./middleware.js",
        "./store.json"
      );
      app.use(mockServer.config.base, resources);

      mockServer.addDbData({
        "/data": {
          _config: true,
          middlewares: (_req, res, next) => {
            const store = res.locals.getStore();
            console.log(store);
            res.locals.data = store?.data;
            next();
          }
        }
      })

      const defaultRoutes = mockServer.defaultRoutes();
      app.use(mockServer.config.base, defaultRoutes);

      app.use(mockServer.pageNotFound);
      app.use(mockServer.errorHandler);

      await mockServer.startServer();

      console.log(mockServer);
      
    });
  });
}

// TODO: Write Test cases for sample db routes
const sampleDb = () => {
}


describe("Test in Samples", () => {
  server() // Testing Server.js file
  sampleDb() // Testing all routes in sample db
})