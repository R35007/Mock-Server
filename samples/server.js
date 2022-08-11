const { MockServer } = require("@r35007/mock-server");

// Provide config as a param. If not provided, It uses the default Config.
const mockServer = MockServer.Create({root:__dirname});

const app = mockServer.app; // Gives you the Express app

// Make sure to use this at first, before all the resources
const rewriter = mockServer.rewriter("./rewriters.json");
app.use(rewriter);

// Returns the default middlewares
// Provide options here. If not provided the options are picked from the default Config
const defaultsMiddlewares = mockServer.defaults();
app.use(defaultsMiddlewares);

// Custom Middleware
app.use((req, res, next) => {
  if (isAuthorized(req)) {
    next() // continue to Mock Server router
  } else {
    res.sendStatus(401)
  }
})
const isAuthorized = (req) => {
  // add your authorization logic here
  return true;
};

// Custom Routes
// This route will not be listed in Home Page.
app.get('/echo', (req, res) => {
  res.jsonp(req.query)
})

// Loaded all the resources and returns the default router
const resources = mockServer.resources(
  "./db.js",
  "./injectors.json",
  "./middleware.js",
  "./store.json"
);
app.use(mockServer.config.base, resources);

// Add Custom Routes to existing default router
// This Route will be listed in Home Page
mockServer.addDb({
  "/data": {
    _config: true,
    middlewares: (req, res, next) => {
      const store = res.locals.getStore();
      res.locals.data = store?.data;
      next();
    }
  }
})

// Create the default Routes which helps to run the Mock Server Home Page.
const defaultRoutes = mockServer.defaultRoutes();
app.use(mockServer.config.base, defaultRoutes);

app.use(mockServer.pageNotFound); // Middleware to return `Page Not Found` as response if the route doesn't match
app.use(mockServer.errorHandler); // Default Error Handler

// Provide port and host name as a param.
// Default port : 3000, Default host: 'localhost' 
mockServer.startServer();

//or
// Use  mockServer.launchServer which does every above and starts the server.

/*
mockServer.launchServer(
  "./db.json",
  "./middleware.js",
  "./injectors.json",
  "./rewriters.json",
  "./store.json"
)
*/

// or
// You can also run thru CLI command

// mock-server --watch --db=db.json --m=middleware.js --i=injectors.json --r=rewrites.json --s=store.json