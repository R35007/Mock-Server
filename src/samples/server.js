const { MockServer } = require("@r35007/mock-server");
// const MockServer = require("@r35007/mock-server").default; // For default import

const log = false; // Set to true to see setter logs. It will not be shown if quiet is set to true.
const quiet = false; // Set to true to avoid console logs
const port = 3000; // Set Port to 0 to pick a random available port. default: 3000
const host = "localhost"; // Set empty string to set your Local Ip Address
const config = { root: __dirname, port, host, quiet };
const mockServer = MockServer.Create(config);

const app = mockServer.app;

// Sets global injectors, middlewares, store and rewriters
mockServer.setData({
  injectors: "./injectors.json",
  middlewares: "./middlewares.js",
  store: "./store.json",
}, { log }) // pass mockServer instance to use it in middleware.js method

// Make sure to use this at first, before all the resources
const rewriter = mockServer.rewriter("./rewriters.json");
app.use(rewriter);

// Returns the default middlewares
const defaultsMiddlewares = mockServer.defaults();
app.use(defaultsMiddlewares);

// add your authorization logic here
const isAuthorized = (_req) => true;

// Custom Middleware
app.use((req, res, next) => {
  if (isAuthorized(req)) return next(); // continue to Mock Server router
  res.sendStatus(401);
});

// Custom Routes
// This route will not be listed in Home Page.
app.get("/echo", (req, res) => res.jsonp(req.query));

// Creates resources and returns the express router
const resources = mockServer.resources("./db.json", { log });

resources.create("/path/to/route")
  .mock({})
  .delay(2000)
  .done();

resources.create("/path/to/route/2")
  .mock({ data: "Working" })
  .done();

resources.create("/path").done();

app.use(resources.router);

// Create the Mock Server Home Page
const homePage = mockServer.homePage({ log });
app.use(homePage);

app.use(mockServer.pageNotFound); // Middleware to return `Page Not Found` as response if the route doesn't match
app.use(mockServer.errorHandler); // Default Error Handler

mockServer.startServer()
// mockServer.startServer(port, host); // can also set port and host here

//or
// Use  mockServer.launchServer which does every above and starts the server.

// mockServer.launchServer("./db.js", {
//   injectors: "./injectors.json",
//   middlewares: "./middleware.js",
//   rewriters: "./rewriters.json",
//   store: "./store.json",
//   log: true
// })

// or
// You can also run thru CLI command

// mock-server --watch --db=db.json --m=middleware.js --i=injectors.json --r=rewrites.json --s=store.json
