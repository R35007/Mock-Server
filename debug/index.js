const { MockServer, watcher, chalk, axios } = require('../dist/index.js');
const mockServer = MockServer.Create({ root: __dirname });

const startServer = async () => {
  const app = mockServer.app;

  // Set global middlewares, injectors and store to mock server instance
  mockServer.setData({
    injectors: [],
    middlewares: {},
    store: {},
  });

  // Make sure to use this at first, before all the resources
  const rewriter = mockServer.rewriter({});
  app.use(rewriter);

  // Add default Middlewares.
  const defaultsMiddlewares = mockServer.defaults();
  app.use(defaultsMiddlewares);

  // Add Database
  const db = await axios.get('https://jsonplaceholder.typicode.com/db').then((res) => res.data);
  const resources = mockServer.resources(db);
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
  const watch = watcher.watch([
    mockServer.config.root,
    //... provide your custom file or folder path to watch for changes
  ]);

  // Restart server on change
  watch.on('change', async (changedPath) => {
    process.stdout.write(chalk.yellowBright(changedPath) + chalk.gray(' has changed, reloading...\n'));
    if (!mockServer.server) return; // return if no server to stop
    await MockServer.Destroy(mockServer).then(() => startServer()); // Stop and restart the server on changes
  });
});
