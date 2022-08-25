# Mock Server[](#mock-server) [![](https://img.shields.io/npm/v/@r35007/mock-server?label=npm)](https://img.shields.io/npm/v/@r35007/mock-server?label=npm) [![](https://img.shields.io/npm/l/@r35007/mock-server?color=blue)](https://img.shields.io/npm/l/@r35007/mock-server?color=blue) [![](https://img.shields.io/npm/types/@r35007/mock-server)](https://img.shields.io/npm/types/@r35007/mock-server)


<META name="description">
Get a full REST API with <b>zero coding</b> in <b>less than 30 seconds</b> (seriously)</br></br>
Created with <3 for front-end developers who need a quick back-end for prototyping and mocking.
Now also available as a VSCodeExtension <a href="https://marketplace.visualstudio.com/items?itemName=Thinker.mock-server">thinker.mock-server</a>.
</META>

## Table of contents

- [Getting started](#getting-started)
- [Using JS Module](#using-js-module)
- [Route Config](#route-config)
  - [Set Delay Response](#set-delay-response)
  - [Set Custom StatusCode](#set-custom-statuscode)
  - [Fetch Data From URL](#fetch-data-from-url)
    - [Fetch File](#fetch-file)
    - [Custom Fetch Options](#custom-fetch-options)
  - [Fetch Count](#fetch-count)
  - [Skip Fetch Error](#skip-fetch-error)
  - [Add Middleware](#add-middleware)
  - [Ignore Middleware Wrappers](#ignore-middleware-wrappers)
- [Middleware Utils](#middleware-utils)
  - [IterateResponse](#iterateresponse)
  - [IterateRoutes](#iterateroutes)
  - [AdvancedSearch](#advancedsearch)
    - [Filter](#filter)
    - [Paginate](#paginate)
    - [Sort](#sort)
    - [Slice](#slice)
    - [Operators](#operators)
    - [Full text search](#full-text-search)
  - [CrudOperations](#crudoperations)
  - [FetchTillData](#fetchtilldata)
  - [SetFetchDataToMock](#setfetchdatatomock)
  - [SetStoreDataToMock](#setstoredatatomock)
  - [MockOnly](#mockonly)
  - [FetchOnly](#fetchonly)
  - [ReadOnly](#readonly)
  - [Fetch](#fetch)
  - [FetchFile](#fetchfile)
  - [FetchUrl](#fetchurl)
- [Injectors](#injectors)
  - [Inject Route Configs](#inject-route-configs)
  - [Override Existing Route Configs](#override-existing-route-configs)
  - [Common Route Configs](#common-route-configs)
- [Store Data](#store-data)
  - [Route Store](#route-store)
  - [Local Store](#local-store)
- [Route Rewriters](#route-rewriters)
- [Locals](#locals)
  - [Dynamic Route Config](#dynamic-route-config)
- [Config](#config)
  - [Db Mode](#db-mode)
- [Home Page](#home-page)
- [CLI Usage](#cli-usage)
- [API](#api)
  - [MockServer](#mockserver)
  - [Create](#create)
  - [Destroy](#destroy)
  - [launchServer](#launchserver)
  - [rewriter](#rewriter)
  - [defaults](#defaults)
  - [resources](#resources)
  - [homePage](#homepage)
  - [startServer](#startserver)
  - [stopServer](#stopserver)
  - [resetServer](#resetserver)
  - [resetDb](#resetdb)
  - [pageNotFound](#pagenotfound)
  - [errorHandler](#errorhandler)
  - [Getters](#getters)
  - [Setters](#setters)
  - [Validators](#validators)
- [VS Code Extension](#vs-code-extension)
- [Author](#author)
- [License](#license)

## Getting started

Install Mock Server

```sh
npm install -g @r35007/mock-server
```

Create a `db.json` file with some data.

```jsonc
{
  "posts": [{ "id": 1, "title": "mock-server", "author": "r35007" }],
  "comments": [{ "id": 1, "body": "some comment", "postId": 1 }],
  "profile": { "name": "r35007" }
}
```

Start Mock Server

```sh
mock-server --watch ./db.json
```

Now if you go to [http://localhost:3000/posts/1](http://localhost:3000/posts/1), you'll get

```json
{ "id": 1, "title": "mock-server", "author": "r35007" }
```

## Using JS Module

Install nodemon for watching changes

```sh
npm install -g nodemon
```

Create `server.js` File

```js
const { MockServer } = require("@r35007/mock-server");
const config = { root: __dirname };
const mockServer = MockServer.Create(config);

mockServer.launchServer("./db.js", {
  injectors: "./injectors.json",
  middlewares: "./middleware.js",
  rewriters: "./rewriters.json",
  store: "./store.json",
});
```

or

```js
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

// Sets global injectors, middlewares and store
mockServer.setData({
  injectors: "./injectors.json",
  middlewares: "./middleware.js",
  store: "./store.json",
});

// Creates resources and returns the express router
const resources = mockServer.resources("./db.js");
app.use(resources);

// Create new Resource with custom injectors.
// This db will be added to existing mockServer.db
// This injectors will not added to global injectors
const newResource = mockServer.resources(
  { newRoute: "This is a new Route" },
  {
    injectors: [
      {
        routes: ["/(.*)"],
        description: "This description will only be added to this route",
      },
    ],
  }
);
app.use(newResource);

// Create the Mock Server Home Page
const homePage = mockServer.homePage();
app.use(homePage);

app.use(mockServer.pageNotFound); // Middleware to return `Page Not Found` as response if the route doesn't match
app.use(mockServer.errorHandler); // Default Error Handler

mockServer.startServer();
// mockServer.startServer(port, host); // can also set port and host here
```

Now go to terminal and type the following command to start the Mock Server.

```sh
nodemon server.js
```

## **Route Config**

Create a db.json file. Pay attention to start every route with /.
For Example:

`db.json`

```jsonc
{
  "/route/1, /route/2": {
    // /route/1 and /route/2 shares the same config and mock data
    "_config": true, // Make sure to set this to true to use this object as a route configuration.
    "id": "id-unique", // sets a base64 encoded route
    "description": "", // Description about this Route.
    "delay": 2000, // in milliseconds
    "statusCode": 200, // in number between 100 to 600
    "mockFirst": false, // If true, It sends the mock first else try to fetch first.
    "middlewares": ["_IterateResponse"], // list of middleware names and methods to be called
    "ignoreMiddlewareWrappers": false, // !Be cautious : If true it wont add any helper middleware wrappers. If true providing a middleware is must and no use of any other config like mock, fetch, predefined middlewares etc...
    "fetch": "./myFile.json", // this path will be relative to `config.root`
    "fetchCount": 5, // Set to -1 to fetch infinite times.
    "mock": [{ "name": "foo" }, { "name": "bar" }],
    "skipFetchError": false, // If True it skips any fetch error and send the mock data
    "fetchData": {
      "status": 200,
      "isError": false,
      "response": "" // contains the fetch response
    },
    "store": {}, // helps to store any values for later use

    // System generated.
    //Please don't set any values to the below attributes.
    "_isFile": false, // sets to true if the given fetch url is a file type url
    "_request": {}, // give the actual axios request object of the fetch call
    "_extension": "" // If the given url is a file type url then it give the extension of the file.
  },
  "/routeName3": {
    "name": "foo",
    "age": "bar",
    "description": "Note: Since _config attribute is not set to true this whole object will be sent as a response"
  }
}
```

> Note: `fetch` can be either `string` type or `AxiosRouteConfig` type.
> see [Fetch Data From URL](#fetch-data-from-url) for more configuration.

### **Set Delay Response**

`delay` helps you to set a custom delay to your routes.

> Note: The delay must be in milliseconds and of type number

```jsonc
{
  "/customDelay": {
    "_config": true,
    "delay": 2000,
    "description": "Note: give delay in milliseconds",
    "mock": "This is response is received with a delay of 2000 milliseconds"
  }
}
```

Now if you go to [http://localhost:3000/customDelay](http://localhost:3000/customDelay), you'll get the response in a delay of 2 seconds.

### **Set Custom StatusCode**

`statusCode` helps you set a custom statusCode to your routes.
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

Now if you go to [http://localhost:3000/customStatusCode](http://localhost:3000/customStatusCode), you'll get the response with a `500` statusCode

### **Fetch Data From URL**

`fetch` helps you get data from url.
The url can either be a http server or a local file server.

#### **Fetch File**

Give a absolute or a relative path to fetch any file and get as a response.

> Note: The given relative path will be relative to `config.root`.

```jsonc
{
  "/fetch/local/file": {
    "_config": true,
    "description": "The given fetch path will be relative to the root path given in config",
    "fetch": "./data/users.json"
  }
}
```

[http://localhost:3000/fetch/local/file](http://localhost:3000/fetch/local/file).

#### **Custom Fetch Options**

You can also give a fetch as a axios request object with custom options.

```jsonc
{
  "/fetch/posts/customOptions/:id": {
    "_config": true,
    "description": "Give the `fetch` attribute as a axios request object. enclose the value with ${<variables>} to pass the req values",
    "fetch": {
      "method": "GET",
      "url": "http://jsonplaceholder.typicode.com/posts",
      "params": "${req.params.id}"
    },
    "fetchCount": 5
  }
}
```

[http://localhost:3000/fetch/posts/customOptions/2](http://localhost:3000/fetch/posts/customOptions/2).

> Note: The to pass any options from the route set the option value as `${<option Name>}`

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
    "description": "By default the fetch will be called only one time. You can limit or extend the number of fetch calls using 'fetchCount' attribute",
    "fetch": "http://jsonplaceholder.typicode.com/todos",
    "fetchCount": 3
  },
  "/fetch/albums/fetchCount/Infinite/times": {
    "_config": true,
    "description": "Setting 'fetchCount' to -1 time will helps to make a fetch call on each and every url hit without any limit. By This way you always get a new fresh data from the fetch url.",
    "fetch": "http://jsonplaceholder.typicode.com/albums",
    "fetchCount": -1
  }
}
```

[http://localhost:3000/fetch/todos/fetchCount/3/times](http://localhost:3000/fetch/todos/fetchCount/3/times). - Makes fetch call only for 3 times.

[http://localhost:3000/fetch/todos/fetchCount/Infinite/times](http://localhost:3000/fetch/todos/fetchCount/Infinite/times). - Makes fetch call Infinite times.

### **Skip Fetch Error**

If `skipFetchError` is set to true, It will skip any error in fetch call and instead of returning that fetch error it gives you the mock data.

```jsonc
{
  "/fetch/404/skipFetchError": {
    "_config": true,
    "description": "Bu default fetch returns the actual error if occur. If you set `skipFetchError` flag to true. the If any error occur in fetch call it will then skips the fetch error and return you the mock data",
    "fetch": "http://localhost:3000/404",
    "skipFetchError": true,
    "mock": "This data is returned due to some error in fetch call. You can see the error in 'fetchError' attribute",
    "fetchCount": -1
  }
}
```

[http://localhost:3000/fetch/404/skipFetchError](http://localhost:3000/fetch/404/skipFetchError).

### **Add Middleware**

You can add n number of middleware to a route which helps you to manipulate or log the data.

`middleware.js`

```js
exports.DataWrapper = (req, res, next) => {
  res.locals.data = {
    status: "Success",
    message: "Retrieved Successfully",
    result: res.locals.data,
  };
  next();
};
```

`db.js`

```js
const db = {
  "/fetch/users1/customMiddleware": {
    _config: true,
    fetch: "http://jsonplaceholder.typicode.com/users",
    middlewares: ["DataWrapper"], // Picks the DataWrapper middleware from middleware.js
  },
  "/fetch/users2/customMiddleware": {
    _config: true,
    fetch: "http://jsonplaceholder.typicode.com/users",
    middlewares: [
      (req, res, next) => {
        res.locals.data = {
          status: "Success",
          message: "Retrieved Successfully",
          result: res.locals.data,
        };
        next();
      },
    ],
  },
};
```

[http://localhost:3000/fetch/users/customMiddleware](http://localhost:3000/fetch/users/customMiddleware).

### **Ignore Middleware Wrappers**

Usually all the middlewares in the route will be wrapped by some helper middlewares to set delay, get fetch data, set locals etc..
If we wish to provide a middlewares without any wrappers set `ignoreMiddlewareWrappers` to `true`.
For Example:
`db.js`

```js
const db = {
  "/static/app1": express.static("./path/to/build/folder/app1") // will ignore helper middleware wrappers
  "/static/app2": { _config: true, middlewares: express.static("./path/to/build/folder/app2"), ignoreMiddlewareWrappers: true }
  "/fetch/users": { _config: true, fetch: "http://jsonplaceholder.typicode.com/users", ignoreMiddlewareWrappers: true }
}
```

> Note: `/fetch/users` wont work since it wont be wrapped by helper middlewares and so no other route config would work except the given middleware if provided.

## **Middleware Utils**

Use the predefined middleware to speedup your development and for ease of access.

### **IterateResponse**

setting middleware to `_IterateResponse` helps to send you a iterate the response one after the other in the mock array for each url hit.

example:

```jsonc
{
  "/middleware/utils/example/_IterateResponse": {
    "_config": true,
    "description": "This route iterates through each data. Try to hit again to see the data change. Note: The data must be of type array",
    "fetch": {
      "url": "http://jsonplaceholder.typicode.com/photos"
    },
    "middlewares": ["_IterateResponse"]
  }
}
```

Now go and hit [http://localhost:3000/middleware/utils/example/\_IterateResponse](http://localhost:3000/middleware/utils/example/_IterateResponse). For each hit you will get the next object in an array from the photos data.

### **IterateRoutes**

setting middleware to `_IterateRoutes` helps to send you a iterate the route one after the other in the mock array for each url hit.

example:

```jsonc
{
  "/middleware/utils/example/_IterateRoutes": {
    "_config": true,
    "description": "This route iterates through each route provide in the mock. Try to hit again to see the route change. Note: The data must be of type array",
    "mock": ["/injectors/1", "/injectors/2"],
    "middlewares": ["_IterateRoutes"]
  },
  "/injectors/1": "/injectors/1 data",
  "/injectors/2": "/injectors/2 data"
}
```

Now go and hit [http://localhost:3000/middleware/utils/example/\_IterateRoutes](http://localhost:3000/middleware/utils/example/_IterateRoutes). For each hit the route is passed to next matching url provided in the mock list.

### **AdvancedSearch**

`_AdvancedSearch` middleware helps to filter and do the advanced search from data.Following are the operations performed by this method.

#### Filter

Use `.` to access deep properties

```
GET /posts?title=mock-server&author=sivaraman
GET /posts?id=1&id=2
GET /comments?author.name=sivaraman
```

#### Paginate

Use `_page` and optionally `_limit` to paginate returned data.

In the `Link` header you'll get `first`, `prev`, `next` and `last` links.

```
GET /posts?_page=7
GET /posts?_page=7&_limit=20
```

_10 items are returned by default_

#### Sort

Add `_sort` and `_order` (ascending order by default)

```
GET /posts?_sort=views&_order=asc
GET /posts/1/comments?_sort=votes&_order=asc
```

For multiple fields, use the following format:

```
GET /posts?_sort=user,views&_order=desc,asc
```

#### Slice

Add `_start` and `_end` or `_limit` (an `X-Total-Count` header is included in the response)

```
GET /posts?_start=20&_end=30
GET /posts/1/comments?_start=20&_end=30
GET /posts/1/comments?_start=20&_limit=10
```

_Works exactly as [Array.slice](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/slice) (i.e. `_start` is inclusive and `_end` exclusive)_

#### Operators

Add `_gte` or `_lte` for getting a range

```
GET /posts?views_gte=10&views_lte=20
```

Add `_ne` to exclude a value

```
GET /posts?id_ne=1
```

Add `_like` to filter (RegExp supported)

```
GET /posts?title_like=server
```

#### Full text search

Add `q` or `_text`

```
GET /posts?q=internet&_text=success
```

### **CrudOperations**

`_CrudOperations` middleware handles all the crud operations of the given data.
By default it also handles the `_AdvancedSearch` operations.

> Note: The mock must of type Array of objects and must contain a unique value of attribute `id`. This `id` attribute can also be changes using `config.id`.

For example: `config.json`

```jsonc
{
  "id": "_id"
}
```

### **FetchTillData**

`_FetchTillData` helps to fetch the data from url until it get a success data. Once its get the data the fetch call stops and returns the existing data for other route hit.

### **SetFetchDataToMock**

`_SetFetchDataToMock` sets every fetchData to Mock.
This overrides the existing mock with the `fetchData`.

### **SetStoreDataToMock**

`_SetStoreDataToMock` sets every store data to Mock data.
This overrides the existing mock with the `store`.

### **MockOnly**

`_MockOnly` sends you only Mock data even if there is any `fetchData` or `store` data.

### **FetchOnly**

`_FetchOnly` sends you only Fetch data even if there is any `_mock` or `store` data.

### **ReadOnly**

`_ReadOnly` forbidden every Http method calls except `GET` call.

### **Fetch**

`_Fetch` Helps to fetch from file path or from the url.

> Note: `locals.routeConfig.fetch` must contain a valid file path or http url to fetch the data.

For Example:
`db.json`

```jsonc
{
  "/user": "./mock/user.json" // directly setting the path instead of setting it as a fetch config
}
```

`injectors.js`

```js
module.exports = [
  {
    routes: ["/user"],
    middlewares: [
      (req, res) => {
        const routeConfig = res.locals.routeConfig;
        routeConfig.fetch = routeConfig.mock;
      },
      "_Fetch", // helps to fetch the file from routeConfig.fetch path
    ],
  },
];
```

### **FetchFile**

`_FetchFile` Helps to fetch from file path.

> Note: `locals.routeConfig.fetch` must contain a valid file path to fetch the data.

### **FetchUrl**

`_FetchUrl` Helps to fetch from http url.

> Note: `locals.routeConfig.fetch` must contain a valid http url to fetch the data.

## **Injectors**

Injectors helps to inject a Route Configs explicitly.
This also helps to provide a common route configs.
Injector uses [`path-to-regexp`](https://github.com/pillarjs/path-to-regexp) pattern recognition to set config for multiple routes.

### **Inject Route Configs**

Here we are explicitly injecting `delay`, `middlewares`, `statusCode` to the `/posts` route.
You can any route configs to a specific or to a group of routes using Injectors.

- Injectors use `path-to-regexp` package for route pattern recognition.
- Click [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) for more details.

example : `injectors.json`

```jsonc
[
  {
    "routes": ["/injectors/:id"],
    "description": "This description is injected using the injectors by matching the pattern '/injectors/:id'."
  }
]
```

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

> Note: Use `["..."]` If you want to add the existing middlewares.

### **Common Route Configs**

Using wildcards you can set a common route configs to all the routes.
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

Make sure you give `/(.*)` at the end of the `injectors.json` object to set route configs to all the routes.

## **Store Data**

Store used to store any values which can be used later for any purpose like response manipulation or logging etc..

### **Route Store**

Route store helps to store any values which can be accessed on by that particular route.
This stores values cannot be able to accessed by the other routes.
Route Store can be accessed using `res.locals.routeConfig.store` inside the middleware.

The middlewares `_CrudOperations`, `_IterateRoutes`, `_IterateResponse` uses the Route store to manipulate response.

### **Local Store**

Local Store helps to store and share data between routes.
This can be accessed using `res.locals.getStore()` inside the middleware.

## **Route Rewriters**

Create a `rewriters.json` file. Pay attention to start every route with `/`.

- Rewriters use `express-urlrewrite` package to rewrite the urls.
- Click [here](https://www.npmjs.com/package/express-urlrewrite) for more information about url rewrite.

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
mockServer.launchServer("./db.json", {
  injectors: "./injectors.json",
  middlewares: "./middleware.js",
  rewriters: "./rewriters.json",
});
```

Now you can access resources using additional routes.

```sh
/api/posts # → /posts
/api/posts/1  # → /posts/1
/posts/1/show # → /posts/1
/posts/javascript # → /posts?category=javascript
/articles?id=1 # → /posts/1
```

## **Locals**

`res.locals` helps to access the current route config, `fetchData`, `store` etc..
Here are the available options in `res.locals`

```ts
interface Locals {
  routePath: string;
  routeConfig: {
    _config?: boolean;
    id?: string;
    description?: string;
    mock?: any;
    mockFirst?: boolean;
    fetch?: string | AxiosRequestConfig;
    fetchData?: {
      status?: number;
      message?: string;
      isError?: boolean;
      headers?: any;
      response?: any;
      stack?: any;
    };
    store?: object;
    statusCode?: number;
    delay?: number;
    fetchCount?: number;
    skipFetchError?: boolean;
    middlewares?: Array<express.RequestHandler>;

    // System generated attributes. Please avoid modifying these attribute values
    _isFile?: boolean;
    _request?: AxiosRequestConfig;
    _extension?: string;
  };
  data: any; // response will be sent using this attribute value.
  config: Config; // gives you the current mock server configuration.
  getStore: () => object;
  getDb: () => object;
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
  } else if (
    routeConfig.fetchCount !== undefined &&
    routeConfig.fetchCount == 0
  ) {
    // If fetchData has any error then keep on fetching
    routeConfig.fetchCount = -1; // setting fetchCount to -1 does an infinite fetch
  }
  next();
};
```

The above middleware helps to fetch the data from url until it gets a valid success response.

## **Config**

you can provide your own config by passing the config object in the `MockServer` constructor. For Example :

`server.js` :

```js
// These are default config. You can provide your custom config as well.
const config = {
  port: 3000, // Set Port to 0 to pick a random available port.
  host: "localhost", // Set custom host
  root: process.cwd(), // Root path of the server. All paths refereed in db data will be relative to this path
  base: "", // Mount db on a base url
  id: "id", // Set db id attribute.
  dbMode: "mock", // Give one of 'multi', 'fetch', 'mock'
  staticDir: "", // Path to host a static files
  reverse: false, // Generate routes in reverse order
  logger: true, // Enable api logger
  noCors: false, // Disable CORS
  noGzip: false, // Disable data compression
  readOnly: false, // Allow only GET calls
  bodyParser: true, // Enable body-parser
  cookieParser: true, // Enable cookie-parser
};

new MockServer(config).launchServer("./db.json");
```

### **Db Mode**

Db mode defines on what config does the direct route value to be assigned.
For Example :

1. `dbMode` is `multi` - Only direct `string` value will be assigned to `fetch` attribute. All other values will be assigned to `mock` attribute

```js
const db = {
  route1: "My Response", // String
  route2: { data: "My Response" }, // Object without _config: true
  route3: [], // Array
  route4: "path/to/file", // Some path to fetch a file
  route5: { _config: true, mock: "My Response" } // Config object.
}
// Transforms  as follow
{
  "/route1": { _config: true, fetch: "My Response" },
  "/route2": { _config: true, mock: { data: "My Response" } },
  "/route3": { _config: true, mock: [] }, // Array
  "/route4": { _config: true, fetch: "path/to/file"  },
  "/route5": { _config: true, mock: "My Response" } // Config object wont be changed
}
```

2. `dbMode` is `mock` - All direct values will be assigned to `mock` attribute

```js
const db = {
  route1: "My Response", // String
  route2: { data: "My Response" }, // Object without _config: true
  route3: [], // Array
  route4: "path/to/file", // Some path to fetch a file
  route5: { _config: true, fetch: "path/to/file" }, // Config object.
}
// Transforms  as follow
{
  "/route1": { _config: true, mock: "My Response" },
  "/route2": { _config: true, mock: { data: "My Response" } },
  "/route3": { _config: true, mock: [] },
  "/route4": { _config: true, mock: "path/to/file"  },
  "/route5": { _config: true, fetch: "path/to/file" } // Config object wont be changed
}
```

2. `dbMode` is `fetch` - All direct values will be assigned to `mock` attribute

```js
const db = {
  route1: "My Response", // String
  route2: { data: "My Response" }, // Object without _config: true
  route3: [], // Array
  route4: "path/to/file", // Some path to fetch a file
  route5: { _config: true, mock: "My Response" }, // Config object.
}
// Transforms  as follow
{
  "/route1": { _config: true, fetch: "My Response" },
  "/route2": { _config: true, fetch: { data: "My Response" } },
  "/route3": { _config: true, fetch: [] },
  "/route4": { _config: true, fetch: "path/to/file"  },
  "/route5": { _config: true, mock: "My Response" } // Config object wont be changed
}
```

## Home Page

- `Home Page` - [http://localhost:3000](http://localhost:3000)
- `Db` - [http://localhost:3000/\_db](http://localhost:3000/_db)
- `Rewriters` - [http://localhost:3000/\_rewriters](http://localhost:3000/_rewriters)
- `Store` - [http://localhost:3000/\_store](http://localhost:3000/_store)
- `Reset Db` - [http://localhost:3000/\_reset/db](http://localhost:3000/_reset/db)

## CLI Usage

```sh
$ mock-server --help
Options:
  -c, --config             Path to config file                            [string]
  -P, --port               Set port                                [default: 3000]
  -H, --host               Set host                         [default: "localhost"]
  -m, --middleware         Paths to middleware file                      [string]
  -i, --injectors          Path to Injectors file                         [string]
  -s, --store              Path to Store file                             [string]
  -r, --rewriters          Path to Rewriter file                          [string]
      --staticDir, --sd    Set static files directory                     [string]
  -b, --base               Set base route path                            [string]
      --readOnly, --ro     Allow only GET requests                       [boolean]
      --noCors, --nc       Disable Cross-Origin Resource Sharing         [boolean]
      --bodyParser, --bp   Enable body-parser middleware                 [boolean]
      --cookieParser, --cp Enable cookie-parser middleware               [boolean]
      --noGzip, --ng       Disable GZIP Content-Encoding                 [boolean]
  -l, --logger             Enable logger                 [boolean] [default: true]
      --sample, --ex       Create Sample                [boolean] [default: false]
  -w, --watch              Watch file(s)                [boolean] [default: false]
  -S, --snapshots          Set snapshots directory                  [default: "."]
  -h, --help               Show help                                     [boolean]
  -v, --version            Show version number                           [boolean]

Examples:
  index.js db.json
  index.js --watch db.json
  index.js --sample --watch
  index.js http://jsonplaceholder.typicode.com/db

https://r35007.github.io/Mock-Server/
```

## API

### **MockServer**

returns the instance of the mockServer.

```js
const { MockServer } = require("@r35007/mock-server");
const mockServer = new MockServer("./config.json");
```

**`Params`**

| Name   | Type          | Required | Description                           |
| ------ | ------------- | -------- | ------------------------------------- |
| config | string/object | No       | This object sets the port, host etc.. |

### **Create**

returns the single instance of the mockServer.

```js
const { MockServer } = require("@r35007/mock-server");
const mockServer = MockServer.Create("./config.json");
```

**`Params`**

| Name   | Type            | Required | Description                           |
| ------ | --------------- | -------- | ------------------------------------- |
| config | string / object | No       | This object sets the port, host etc.. |

### **Destroy**

stops the server and clears the instance of the mockServer.
returns promise

```js
const { MockServer } = require("@r35007/mock-server");
const mockServer = MockServer.Create();
await MockServer.Destroy();

// or
// pass a mock server instance to destroy
await MockServer.Destroy(mockServer);
```

### **launchServer**

It validates all the params in the MockServer, loads the resources and starts the server.

```js
mockServer.launchServer("./db.json", {
  injectors: "./injectors.json",
  middlewares: "./middleware.js",
  rewriters: "./rewriters.json",
  store: "./store.json",
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
const rewriters = mockServer.rewriter("./rewriters.json");
app.use(rewriters);
```

**`Params`**

| Name      | Type            | Required | Description             |
| --------- | --------------- | -------- | ----------------------- |
| rewriters | string / object | No       | Give the Rewrites       |
| options   | object          | No       | option to set rewriters |

**`[options]`**

| Name     | Type    | Required | Description                                    |
| -------- | ------- | -------- | ---------------------------------------------- |
| rootPath | string  | No       | To require rewriter file relative to this path |
| log      | boolean | No       | If true it logs the rewriters setting log      |

### **defaults**

returns the list of default middlewares.
Also helps to host a static directory.

```js
const defaults = mockServer.defaults({ staticDir: "./public", readOnly: true });
app.use(defaults);
```

- options
  - `staticDir` path to static files
  - `logger` enable logger middleware (default: true)
  - `bodyParser` enable body-parser middleware (default: true)
  - `noGzip` disable Compression (default: false)
  - `noCors` disable CORS (default: false)
  - `readOnly` accept only GET requests (default: false)
  - `cookieParser` enable cookie-parser middleware (default: true)

### **resources**

Create db resources. It uses global injectors, middlewares and config to crete db resource.

```js
const resources = mockServer.resources("./db.json");
app.use(resources);
```

Create db resources with custom injectors and middlewares. It won't use global injectors and middlewares.
It sets only db and not the injectors or middlewares.

```js
const resources = mockServer.resources("./db.json", {
  injectors: "./injectors.json",
  middlewares: "./middleware.js",
});
app.use(resources);
```

**`Params`**

| Name    | Type                 | Required | Description                  |
| ------- | -------------------- | -------- | ---------------------------- |
| db      | string/object/method | No       | Set db resource              |
| options | object               | No       | option to create db resource |

**`[options]`**

| Name        | Type                    | Required | Description                                |
| ----------- | ----------------------- | -------- | ------------------------------------------ |
| rootPath    | string                  | No       | rootPath to get db from a file             |
| dbMode      | 'mock'/ 'fetch'/'multi' | No       | dbMode to create resource                  |
| injectors   | string/object/method    | No       | injectors to inject routeconfig to this db |
| middlewares | string/object/method    | No       | middlewares of this db                     |
| reverse     | boolean                 | No       | If true it creates db in reverse order     |
| router      | Express.Router          | No       | Custom Router                              |
| log         | boolean                 | No       | If tru it logs the resources setting log   |

### **homePage**

Returns Mock Server Home Page router.

```js
const homePage = mockServer.homePage();
app.use(homePage);
```

### **startServer**

Returns a Promise of `Server`. - helps to start the app server externally

```js
const server = await mockServer.startServer(3000, "localhost");
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
```

### **Setters**

```js
mockServer.setData({ db, injectors, middlewares, rewriters, store, config });

//or

// Please follow the same following order of setting the data
// If merge param is true. it adds the data with the existing data.
mockServer.setConfig(config, { rootPath, merge, log });
mockServer.setMiddlewares(middlewares, { rootPath, merge, log });
mockServer.setInjectors(injectors, { rootPath, merge, log });
mockServer.setRewriters(rewriters, { rootPath, merge, log });
mockServer.setStore(store, { rootPath, merge, log });
mockServer.setDb(Db, { rootPath, merge, log });
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
} = require("@r35007/mock-server/dist/server/utils/validators");

const options = {
  reverse: true, // If true the db will be generated in reverse order
  dbMode: "fetch", // The direct route value will be set to fetch
};

const rootPath = "./";

const db = getValidDb(
  "db.json", // db or HAR
  { injectors, rootPath, reverse, dbMode, mockServer }
); // returns valid Db combined with the given injectors. Also helps to extract a db from HAR file. internally use getValidRouteConfig
const middleware = getValidMiddlewares(middlewares, { rootPath, mockServer }); // returns a valid middleware along with the default middlewares
const injectors = getValidInjectors(injectors, { rootPath, mockServer }); // returns a valid injectors. internally use getValidInjectorConfig
const rewriters = getValidRewriters(rewriters, { rootPath, mockServer }); // returns a valid rewriters
const config = getValidConfig(config, { rootPath, mockServer }); // returns a valid config combined with the default configs
const store = getValidStore(store, { rootPath }); // returns a valid store
const routeConfig = getValidRouteConfig(route, routeConfig); // returns a valid routeconfig used by getValidDb
const injectorConfig = getValidInjectorConfig(route, routeConfig); // returns a valid injectorsConfig used by getValidInjectors
const route = getValidRoute(route); // splits route by comma and adds a slash ('/') prefix to the routes
```

## VS Code Extension

[Thinker.mock-server](https://marketplace.visualstudio.com/items?itemName=Thinker.mock-server)

![thinker.mock-server](src/img/VSCode_Extension.gif)

## Author

**Sivaraman** - [sendmsg2siva.siva@gmail.com](sendmsg2siva.siva@gmail.com)

- _GitHub_ - [https://github.com/R35007/Mock-Server](https://github.com/R35007/Mock-Server)

## License

MIT
