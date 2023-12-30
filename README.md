# Mock Server[](#mock-server) [![](https://img.shields.io/npm/v/@r35007/mock-server?label=npm)](https://img.shields.io/npm/v/@r35007/mock-server?label=npm) [![](https://img.shields.io/npm/l/@r35007/mock-server?color=blue)](https://img.shields.io/npm/l/@r35007/mock-server?color=blue) [![](https://img.shields.io/npm/types/@r35007/mock-server)](https://img.shields.io/npm/types/@r35007/mock-server)

<META name="description">
Get a full REST API with <b>zero coding</b> in <b>less than 30 seconds</b> (seriously)</br></br>
Created with &lt;3 for front-end developers who need a quick back-end for prototyping and mocking. </br>
Now also available as a VSCodeExtension <a href="https://marketplace.visualstudio.com/items?itemName=Thinker.mock-server">thinker.mock-server</a>.
</META>

## Table of contents

<details>
  <summary>Details</summary>

- [Getting started](#getting-started)
- [CLI Usage](#cli-usage)
- [Using JS Module](#using-js-module)
- [Database](#database)
- [Middlewares](#middlewares)
- [Injectors](#injectors)
- [Store](#store)
- [Rewriters](#rewriters)
- [Helper Middlewares](#helper-middlewares)
- [Route Config](#route-config)
- [Set Custom Delay](#set-custom-delay)
- [Set Custom StatusCode](#set-custom-statuscode)
- <details style="margin-bottom: 10px">
      <summary><a href="#fetch-file-or-url">Fetch File or Url</a></summary>
      <ul>
        <li> <a href="#fetch-file">Fetch File</a> </li>
        <li> <a href="#fetch-data-from-url">Fetch Data From URL</a> </li>
        <li> <a href="#axios-fetch-request">Axios Fetch Request</a> </li>
        <li> <a href="#fetch-count">Fetch Count</a> </li>
        <li> <a href="#skip-fetch-error">Skip Fetch Error</a> </li>
      </ul>
  </details>

- [Specific Middlewares](#specific-middlewares)
- [App Configuration](#app-configuration)
- [Locals](#locals)
- [Home Page Routes](#home-page-routes)
- <details style="margin-bottom: 10px">
      <summary><a href="#api">API</a></summary>
      <ul>
        <li> <a href="#mockserver">MockServer</a> </li>
        <li> <a href="#create">Create</a> </li>
        <li> <a href="#destroy">Destroy</a> </li>
        <li> <a href="#launchserver">launchServer</a> </li>
        <li> <a href="#rewriter">rewriter</a> </li>
        <li> <a href="#defaults">defaults</a> </li>
        <li> <a href="#resources">resources</a> </li>
        <li> <a href="#homepage">homePage</a> </li>
        <li> <a href="#startserver">startServer</a> </li>
        <li> <a href="#stopserver">stopServer</a> </li>
        <li> <a href="#resetserver">resetServer</a> </li>
        <li> <a href="#resetdb">resetDb</a> </li>
        <li> <a href="#pagenotfound">pageNotFound</a> </li>
        <li> <a href="#errorhandler">errorHandler</a> </li>
        <li> <a href="#getters">Getters</a> </li>
        <li> <a href="#setters">Setters</a> </li>
        <li> <a href="#libs">Libs</a> </li>
        <li> <a href="#validators">Validators</a> </li>
      </ul>
  </details>

- [VS Code Extension](#vs-code-extension)
- [Author](#author)
- [License](#license)
</details>

## Getting started

Install Mock Server

```sh
npm install -g @r35007/mock-server @r35007/mock-server-cli
```

Run init command to create sample server files.

```sh
mock-server --init
```

Start Mock Server

```sh
mock-server
```

Now if we go to [http://localhost:3000/posts](http://localhost:3000/posts), we'll get

```json
[{ "id": 1, "title": "mock-server", "author": "r35007" }]
```

## CLI Usage

```sh
$ mock-server --help
mock-server [options] <source>

Options:
  -c, --config              Path to config file                   [string]  [default: "mock-server.json"]
  -P, --port                Set port                              [number]  [default: 3000]
  -H, --host                Set host                              [string]  [default: "localhost"]
  -r, --root                Set root directory.                   [string]  [default: "./"]
  -s, --static              Set static files directory            [string]  [default: "./public"]
  -b, --base                Set base route path                   [string]  [default: ""]
      --db                  Path to database file                 [string]
      --middlewares, --md   Path to middlewares file              [string]
      --injectors, --in     Path to Injectors file                [string]
      --store, --st         Path to Store file                    [string]
      --rewriters, --rw     Path to Rewriter file                 [string]
      --id                  Set database id property              [string]  [default: "id"]
      --init                Create a sample server files          [boolean]  [default: false]
      --dbMode, --dm        Set Db mode                           [string]  [default: "mock"] [choices: "mock", "dev", "multi"]
      --snapshots, --ss     Set snapshots directory               [string]  [default: "./"]
      --reverse, --rv       Generate Route in revere order        [boolean] [default: false]
      --readOnly, --ro      Allow only GET requests               [boolean] [default: false]
      --noCors, --nc        Disable Cross-Origin Resource Sharing [boolean] [default: false]
      --noGzip, --ng        Disable GZIP Content-Encoding         [boolean] [default: false]
      --noCache, --nch      Disable Caching                       [boolean] [default: true]
      --bodyParser, --bp    Enable body-parser                    [boolean] [default: true]
      --cookieParser, --cp  Enable cookie-parser                  [boolean] [default: true]
  -l, --logger              Enable logger                         [boolean] [default: true]
      --log                 Enable Setter Logs                    [boolean] [default: false]
  -w, --watch               Watch for changes                     [boolean] [default: false]
  -q, --quiet               Prevent console logs                  [boolean] [default: false]
  -h, --help                Show help                             [boolean]
  -v, --version             Show version number                   [boolean]

Examples:
  mock-server --init
  mock-server db.json
  mock-server --watch db.json
  mock-server http://jsonplaceholder.typicode.com/db

https://r35007.github.io/Mock-Server/
```

## Using JS Module

Create `server/index.js` File

```js
const { MockServer } = require('@r35007/mock-server');
const mockServer = MockServer.Create({ root: __dirname });
mockServer.launchServer('./db.json');
```

or

```js
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
```

Now go to terminal and type the following command to start the Mock Server.

```sh
node server
```

For more api reference please click [here](#api),

## Database

We can add the database in three ways. Using `setData`, `setDb` or `resources.`
The easy and efficient way to add the database is using `resources`.

Create `db.json`

```jsonc
{
  "posts": [{ "id": 1, "title": "mock-server", "author": "r35007" }],
  "comments": [{ "id": 1, "body": "some comment", "postId": 1 }],
  "profile": { "name": "r35007" }
}
```

Now in `server.js`

```js
const { MockServer } = require('@r35007/mock-server');

const mockServer = MockServer.Create({ root: __dirname }); // Create Mock Server instance with custom config.

const app = mockServer.app;

// Adds Database and returns a new express router
const resources = mockServer.resources('./db.json');
app.use(resources.router);

// Add new database. This will be added to the existing database and will not override the existing route if exist
const newDb = {
  users: [
    { id: 1, name: 'foo' },
    { id: 2, name: 'bar' },
  ],
  profile: { name: 'foo' }, // will not be added since its already exist in resource
};
const newResource = mockServer.resources(newDb);
app.use(resources.router);

mockServer.startServer();
```

#### **Database with Custom Options**

We can create database with custom injectors, middlewares, dbMode etc..

For Example: `server.js`

```js
const { MockServer } = require('@r35007/mock-server');

const mockServer = MockServer.Create({ root: __dirname }); // Create Mock Server instance with custom config.

const app = mockServer.app;

// Created new database with custom injectors and middlewares.
// These injectors and middlewares will not added to the global instance of the Mock Server
// Which means that these injectors and middleware will only be applied to todos database
const todos = {
  todos: [
    { id: 1, title: 'Todo 1', completed: false },
    { id: 2, title: 'Todo 2', completed: false },
  ],
};

const injectors = [{ routes: '/(.*)', delay: 1000, middlewares: ['log'] }];

const middlewares = {
  log: (req, res) => {
    console.log(req.url);
    res.send(res.locals.data);
  },
};
const todosResource = mockServer.resources(todos, {
  injectors,
  middlewares,
});
app.use(todosResource.router);

mockServer.startServer();
```

Please check [resources](#resources) api for more custom option reference.

#### **Database with Create method**

We can create database using create method by resources.

For Example: `server.js`

```js
const { MockServer } = require("@r35007/mock-server");
const mockServer = MockServer.Create({ root: __dirname });
const app = mockServer.app;
const resources = mockServer.resources();

resources.create("/todos", (req, res, next) => {next()})
  .mock({"userId": 1 "id": 1 "title": "Marvel" "completed": false})
  .delay(1000) // delay in milliseconds
  .done(); //  Make sure to call done method to create the route.

resources.create("/photos")
  .fetch("https://jsonplaceholder.typicode.com/photos")
  .fetchCount(3);
  .done();

const dbMode = 'multi';
resources.create("/users")
  .send("https://jsonplaceholder.typicode.com/users", dbMode) // value will be to set to `mock` or `fetch` based on dbMode
  .done();

resources.create("/posts")
  .send({ userId: 1 id: 1 title: "Marvel" body: "My First post"})
  .done();

app.use(resources.router);

mockServer.startServer();
```

All available methods to create a route.
`server.js`

```js
const { MockServer } = require('@r35007/mock-server');
const mockServer = MockServer.Create({ root: __dirname });
const app = mockServer.app;
const resources = mockServer.resources();

middlewares = [
  (req, res, next) => {
    next();
  },
  (req, res, next) => {
    next();
  },
];

const db = resources
  .create('/todos', ...middlewares) // can give n number of middlewares and names here
  .send('My Response', mockServer.config.dbMode) // this value will be set to `mock` or `fetch` based on dbMode. alias rely
  .id('todos')
  .description('todos route')
  .mock({ userId: 1, id: 1, title: 'Marvel', completed: false })
  .fetch('https://jsonplaceholder.typicode.com/todos')
  .mockFirst(false)
  .statusCode(200) // alias status(200) can also be used
  .delay(0) // delay in milliseconds
  .fetchCount(1)
  .skipFetchError(false)
  .directUse(false)
  .headers({}) // Set response Headers
  .done({ log: true }); //  Make sure to call done method to create the route.
console.log(db);
/* db will return the generated db object. This will not be added to the mockserver db until we call done() method
{
  "/todos": {
    "id":"todos",
    "description": "todos route",
    "mock":{
      "userId": 1,
      "id": 1,
      "title": "Marvel",
      "completed": false
    },
    "fetch": "https://jsonplaceholder.typicode.com/todos",
    "mockFirst": false,
    "statusCode": 200,
    "delay": 0,
    "fetchCount": 1,
    "skipFetchError": false,
    "directUse": false,
    "headers": {}
  }
}
*/

app.use(resources.router);

mockServer.startServer();
```

Please check [resources](#resources) api for more custom option reference.

## Middlewares

We can use the middlewares by setting it using `setData` or `setMiddlewares`.

For Example: `middlewares.js`

```js
const isAuthorized = (_req) => true;

const auth = (req, res, next) => {
  if (isAuthorized(req)) return next(); // continue to Mock Server router
  res.sendStatus(401);
};

const DataWrapper = (req, res, next) => {
  res.locals.data = {
    status: 'Success',
    message: 'Retrieved Successfully',
    result: res.locals.data,
  };
  next();
};

module.exports = (mockServer) => {
  const { app, routes, data, getDb, getStore } = mockServer || {};
  const { config, db, injectors, middlewares, rewriters, store } = data || {};
  // Our Global middleware logic here before setting default middlewares by the MockServer.

  return {
    _globals: [auth], // These middlewares will be used after the default middlewares
    DataWrapper, // This can used in as a specific route middleware using route configs
  };
};
```

`server.js`

```js
const { MockServer } = require('@r35007/mock-server');

const mockServer = MockServer.Create({ root: __dirname });
const app = mockServer.app;

const defaults = mockServer.defaults();
app.use(defaults);

// Always set middlewares after using default middlewares.
// These middlewares will be set to mockServer instance and can be accessed across all routes.
mockServer.setMiddlewares('./middlewares.js');
app.use(mockServer.middlewares._globals);

const resources = mockServer.resources({
  '/fetch/users1/customMiddleware': {
    _config: true,
    fetch: 'http://jsonplaceholder.typicode.com/users',
    middlewares: ['DataWrapper'], // Picks the DataWrapper middleware from middlewares.js
  },
});
app.use(resources.router); // Add Database
```

Please check [Setters](#setters) for more api reference.

#### **Direct Middleware Use**

Usually all the middlewares in the route will be wrapped by some helper middlewares to set delay, get fetch data, set locals etc..
If we wish to provide a middlewares without any wrappers set `directUse` to `true`.
For Example: `db.js`

```js
const db = {
  "/static/app1": express.static("./path/to/build/folder/app1")
  "/static/app2": { _config: true, middlewares: express.static("./path/to/build/folder/app2"), directUse: true }
  "/fetch/users": {
    _config: true,
    fetch: "http://jsonplaceholder.typicode.com/users",
    middlewares:(req, res) => { res.send("custom response")},
    directUse: true
  }
}
```

Note: `/fetch/users` wont work since it wont be wrapped by helper middlewares and so no other route config would work except the given middleware if provided.

## Injectors

Here we are explicitly injecting `delay`, `middlewares`, `statusCode` to the `/posts` route.
We can add any route configs to a specific or to a group of routes using Injectors.

- Injectors use `path-to-regexp` package for route pattern recognition.
- Click [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) for more details.

For Example : `injectors.json`

```jsonc
[
  { "routes": "/posts", "delay": 2000 } // Adds delay of 2 seconds only to /posts route
  { "routes": "/comments/:id", "statusCode": 500 } // Adds statusCode of 500 for all the route that matches the pattern /comments/:id
]
```

`server.js`

```js
const { MockServer } = require('@r35007/mock-server');

const mockServer = MockServer.Create({ root: __dirname, dbMode: 'fetch' });
const resources = mockServer.resources({
  '/posts': 'http://jsonplaceholder.typicode.com/posts', // have delay of 2 seconds
  '/comments/1': 'http://jsonplaceholder.typicode.com/comments/1', // sets status code of 500
  '/comments/2': 'http://jsonplaceholder.typicode.com/comments/2', // sets status code of 500
});

const app = mockServer.app;

// These injectors will be set to mockServer instance and be access across all routes
mockServer.setInjectors('./injectors.json');
app.use(mockServer.middlewares._globals);

// Can also set injectors using setData
// mockServer.setData({ injectors:  "./injectors.json"});

app.use(resources.router); // Add Database
```

Please check [Setters](#setters) for more api reference.

### **Override Existing Route Configs**

Setting `override` flag to true helps to override the existing config of that route.

For example :

`injectors.json`

```jsonc
[
  {
    "routes": ["/injectors/2"],
    "override": true,
    "mock": "This data is injected using the injectors by matching the pattern '/injectors/2'."
  },
  {
    "routes": ["/injectors/:id"],
    "override": true,
    "exact": true,
    "statusCode": 200,
    "mock": "This data is injected using the injectors by exactly matching the route '/injectors/:id'."
  },
  {
    "routes": ["/(.*)"],
    "override": true,
    "middlewares": ["...", "CustomLog"]
  }
]
```

Note: Use `["..."]` If we want to add the existing middlewares.

### **Common Route Configs**

Using wildcards we can set a common route configs to all the routes.
`/(.*)` - matches all the routes.

For example :

`injectors.json`

```jsonc
[
  {
    "routes": ["/(.*)"],
    "description": "This Description is injected using the injectors. Set 'Override' flag to true to override the existing config values."
  },
  {
    "routes": ["/(.*)"],
    "override": true,
    "middlewares": ["...", "CustomLog"]
  }
]
```

Make sure we give `/(.*)` at the end of the `injectors.json` object to set route configs to all the routes.

## Store

Store used to store any values which can be used later for any purpose like response manipulation or logging etc..

We can set store values using [mockServer.setStore](#setters) or using [mockServer.setData](#setters)

#### **Route Store**

Route store helps to store any values which can be accessed on by that particular route.
This stores values cannot be able to accessed by the other routes.
Route Store can be accessed using `res.locals.routeConfig.store` inside the middleware.

The middlewares `_IterateRoutes` and `_IterateResponse` uses the Route store to manipulate response.

#### **Local Store**

Local Store helps to store and share data between routes.
This can be accessed using `res.locals.getStore()` inside the middleware.

## Rewriters

Create a `rewriters.json` file. Pay attention to start every route with `/`.

- Rewriters use `express-urlrewrite` package to rewrite the urls.
- Click [here](https://www.npmjs.com/package/express-urlrewrite) for more information about url rewrite.

`rewriters.json`

```jsonc
{
  "/api/*": "/$1",
  "/:resource/:id/show": "/:resource/:id",
  "/posts/:category": "/posts?category=:category",
  "/articles?id=:id": "/posts/:id"
}
```

`server.js`

```js
const mockServer = MockServer.Create();
const app = mockServer.app;
const rewriters = mockServer.Rewriter('./rewriters.json');
app.use(rewriters); // Make sure to use it before all the resources
```

Now we can access resources using additional routes.

```sh
/api/posts # → /posts
/api/posts/1  # → /posts/1
/posts/1/show # → /posts/1
/posts/javascript # → /posts?category=javascript
/articles?id=1 # → /posts/1
```

## Helper Middlewares

Use the helper middleware to speedup our development and for ease of access.
By default some helper middlewares used for a route.

### Default Helper middlewares

```js
const middlewares = [
  _SetDelay, // sets the delay
  _Fetch, // fetches the data from file or url
  _SetStatusCode, // sets status code
  _SetHeaders, // sets headers
  _CrudOperation, // does CRUD operations
  ...userMiddlewares, // Our cust user middleware will be called here
  _SetStatusCode, // sets status code
  _SetHeaders, // sets headers
  _SendResponse, // sends the response
];

// or

const middlewares = withHelperWrappers(userMiddlewares); // wraps the user middleware with the helper middlewares
```

Note: These helper middlewares will not be used if we set `directUse: true` in a route config.

### **IterateResponse**

setting middleware to `_IterateResponse` helps to send we a iterate the response one after the other in the mock array for each url hit.

example:

```jsonc
{
  "/middleware/example/_IterateResponse": {
    "_config": true,
    "description": "This route iterates through each data. Try to hit again to see the data change. Note: The data must be of type array",
    "fetch": {
      "url": "http://jsonplaceholder.typicode.com/photos"
    },
    "middlewares": ["_IterateResponse"]
  }
}
```

Now go and hit [http://localhost:3000/middleware/example/\_IterateResponse](http://localhost:3000/middleware/example/_IterateResponse). For each hit we will get the next object in an array from the photos data.

### **IterateRoutes**

setting middleware to `_IterateRoutes` helps to send a iterate the route one after the other in the mock array for each url hit.

example:

```jsonc
{
  "/middleware/example/_IterateRoutes": {
    "_config": true,
    "description": "This route iterates through each route provide in the mock. Try to hit again to see the route change. Note: The data must be of type array",
    "mock": ["/injectors/1", "/injectors/2"],
    "middlewares": ["_IterateRoutes"]
  },
  "/injectors/1": "/injectors/1 data",
  "/injectors/2": "/injectors/2 data"
}
```

Now go and hit [http://localhost:3000/middleware/example/\_IterateRoutes](http://localhost:3000/middleware/example/_IterateRoutes). For each hit the route is passed to next matching url provided in the mock list.

### **CrudOperations**

By default handles all the crud operations of the given data.

Note: The mock must of type Array of objects and must contain a unique value of attribute `id`. This `id` attribute can also be changes using `config.id`.

For example: `config.json`

```jsonc
{
  "id": "_id"
}
```

### **Others**

- `_Fetch` fetches data from file or url.
- `_SetDelay` sets status code from `res.locals.delay`.
- `_SetStatusCode` sets status code from `res.locals.statusCode`.
- `_SetHeaaders` sets headers from `res.locals.headers`.
- `_SendResponse` sends the response from `res.locals.data`.
- `_FetchTillData` helps to fetch the data from url until it get a success data. Once its get the data the fetch call stops and returns the existing data for other route hit.
- `_SetFetchDataToMock` sets every fetchData to Mock. This overrides the existing mock with the `fetchData`.
- `_MockOnly` sends we only Mock data even if there is any `fetchData` or `store` data.
- `_FetchOnly` sends we only Fetch data even if there is any `_mock` or `store` data.
- `_ReadOnly` forbidden every Http method calls except `GET` call.

## App Configuration

Mock Server uses `cosmiconfig` for configuration file support.
This means you can configure `Mock Server` via (in order of precedence):

- A `mock-server` key in your package.json file.
- A `.mock-serverrc`, `.mock-serverrc.json`, `.mock-server.config.json`, `mock-server-config.json` file.
- A `.mockserverrc`, `.mockserverrc.json`, `.mockserver.config.json`, `mockserver-config.json` file.
- A `.mock-serverrc.<js|cjs>`, `.mock-server.config.<js|cjs>`, `mock-server-config.<js|cjs>` file that exports an object using module.exports.
- A `.mockserverrc.<js|cjs>`, `.mockserver.config.<js|cjs>`, `mockserver-config.<js|cjs>` file that exports an object using module.exports.

The configuration file will be resolved starting from the location of the file being formatted, and searching up the file tree until a config file is (or isn’t) found.

Mock Server intentionally doesn’t support any kind of global configuration. This is to make sure that when a project is copied to another computer, Mock Server's behavior stays the same. Otherwise, Mock Server wouldn’t be able to guarantee that everybody in a team gets the same consistent results.

The options you can use in the configuration file are

JSON:

```json
{
  "port": 3000,
  "host": "localhost"
}
```

JS:

```js
module.exports = {
  port: 3000,
  host: 'localhost',
};
```

Complete Options:
JS:

```js
// These are default config.
const path = require('path');
const public = path.join(process.cwd(), 'public');

module.exports = {
  port: 3000, // Set Port to 0 to pick a random available port.
  host: 'localhost', // Set Host to empty string to pick the Local Ip Address.
  root: process.cwd(), // Root path of the server. All paths refereed in db data will be relative to this path
  base: '', // Mount db on a base url
  id: 'id', // Set db id attribute.
  dbMode: 'mock', // Give one of 'multi', 'fetch', 'mock'
  static: public, // Path to host a static files. Give empty string to avoid hosting public folder by default
  reverse: false, // Generate routes in reverse order
  logger: true, // Enable api logger
  noCors: false, // Disable CORS
  noGzip: false, // Disable data compression
  noCache: true, // Disable Caching
  readOnly: false, // Allow only GET calls
  bodyParser: true, // Enable body-parser
  cookieParser: true, // Enable cookie-parser
  quiet: false, // Disable console logs
};
```

#### **dbMode**

The object which has `_config: true` are considered as route configs.
All other values and objects are considered as direct values.
Db mode defines on what config does the direct route value to be assigned.
The object with `_config: true` will not be changed on any `dbMode`.
For Example :

1. `dbMode` is `mock` - All direct values will be assigned to `mock` attribute

```js
const db = {
  route1: 'My Response', // "/route1": { _config: true, mock: "My Response" }
  route2: { data: 'My Response' }, // "/route2": { _config: true, mock: { data: "My Response" } }
  route3: [], // "/route3": { _config: true, mock: [] }
  route4: { _config: true, fetch: 'path/to/file' }, // "/route4": { _config: true, fetch: "path/to/file" }
};
```

2. `dbMode` is `fetch` - All direct values will be assigned to `fetch` attribute

```js
const db = {
  route1: 'path/to/file', // "/route1": { _config: true, fetch: "path/to/file"  }
  route2: { url: 'path/to/file' }, // "/route2": { _config: true, fetch: { url: "path/to/file" } }
  route3: { _config: true, mock: 'My Response' }, // "/route3": { _config: true, mock: "My Response" }
};
```

3. `dbMode` is `multi` - Only direct `string` value will be assigned to `fetch` attribute. All other values will be assigned to `mock` attribute

```js
const db = {
  route1: 'path/to/file', // "/route1": { _config: true, fetch: "path/to/file"  }
  route2: { data: 'My Response' }, // "/route2": { _config: true, mock: { data: "My Response" } }
  route3: [], // "/route3": { _config: true, mock: [] }
  route4: { _config: true, mock: 'My Response' }, // "/route4": { _config: true, mock: "My Response" }
};
```

## Route Config

Route config helps to define a config such as delay. statuscode to a specific route.
Routes which as a object with `_config: true` as considered as a route config.

```ts
interface RouteConfig {
  _config?: boolean; // Make sure to set this to true to use this object as a route configuration.
  id?: string; // sets a base64 encoded route. If not given, will be generated.
  description?: string; // Description about this Route.
  statusCode?: number; // Set custom status code in number between 100 to 600.
  headers?: object; // Set custom response headers.
  delay?: number; // Set custom delay in milliseconds.
  fetch?: string | AxiosRequestConfig; // Set path to fetch a file. Path will be relative to `config.root`. Always make fetch call first.
  fetchCount?: number; // Set custom fetch count. Set to -1 to fetch infinite times. Default: 1
  mock?: any; // Set custom Mock Response. If fetch is given then it returns the fetch response.
  mockFirst?: boolean; // If true, It returns the mock response first else returns the fetch response . Default: false
  skipFetchError?: boolean; // If true it skips any fetch error and send the mock data as response. Default: false.
  store?: object; // Helps to store any values for later use
  middlewares?: express.RequestHandler | Array<express.RequestHandler> | string; // Set custom middleware specific to this route

  // This will be auto generated from the fetch call it makes.
  fetchData?: {
    status?: number;
    message?: string;
    isError?: boolean;
    headers?: any;
    response?: any;
    stack?: any;
  };
  _isFile?: boolean;
  _request?: AxiosRequestConfig;
  _extension?: string;
}
```

Note: Object without `_config: true` will be considered as a direct mock response. Please make sure we set `config: true` to config the route.

## Set Custom Delay

`delay` helps we to set a custom delay to our routes.

```jsonc
{
  "/customDelay": {
    "_config": true,
    "delay": 2000, // The delay must be in milliseconds and of type number
    "description": "Note: give delay in milliseconds",
    "mock": "This is response is received with a delay of 2000 milliseconds"
  }
}
```

Now if we go to [http://localhost:3000/customDelay](http://localhost:3000/customDelay), we'll get the response in a delay of 2 seconds.

## Set Custom StatusCode

`statusCode` helps we set a custom statusCode to our routes.
It must be of type number and between 100 to 600.

```jsonc
{
  "/customStatusCode": {
    "_config": true,
    "statusCode": 500,
    "mock": "This is response is received with a statusCode of 500"
  }
}
```

Now if we go to [http://localhost:3000/customStatusCode](http://localhost:3000/customStatusCode), we'll get the response with a `500` statusCode

## Fetch File or URL

`fetch` helps we get data from url.
The url can either be a http server or a local file.

### **Fetch File**

Give a absolute or a relative path to fetch any file.

```jsonc
{
  "/fetch/local/file": {
    "_config": true,
    "description": "The given fetch path will be relative to the root path given in config",
    "fetch": "./data/users.json"
  }
}
```

Note: The given path will be relative to `config.root`.

### **Fetch Data From URL**

```jsonc
{
  "/fetch/posts/:id": {
    "_config": true,
    "fetch": "https://jsonplaceholder.typicode.com/posts/${req.params.id}"
  }
}
```

### **Axios Fetch Request**

We can also give a fetch as a axios request object with custom options.

```jsonc
{
  "/fetch/posts/:id": {
    "_config": true,
    "description": "Give the `fetch` attribute as a axios request object. enclose the value with ${<variables>} to pass the req values",
    "fetch": {
      "method": "GET",
      "url": "http://jsonplaceholder.typicode.com/posts",
      "params": "${req.params.id}"
    }
  }
}
```

[http://localhost:3000/fetch/posts/2](http://localhost:3000/fetch/posts/2).

Note: To pass any options from the route set the option value as `${<option Name>}`

reserved key words :

- `${config}` - get all config values
- `${req}` - get all req values

### **Fetch Count**

In Route Config setting `fetchCount` will helps to limit the number of fetch calls.
By Default the `fetchCount` is set to `1`.
The fetch data will be set to `fetchData`.

`db.json`

```jsonc
{
  "/fetch/todos/fetchCount/3/times": {
    "_config": true,
    "description": "By default the fetch will be called only one time. We can limit or extend the number of fetch calls using 'fetchCount' attribute",
    "fetch": "http://jsonplaceholder.typicode.com/todos",
    "fetchCount": 3
  },
  "/fetch/albums/fetchCount/Infinite/times": {
    "_config": true,
    "description": "Setting 'fetchCount' to -1 time will helps to make a fetch call on each and every url hit without any limit. By This way we always get a new fresh data from the fetch url.",
    "fetch": "http://jsonplaceholder.typicode.com/albums",
    "fetchCount": -1
  }
}
```

[http://localhost:3000/fetch/todos/fetchCount/3/times](http://localhost:3000/fetch/todos/fetchCount/3/times). - Makes fetch call only for 3 times.

[http://localhost:3000/fetch/todos/fetchCount/Infinite/times](http://localhost:3000/fetch/todos/fetchCount/Infinite/times). - Makes fetch call Infinite times.

### **Skip Fetch Error**

If `skipFetchError` is set to true, It will skip any error in fetch call and instead of returning that fetch error it gives we the mock data.

```jsonc
{
  "/fetch/404/skipFetchError": {
    "_config": true,
    "description": "Bu default fetch returns the actual error if occur. If we set `skipFetchError` flag to true. the If any error occur in fetch call it will then skips the fetch error and return we the mock data",
    "fetch": "http://localhost:3000/404",
    "skipFetchError": true,
    "mock": "This data is returned due to some error in fetch call. We can see the error in 'fetchError' attribute",
    "fetchCount": -1
  }
}
```

## Specific Middlewares

We can add n number of middleware to a route which helps we to manipulate or log the data.

Please check [Middlewares](#middlewares) fro more reference.

`db.js`

```js
const db = {
  '/fetch/users1/customMiddleware': {
    _config: true,
    fetch: 'http://jsonplaceholder.typicode.com/users',
    middlewares: ['DataWrapper'], // Picks the DataWrapper middleware from middlewares.js
  },
  '/fetch/users2/customMiddleware': {
    _config: true,
    fetch: 'http://jsonplaceholder.typicode.com/users',
    middlewares: (req, res, next) => {
      next();
    },
  },
};
```

## Locals

`res.locals` helps to access the current route config, `fetchData`, `store` etc..
Here are the available options in `res.locals`

```ts
interface Locals {
  routePath: string;
  routeConfig: RouteConfig;
  data: any; // response will be sent using this attribute value.
  config: Config; // gives we the current mock server configuration.
  getStore(): object;
  getDb(): object;
}
```

### **Dynamic Route Config**

RouteConfigs are mutable. Means we can able to modify the routeConfigs in runtime using middleware.
For Example:

`middleware.js`

```js
exports._FetchTillData = (_req, res, next) => {
  const locals = res.locals;
  const routeConfig = locals.routeConfig;

  if (!routeConfig.fetchData) return next();

  if (!routeConfig.fetchData.isError) {
    // If fetchData has no error then stop fetching anymore
    routeConfig.fetchCount = 0; // setting fetchCount to zero stops fetching
  } else if (routeConfig.fetchCount !== undefined && routeConfig.fetchCount == 0) {
    // If fetchData has any error then keep on fetching
    routeConfig.fetchCount = -1; // setting fetchCount to -1 does an infinite fetch
  }
  next();
};
```

The above middleware helps to fetch the data from url until it gets a valid success response.

## Home Page Routes

- `Home Page` - [http://localhost:3000](http://localhost:3000)
- `Db` - [http://localhost:3000/\_db](http://localhost:3000/_db)
  - Use [http://localhost:3000/\_db?\_clean=true](http://localhost:3000/_db?_clean=true) to get a clean db data.
  - Use [http://localhost:3000/\_db?\_config=true](http://localhost:3000/_db?_config=true) to get only route configs.
- `Rewriters` - [http://localhost:3000/\_rewriters](http://localhost:3000/_rewriters)
- `Routes` - [http://localhost:3000/\_routes](http://localhost:3000/_routes)
- `Store` - [http://localhost:3000/\_store](http://localhost:3000/_store)
- `Reset Db` - [http://localhost:3000/\_reset](http://localhost:3000/_reset)

## API

### **MockServer**

returns the instance of the mockServer.

```js
const { MockServer } = require('@r35007/mock-server');
const mockServer = new MockServer('./config.json');
```

**`Params`**

| Name   | Type          | Required | Description                           |
| ------ | ------------- | -------- | ------------------------------------- |
| config | string/object | No       | This object sets the port, host etc.. |

### **Create**

returns the single instance of the mockServer.

```js
const { MockServer } = require('@r35007/mock-server');
const mockServer = MockServer.Create('./config.json');
```

**`Params`**

| Name   | Type            | Required | Description                           |
| ------ | --------------- | -------- | ------------------------------------- |
| config | string / object | No       | This object sets the port, host etc.. |

### **Destroy**

Destroy simply stops the server without any exception and resets the server.
returns promise

```js
const { MockServer } = require('@r35007/mock-server');
let mockServer = MockServer.Create();
await MockServer.Destroy(mockServer);
```

**`Params`**

| Name       | Type     | Required | Description                           |
| ---------- | -------- | -------- | ------------------------------------- |
| mockServer | instance | No       | Instance of the MockServer to Destroy |

### **launchServer**

It validates all the params in the MockServer, loads the resources and starts the server.

```js
mockServer.launchServer('./db.json', {
  injectors: './injectors.json',
  middlewares: './middleware.js',
  rewriters: './rewriters.json',
  store: './store.json',
  router: express.Router(),
  log: false,
});
```

**`Params`**

| Name    | Type                 | Required | Description                  |
| ------- | -------------------- | -------- | ---------------------------- |
| db      | string/object/method | No       | Set db resource              |
| options | object               | No       | option to create db resource |

**`[options]`**

| Name        | Type                 | Required | Description                                |
| ----------- | -------------------- | -------- | ------------------------------------------ |
| injectors   | string/object/method | No       | injectors to inject routeconfig to this db |
| middlewares | string/object/method | No       | middlewares of this db                     |
| store       | string/object/method | No       | store of this db                           |
| rewriters   | string/object/method | No       | rewriters of this db                       |
| router      | Express.Router       | No       | Custom Router                              |
| log         | boolean              | No       | If tru it logs the setter log              |

### **rewriter**

Sets the route rewrites and return the router of the rewriters;

```js
const rewriters = mockServer.rewriter('./rewriters.json', {
  log: false,
  root: __dirname,
});
app.use(rewriters);
```

**`Params`**

| Name      | Type            | Required | Description             |
| --------- | --------------- | -------- | ----------------------- |
| rewriters | string / object | No       | Give the Rewrites       |
| options   | object          | No       | option to set rewriters |

**`[options]`**

| Name | Type    | Required | Description                                    |
| ---- | ------- | -------- | ---------------------------------------------- |
| root | string  | No       | To require rewriter file relative to this path |
| log  | boolean | No       | If true it logs the rewriters setting log      |

### **defaults**

returns the list of default middlewares.
Also helps to host a static directory.

```js
const defaults = mockServer.defaults({ static: './public', readOnly: true });
app.use(defaults);
```

- options
  - `static` path to static files
  - `logger` enable logger middleware (default: true)
  - `noGzip` disable Compression (default: false)
  - `noCors` disable CORS (default: false)
  - `readOnly` accept only GET requests (default: false)
  - `bodyParser` enable body-parser middleware (default: true)
  - `cookieParser` enable cookie-parser middleware (default: true)

### **resources**

Create db resources. It uses global injectors, middlewares and config to crete db resource.

```js
const resources = mockServer.resources('./db.json');
app.use(resources.router);
```

Create db resources with custom injectors and middlewares. It won't use global injectors and middlewares.
It sets only db and not the injectors or middlewares.

```js
const resources = mockServer.resources("./db.json", {
  injectors: "./injectors.json",
  middlewares: "./middleware.js",
  root: __dirname,
  dbMode: "mock",
  reverse: false,
  router: express.Router();
  log: false
});

middlewares = (req, res, next) => { next() };

// /todos will be added to existing db
const db = resources
  .create("/todos", middlewares) // can give n number of middlewares and names here
  .send("My Response", 'multi') // response will set to `mock` or `fetch` based on dbMode
  .id("todos")
  .description("todos route")
  .mock({ userId: 1, id: 1, title: "Marvel", completed: false })
  .fetch("https://jsonplaceholder.typicode.com/todos")
  .mockFirst(false)
  .statusCode(200)
  .delay(0) // delay in milliseconds
  .fetchCount(1)
  .skipFetchError(false)
  .directUse(false)
  .headers({}) // set response headers
  .done();

app.use(resources.router);
```

**`Params`**

| Name    | Type                 | Required | Description                  |
| ------- | -------------------- | -------- | ---------------------------- |
| db      | string/object/method | No       | Set db resource              |
| options | object               | No       | option to create db resource |

**`[options]`**

| Name        | Type                    | Required | Description                                |
| ----------- | ----------------------- | -------- | ------------------------------------------ |
| root        | string                  | No       | root to get db from a file                 |
| dbMode      | 'mock'/ 'fetch'/'multi' | No       | dbMode to create resource                  |
| injectors   | string/object/method    | No       | injectors to inject routeconfig to this db |
| middlewares | string/object/method    | No       | middlewares of this db                     |
| reverse     | boolean                 | No       | If true it creates db in reverse order     |
| router      | Express.Router          | No       | Custom Router                              |
| log         | boolean/string          | No       | If tru it logs the resources setting log   |

### **homePage**

Returns Mock Server Home Page router.

```js
const homePage = mockServer.homePage();
app.use(homePage);
```

**`Params`**

| Name | Type    | Required | Description                              |
| ---- | ------- | -------- | ---------------------------------------- |
| log  | boolean | No       | If tru it logs the resources setting log |

### **startServer**

Returns a Promise of `Server`. - helps to start the app server externally

```js
const server = await mockServer.startServer(3000, 'localhost');
```

**`Params`**

| Name | Type   | Required | Description     |
| ---- | ------ | -------- | --------------- |
| port | number | No       | Set custom Port |
| host | string | No       | Set custom Host |

### **stopServer**

Returns a Promise of Boolean. - helps to stop the app server externally

```js
const isStopped = await mockServer.stopServer();
```

### **resetServer**

Clears out all values and resets the server for a fresh start.
By default this method will be called on `mockServer.stopServer()` method.

```js
mockServer.resetServer();
```

### **resetDb**

Returns the routes that are reset.

```js
const routes = mockServer.resetDb(); // If param is not present, it resets all the routes.
```

**`Params`**

| Name       | Type     | Required | Description                      |
| ---------- | -------- | -------- | -------------------------------- |
| ids        | string[] | No       | Give List of route ids to reset  |
| routePaths | string[] | No       | Give List of routePaths to reset |

### **pageNotFound**

It is a middleware to handle a page not found error.
Please use it at the end of all routes.

```js
app.use(mockServer.pageNotFound);
```

### **errorHandler**

It is a middleware to handle a any error occur in server.
Please use it at the end of all routes.

```js
app.use(mockServer.errorHandler);
```

### **Getters**

```js
const MockServer = require('@r35007/mock-server').default;
const mockServer = MockServer.Create();

// Please avoid directly modify or setting values to these variable.
// Use Setter method to modify or set any values.

// server, port, address, listeningTo will be undefined when server is stopped
const  port: number | undefined; // gives current running port.
const  server: Server | undefined; //  gives current running server.
const  address: string | undefined; // gives host ip address.
const  listeningTo: string | undefined; // gives -> http://${host}:${port}/${base} -> http://localhost:3000/api

const app = mockServer.app;
const data = mockServer.data;
// const { db, injectors, middlewares, rewriters, config, store } = mockServer.data

const db = mockServer.db;
const middleware = mockServer.middleware;
const injectors = mockServer.injectors;
const rewriters = mockServer.rewriters;
const config = mockServer.config;
const store = mockServer.store;
const initialDb = mockServer.initialDb;

// Node Package exposes
const _ = MockServer._ // lodash.
const axios = MockServer.axios // axios.
const express = MockServer.express // express.
const chalk = MockServer.chalk // chalk.
const watcher = MockServer.watcher // chokidar.
const pathToRegexp = MockServer.pathToRegexp // pathToRegexp.
const nanoid = MockServer.nanoid // nanoid.
const ora = MockServer.ora // ora
```

### **Setters**

```js
const MockServer = require('@r35007/mock-server').default;
const mockServer = MockServer.Create();

mockServer.setData({ db, injectors, middlewares, rewriters, store, config });

//or

// Please follow the same following order of setting the data
// If merge param is true. it adds the data with the existing data.
mockServer.setConfig(config, { root, merge, log });
mockServer.setMiddlewares(middlewares, { root, merge, log });
mockServer.setInjectors(injectors, { root, merge, log });
mockServer.setRewriters(rewriters, { root, merge, log });
mockServer.setStore(store, { root, merge, log });
mockServer.setDb(Db, { root, merge, log, injectors, reverse, dbMode });

// Set to Defaults
mockserver.setDefaults(); // sets default db, injectors, middlewares, store, rewriters, config
mockserver.setDefaultData(); // sets default injectors, middlewares, store, config
mockserver.setDefaultDb(); // sets default db
mockserver.setDefaultInjectors(); // sets default injectors
mockserver.setDefaultMiddlewares(); // sets default middlewares
mockserver.setDefaultRewriters(); // sets default rewriters
mockserver.setDefaultStore(); // sets default store
mockserver.setDefaultConfig(); // sets default config

mockserver.clearServerAddress(); // sets current port, address, listeningTo, server to `undefined`
mockserver.setExpressApp(); // create a new express app to the MockServer instance.
```

### **Libs**

Few Libraries has been exposed for ease

```js
const {
  MockServer,
  express, // express
  lodash, // lodash
  nanoid, // nanoid
  spinner, // ora
  pathToRegexp, // path-to-regexp
  chalk, // chalk
  axios, // axios
  watcher, // chokidar.
} = require('@r35007/mock-server');
```

### **Validators**

These helps to return a valid data from provided file path or object.

```js
const {
  getValidDb,
  getValidMiddlewares,
  getValidInjectors,
  getValidRewriters,
  getValidConfig,
  getValidStore,
  getValidRouteConfig,
} = require('@r35007/mock-server/dist/utils/validators');

const options = {
  reverse: true, // If true the db will be generated in reverse order
  dbMode: 'fetch', // The direct route value will be set to fetch
};

const root = './';

const db = getValidDb(
  'db.json', // db or HAR
  { injectors, root, reverse, dbMode, mockServer }
); // returns valid Db combined with the given injectors. Also helps to extract a db from HAR file. internally use getValidRouteConfig
const middleware = getValidMiddlewares(middlewares, { root, mockServer }); // returns a valid middleware along with the default middlewares
const injectors = getValidInjectors(injectors, { root, mockServer }); // returns a valid injectors. internally use getValidInjectorConfig
const rewriters = getValidRewriters(rewriters, { root, mockServer }); // returns a valid rewriters
const config = getValidConfig(config, { root, mockServer }); // returns a valid config combined with the default configs
const store = getValidStore(store, { root }); // returns a valid store
const routeConfig = getValidRouteConfig(route, routeConfig); // returns a valid routeconfig used by getValidDb
const injectorConfig = getValidInjectorConfig(route, routeConfig); // returns a valid injectorsConfig used by getValidInjectors
const route = getValidRoute(route); // splits route by comma and adds a slash ('/') prefix to the routes
```

## VS Code Extension

[Thinker.mock-server](https://marketplace.visualstudio.com/items?itemName=Thinker.mock-server)

![thinker.mock-server](https://user-images.githubusercontent.com/23217228/206978718-3f4bdcbd-2e7a-4d7b-b4aa-651165a5781b.gif)

## Author

**Sivaraman** - [sendmsg2siva.siva@gmail.com](sendmsg2siva.siva@gmail.com)

- _GitHub_ - [https://github.com/R35007/Mock-Server](https://github.com/R35007/Mock-Server)

## License

MIT
