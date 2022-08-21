const { MockServer } = require("@r35007/mock-server");
// const MockServer = require("@r35007/mock-server").default; // For default import

const port = 3000; // Set Port to 0 to pick a random available port. default: 3000
const host = "localhost";
const config = { root: __dirname, port, host };
const mockServer = MockServer.Create(config);

const app = mockServer.app;

// Make sure to use this at first, before all the resources
const rewriter = mockServer.rewriter("./rewriters.json");
app.use(rewriter);

// Returns the default middlewares
const defaultsMiddlewares = mockServer.defaults();
app.use(defaultsMiddlewares);

// Custom Middleware
app.use((req, res, next) => {
  if (isAuthorized(req)) {
    next(); // continue to Mock Server router
  } else {
    res.sendStatus(401);
  }
});
const isAuthorized = (req) => {
  // add your authorization logic here
  return true;
};

// Custom Routes
// This route will not be listed in Home Page.
app.get("/echo", (req, res) => {
  res.jsonp(req.query);
});

// Loaded all the resources and returns the express router
const resources = mockServer.resources(
  "./db.js",
  "./injectors.json",
  "./middleware.js",
  "./store.json"
);
app.use(resources);

// Create the Mock Server Home Page
const homePage = mockServer.homePage();
app.use(homePage);

app.use(mockServer.pageNotFound); // Middleware to return `Page Not Found` as response if the route doesn't match
app.use(mockServer.errorHandler); // Default Error Handler

mockServer.startServer();
// mockServer.startServer(port, host); // can also set port and host here

//or
// Use  mockServer.launchServer which does every above and starts the server.

/* mockServer.launchServer(
  "./db.js",
  "./injectors.json",
  "./middleware.js",
  "./rewriters.json",
  "./store.json"
) */

// or
// You can also run thru CLI command

// mock-server --watch --db=db.json --m=middleware.js --i=injectors.json --r=rewrites.json --s=store.json
