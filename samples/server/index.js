// Run this file in terminal:
// $ node server

const { MockServer, watcher, chalk } = require('@r35007/mock-server');
const config = require('../.mockserverrc.js');

// Create Mock Server instance with custom config.
const mockServer = MockServer.Create(config);

const startServer = async () => {
  const app = mockServer.app;

  // Set global middlewares, injectors and store to mock server instance
  mockServer.setData({
    injectors: config.injectors,
    middlewares: config.middlewares,
    store: config.store,
  });

  // Make sure to use this at first, before all the resources
  const rewriter = mockServer.rewriter(config.rewriters);
  app.use(rewriter); 

  // Add default Middlewares.
  const defaultsMiddlewares = mockServer.defaults();
  app.use(defaultsMiddlewares);

  // Add Database
  const resources = mockServer.resources(config.db);
  app.use(resources.router);

  // Create the Mock Server Home Page
  const homePage = mockServer.homePage();
  app.use(homePage);

  app.use(mockServer.pageNotFound); // Middleware to return `Page Not Found` as response if the route doesn't match
  app.use(mockServer.errorHandler); // Error Handler

  // Start server
  await mockServer.startServer();
};

startServer().then(() => {
  // watch for changes
  const watch = watcher.watch(mockServer.config.root);

  // Restart server on change
  watch.on('change', async () => {
    process.stdout.write(chalk.yellowBright(changedPath) + chalk.gray(' has changed, reloading...\n'));
    if (!mockServer.server) return; // return if no server to stop
    await MockServer.Destroy(mockServer).then(() => startServer()); // Stop and restart the server on changes
  });
});
