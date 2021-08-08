# Mock Server[](#mock-server) [![](https://img.shields.io/npm/v/@r35007/mock-server?label=npm)](https://img.shields.io/npm/v/@r35007/mock-server?label=npm) [![](https://img.shields.io/npm/l/@r35007/mock-server?color=blue)](https://img.shields.io/npm/l/@r35007/mock-server?color=blue) [![](https://img.shields.io/npm/types/@r35007/mock-server)](https://img.shields.io/npm/types/@r35007/mock-server)

Get a full REST API with **zero coding** in **less than 30 seconds** (seriously)

Created with <3 for front-end developers who need a quick back-end for prototyping and mocking.
Now also available as a VSCodeExtension `thinker.mock-server`.

## Table of contents

- [Getting started](#getting-started)
- [Using JS Module](#using-js-module)
- [Route Config](#route-config)
  - [Set Delay Response](#set-delay-response)
  - [Set Custom StatusCode](#set-custom-statuscode)
  - [Fetch Data From URL](#fetch-data-from-url)
    - [Fetch File](#fetch-file)
    - [Custom Fetch Options](#custom-fetch-options)
    - [Use Fetch as Proxy](#use-fetch-as-proxy)
  - [Fetch Count](#fetch-count)
  - [Skip Fetch Error](#skip-fetch-error)
  - [Custom Mock](#custom-mock)
  - [Add Middleware](#add-middleware)
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
  - [Alternative Port](#config)
  - [Set Host](#config)
  - [Set RootPath to fetch Files](#config)
  - [Add Base Route](#config)
  - [Static File Server](#config)
- [Default Routes](#default-routes)
- [Home Page](#home-page)
  - [Details View](#details-view)
  - [Update Route](#update-route)
  - [Clone Route](#clone-route)
  - [Add Route](#add-route)
- [CLI Usage](#cli-usage)
- [API](#api)
  - [MockServer](#mockserver)
  - [launchServer](#launchserver)
  - [rewriter](#rewriter)
  - [defaults](#defaults)
  - [resources](#resources)
  - [defaultRoutes](#defaultroutes)
  - [addDbData](#adddbdata)
  - [getDb](#getdb)
  - [startServer](#startserver)
  - [stopServer](#stopserver)
  - [resetServer](#resetserver)
  - [resetRoutes](#resetroutes)
  - [resetStore](#resetstore)
  - [pageNotFound](#pagenotfound)
  - [errorHandler](#errorhandler)
  - [Setters](#setters)
  - [Variables](#variables)
  - [Validators](#validators)
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

First install nodemon for watching changes

```sh
npm install -g nodemon
```

Create `server.js` File

```js
const { MockServer } = require("@r35007/mock-server"); // use import if using ES6 module

const mockServer = new MockServer("./config.json", "./store.json");

mockServer.launchServer(
  "./db.json",
  "./middleware.js",
  "./injectors.json",
  "./rewriter.json"
); // Starts the Mock Server.

//or

const mockServer = new MockServer("./config.json", "./store.json");
const app = mockServer.app;

const rewriter = mockServer.rewriter({ "/api/*": "/$1" });
app.use(rewriter); // make sure to add this before defaults and resources

const defaults = mockServer.defaults({ noGzip: true });
app.use(defaults);

const resources = mockServer.resources(
  "./db.json",
  "./middleware.js",
  "./injectors.json"
);
app.use(resources);

const defaultRoutes = mockServer.defaultRoutes();
app.use(defaultRoutes);

// make sure to add this at last
app.use(mockServer.pageNotFound);
app.use(mockServer.errorHandler);

await mockServer.startServer(3000, "localhost");
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
    "id": "id-unique", // sets a unique id for each route
    "description": "", // Description about this Route.
    "delay": 2000, // in milliseconds
    "statusCode": 200, // in number between 100 to 600
    "middlewares": ["_IterateResponse"], // list of middleware to be called
    "middleware": "", // Can give a direct Express Request Handler. It can be used only if the db is used as a .js file.
    "fetch": "./myFile.json", // this path will be relative to `config.root`
    "fetchCount": 5, // Set to -1 to fetch infinite times.
    "mock": [{ "name": "foo" }, { "name": "bar" }],
    "skipFetchError": false, // If True it skips any fetch error and send the mock data
    "fetchData": {}, // contains the fetch call success response
    "fetchError": {}, // contains the fetch call error response
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

Note : `fetch` can be either `string` type or `AxiosRouteConfig` type.
see [Fetch Data From URL](#fetch-data-from-url) for more configuration.

### **Set Delay Response**

`delay` helps you to set a custom delay to your routes.
Note : The delay yo set must be in milliseconds and of type number

```jsonc
{
  "/user/1": {
    "_config": true,
    "mock": {
      "id": 1,
      "name": "Leanne Graham",
      "username": "Bret",
      "email": "Sincere@april.biz"
    },
    "delay": 3000 // in milliseconds
  }
}
```

The above `/user/1` route returns the response in a delay of 3 seconds.

### **Set Custom StatusCode**

`statusCode` helps you set a custom statusCode to your routes.
It must be of type number and between 100 to 600.

```jsonc
{
  "/user/1": {
    "_config": true,
    "mock": {
      "id": 1,
      "name": "Leanne Graham",
      "username": "Bret",
      "email": "Sincere@april.biz"
    },
    "statusCode": 500
  }
}
```

The above `/user/1` route returns the response with a `500` statusCode

### **Fetch Data From URL**

`fetch` helps you get data from url.
The url can either be a http server or a local file server.

#### **Fetch File**

Give a absolute or a relative path to fetch any file and get as a response.
Note: The given relative path will be relative to `config.root`.

```jsonc
{
  "/banner": {
    "_config": true,
    "fetch": "./assets/banner.jpg"
  }
}
```

#### **Custom Fetch Options**

You can also give a fetch as a axios request object with custom options.

```jsonc
{
  "/customUsers": {
    "_config": true,
    "fetch": {
      "url": "https://jsonplaceholder.typicode.com/users",
      "params": "{{params}}", // pass id from `customUsers?id=5` route
      "method": "GET"
    }
  }
}
```

Note: The to pass any options from the route set the option value as `{{<option Name>}}`

reserved key words :

- `{{routePath}}` - sets route path
- `{{host}}` - sets host
- `{{base}}` - sets base url
- `{{port}}` - sets port
- `{{params}}` / `{{query}}` - sets query params
- `{{data}}` / `{{body}}` - sets posts body data
- `{{header}}` - sets header
- `{{method}}` - sets method

#### **Use Fetch as Proxy**

By directly giving a url it acts like a proxy.
It sends all the options like prams, query params, headers, data etc.. from the mock route

```jsonc
{
  "/customComments/:id?": {
    "_config": true,
    "fetch": "https://jsonplaceholder.typicode.com/comments"
  },
  "/posts": {
    "_config": true,
    "fetch": "https://jsonplaceholder.typicode.com/{{routePath}}" // will become https://jsonplaceholder.typicode.com/posts
  }
}
```

Note: `{{routePath}}` will prepends the route to the url.

Now you could use any routing provided by the `"https://jsonplaceholder.typicode.com/posts"`..
For example: You could use the following.
`http://localhost:3000/customComments`
`http://localhost:3000/customComments/1`
`http://localhost:3000/customComments?postId=1`

### **Fetch Count**

In Route Config setting `fetchCount` will helps to limit the number of fetch calls.
By Default the `fetchCount` is set to `1`.
The fetch data will be set to `_fetchData`.

`db.json`

```jsonc
{
  "/posts": {
    "_config": true,
    "fetch": "https://jsonplaceholder.typicode.com/posts" // If fetchCount is not set by default it makes only one fetch call
  },
  "/users": {
    "_config": true,
    "fetch": "https://jsonplaceholder.typicode.com/users",
    "fetchCount": 5 // fetch call is limited to 5 calls
  },
  "/users/1": {
    "_config": true,
    "fetch": "https://jsonplaceholder.typicode.com/users/1",
    "fetchCount": 0, // If set to zero, It doesn't make a fetch call instead it tries to fetch data from _fetchData
    "_fetchData": { "id": 1, "user": "foo" }
  },
  "/todos": {
    "_config": true,
    "fetch": "https://jsonplaceholder.typicode.com/todos",
    "fetchCount": -1 // makes infinite fetch call.
  }
}
```

### **Skip Fetch Error**

If `skipFetchError` is set to true, It will skip any error in fetch call and instead of returning that fetch error it gives you the mock data.

### **Custom Mock**

```jsonc
{
  // If you don't have any route configurations you can directly give the mock data
  "/customComments/1": [
    { "id": 1, "username": "foo" },
    { "id": 2, "username": "bar" }
  ],
  // If you have any route configurations like delay or statusCode etc..,
  // Please give "_config": true and give your mock under `mock` attribute.
  "/customComments/2": {
    "_config": true,
    "mock": [
      { "id": 1, "username": "foo" },
      { "id": 2, "username": "bar" }
    ],
    "delay": 2000
  }
}
```

### **Add Middleware**

You can add n number of middleware to a route which helps you to manipulate or log the data.

`middleware.js`

```js
exports.log = (req, res, next) => {
  console.log(new Date());
  // make sure you always call next() method when you don't sent any response using res.send().
  next();
};
exports.wrapper = (req, res, next) => {
  const wrapperResponse = {
    message: "Successful",
    result: res.locals.data,
  };
  res.locals.data = wrapperResponse;
  next(); // pass to next middleware
};
```

`db.json`

```jsonc
{
  "/posts/:id": {
    "_config": true,
    "fetch": "https://jsonplaceholder.typicode.com/posts",
    "middlewares": ["log", "wrapper"] // give the name of the middlewares which are available in the middleware.js
  },
  "/comment": {
    "_config": true,
    "fetch": { "url": "https://jsonplaceholder.typicode.com/comments/1" },
    "middlewares": ["log"]
  }
}
```

Note: A middleware must be available at the name of the middlewares given in `db.json`

Now in server.js

```js
const { MockServer } = require("@r35007/mock-server");
new MockServer().launchServer("./db.json", "./middleware.js");
```

Now when you go to `http://localhost:3000/posts/1`, you can see the new data og in console and also wrap's the response with the object.

But When you go to `http://localhost:3000/comment`, you can only see the date log and will not be wrapped with the object.

## **Middleware Utils**

Use the predefined middleware to speedup your development and for ease of access.

### **IterateResponse**

setting middleware to `_IterateResponse` helps to send you a iterate the response one after the other in the mock array for each url hit.

example:

```jsonc
{
  "/route": {
    "_config": true,
    "middlewares": ["_IterateResponse"], // method name to be called
    "mock": ["response1", "response2]
  }
}
```

Now go and hit `http://localhost:3000/route`. For the first hit you get `response1` as a response and for the second hit you get `response2` as a response and its loops through each element in the mock array for each url hit.

### **IterateRoutes**

setting middleware to `_IterateRoutes` helps to send you a iterate the route one after the other in the mock array for each url hit.

example:

```jsonc
{
  "/posts": {
    "_config": true,
    // make sure this route stays at the top of the routes provided in the mock.
    "middlewares": ["_IterateRoutes"], // method name to be called
    "mock": ["/posts/1", "/posts/2", "/posts/3"]
  },
  "/posts/1": { "data": " Data 1" },
  "/posts/2": { "data": " Data 2" },
  "/posts/3": { "data": " Data 3" }
}
```

### **AdvancedSearch**

`_AdvancedSearch` middleware helps to filter and do the advanced search from data.Following are the operations performed by this method.

#### Filter

Use `.` to access deep properties

```
GET /posts?title=mock-server&author=typicode
GET /posts?id=1&id=2
GET /comments?author.name=typicode
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
Note : the mock must of type Array of objects and must contain a unique value of attribute `id`.
this `id` attribute can also be changes using `config.id`.

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
This overrides the existing mock with the `_fetchData`.

### **SetStoreDataToMock**

`_SetStoreDataToMock` sets every store data to Mock data.
This overrides the existing mock with the `store`.

### **MockOnly**

`_MockOnly` sends you only Mock data even if there is any `_fetchData` or `store` data.

### **FetchOnly**

`_FetchOnly` sends you only Fetch data even if there is any `_mock` or `store` data.

### **ReadOnly**

`_ReadOnly` forbidden every Http method calls except `GET` call.

## **Injectors**

Injectors helps to inject a Route Configs explicitly.
This also helps to provide a common route configs.
Injector uses [`path-to-regexp`](https://github.com/pillarjs/path-to-regexp) pattern recognition to set config for multiple routes.

### **Inject Route Configs**

Here we are explicitly injecting `delay`, `middlewares`, `statusCode` to the `/posts` route.
You can any route configs to a specific or to a group of routes using Injectors.

example :

`db.json`

```jsonc
{
  "/posts": {
    "_config": true,
    "fetch": { "url": "https://jsonplaceholder.typicode.com/posts" }
  },
  "/comments/1": {
    "_config": true,
    "fetch": { "url": "https://jsonplaceholder.typicode.com/comments/1" },
    "middlewares": ["_CrudOperations", "log"]
  },
  "/comments/2": {
    "_config": true,
    "delay": 3000,
    "fetch": { "url": "https://jsonplaceholder.typicode.com/comments/2" }
  },
  "/comments/3": {
    "_config": true,
    "fetch": { "url": "https://jsonplaceholder.typicode.com/comments/3" }
  }
}
```

`injectors.json`

```jsonc
{
  "/posts": {
    "delay": 2000,
    "middlewares": ["log", "counter", "_CrudOperations"],
    "StatusCode": 300
  },
  "/comments/:id?": {
    "delay": 2000, // since /comments/2 already has a delay of 3 seconds it will ot be replaced with 2 seconds delay
    "middlewares": ["log"] // injects middlewares to /comments/2, /comments/3 routes excepts /comments/1
  }
}
```

### **Override Existing Route Configs**

Setting `override` flag to true helps to override the existing config of that route.

For example :

`injectors.json`

```jsonc
{
  "/comments/1": {
    "override": true,
    "middlewares": ["...", "timer"] // here /comments/1 route will have ["crudMock", "log", "timer"]
  },
  "/comments/2": {
    "override": true,
    "delay": 2000 // Now /comments/2 will have a delay of 2 seconds
  }
}
```

Note: Use `["..."]` If you want to add the existing middlewares in line when overriding.
Make sure the middlewares are available in the `middleware.js` in the given middlewares name.

### **Common Route Configs**

Using wildcards you can set a common route configs to all the routes.
`/(.*)` - matches all the routes.

For example :

`injectors.json`

```jsonc
{
  "/posts": {
    "delay": 2000 // will be overridden by the below route match configs.
  },
  "/(.*)": {
    "override": true,
    "middlewares": ["log", "..."],
    "statusCode": 200,
    "delay": 1000
  },
  "/comments/1": {
    "delay": 0, // Here only this route will not have a delay of 1 second
    "override": true
  }
}
```

Now all the Routes will have a delay of 1 second, `"log"` middleware is appended to all routes and `statusCode` will be 200.
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
This can be accessed using `res.locals.store` inside the middleware.

## **Route Rewriters**

Create a `rewriters.json` file. Pay attention to start every route with `/`.

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
const mockServer = new MockServer();
mockServer.launchServer(
  "./db.json",
  "./middleware.js",
  "./injectors.json",
  "./rewriters.json"
);
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
  //all routeConfigs can be modified at runtime except middlewares and middleware attribute
  routeConfig: {
    _config?: boolean;
    id?: string;
    description?: string;
    mock?: any;
    fetch?: string | AxiosRequestConfig;
    fetchData?: any;
    fetchError?: any;
    store?: object;
    statusCode?: number;
    delay?: number;
    fetchCount?: number;
    skipFetchError?: boolean;
    override?: boolean;
    middlewares?: string[];
    middleware?: express.RequestHandler;

    // System generated attributes. Please avoid modifying these attribute values
    _isFile?: boolean;
    _request?: AxiosRequestConfig;
    _extension?: string;
  };
  data: any; // response will be sent using this attribute value.
  store: object;
  getDb: (ids?: string[], routePaths?: string[]) => Routes; // This method helps to get other route configs and values.
  config: Config; // gives you the current mock server configuration.
}
```

### **Dynamic Route Config**

RouteConfigs are mutable. Means we can able to modify the routeConfigs in runtime using middleware.
For Example:

`middleware.js`

```js
exports._FetchTillData = (_req, res, next) => {
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig;
  if (routeConfig.fetchData !== undefined) {
    routeConfig.fetchCount = 0;
  } else if (routeConfig.fetchCount !== undefined && routeConfig.fetchCount == 0) {
    routeConfig.fetchCount = -1;
  }
  next();
}
```

The above middleware helps to fetch the data from url until it gets a valid success response.

## **Config**

you can provide your own config by passing the config object in the `MockServer` constructor. For Example :

`server.js` :

```js
// These are default config. You can provide your custom config as well.
const config = {
  port: 3000, // by default mock will be launched at this port. http://localhost:3000/
  host: "localhost",
  root: process.cwd(), // all paths will be relative to this path. Please provide a absolute path here.
  base: "/", // all routes will be prefixed with the given baseUrl.
  staticDir: "", // Please provide a folder path. This will be hosted locally and all files will be statically accessed
  reverse: false, // If true routes will be generated in reverse order
  bodyParser: true, // Sets the bodyParser
  id: "id", // Set the id attribute here. Helps to do Crud Operations. For example: 'id': "_id"
  logger: true, // If False no logger will be shown
  noCors: false, // If false cross origin will not be handled
  noGzip: false, // If False response will not be compressed
  readOnly: false, // If true only GET call is allowed
};

new MockServer(config).launchServer("./db.json");
```

## Default Routes

- `Home Page` - [http://localhost:3000](http://localhost:3000)
- `Db` - [http://localhost:3000/routes](http://localhost:3000/_db_)
- `Rewriters` - [http://localhost:3000/rewriter](http://localhost:3000/_rewriters)
- `Store` - [http://localhost:3000/store](http://localhost:3000/_store)
- `Reset Route` - [http://localhost:3000/reset/route](http://localhost:3000/_reset/db)
- `Reset Store` - [http://localhost:3000/reset/store](http://localhost:3000/_reset/store)

## **Home Page**

![Home Page](https://r35007.github.io/Mock-Server/src/img/homePage.png)

## **Details View**

![Details View](https://r35007.github.io/Mock-Server/src/img/detailsView.png)

### **Update Route**

![Update Route](https://r35007.github.io/Mock-Server/src/img/updateRoute.png)

### **Clone Route**

![Clone Route](https://r35007.github.io/Mock-Server/src/img/cloneRoute.png)

### **Add Route**

![Add Route](https://r35007.github.io/Mock-Server/src/img/addRoute.png)

## CLI Usage

```sh
$ mock-server --help
Options:
  -c, --config           Path to config file                            [string]
  -P, --port             Set port                                [default: 3000]
  -H, --host             Set host                         [default: "localhost"]
  -m, --middleware       Paths to middlewares file                      [string]
  -i, --injectors        Path to Injectors file                         [string]
  -s, --store            Path to Store file                             [string]
  -r, --rewriters        Path to Rewriter file                          [string]
      --staticDir, --sd  Set static files directory                     [string]
  -b, --base             Set base route path                            [string]
      --readOnly, --ro   Allow only GET requests                       [boolean]
      --noCors, --nc     Disable Cross-Origin Resource Sharing         [boolean]
      --noGzip, --ng     Disable GZIP Content-Encoding                 [boolean]
  -l, --logger           Enable logger                 [boolean] [default: true]
      --sample, --ex     Create Sample                [boolean] [default: false]
  -w, --watch            Watch file(s)                [boolean] [default: false]
  -S, --snapshots        Set snapshots directory                  [default: "."]
  -h, --help             Show help                                     [boolean]
  -v, --version          Show version number                           [boolean]

Examples:
  index.js db.json
  index.js --watch db.json
  index.js --sample --watch
  index.js http://jsonplaceholder.typicode.com/db

https://r35007.github.io/Mock-Server/
```

## API

### **MockServer**

returns the instance of the mockServer with config and store.

```js
const { MockServer } = require("@r35007/mock-server");
const mockServer = new MockServer(
  "./config.json", // if not provided, it uses the default configs
  "./store.json" // defaults = {}
);
```

**`Params`**

| Name   | Type            | Required | Description                                    |
| ------ | --------------- | -------- | ---------------------------------------------- |
| config | string / object | No       | This object sets the port, host etc..          |
| store  | string / object | No       | Helps to store values and share between routes |

S### **launchServer**

It validates all the params in the MockServer, loads the resources and starts the server.

```js
mockServer.launchServer(
  "./db.json"
  "./middleware.js" // middlewares must be of type .js
  "./injectors.json"
  "./rewriters.json"
);
```

**`Params`**

| Name        | Type            | Required | Description                                             |
| ----------- | --------------- | -------- | ------------------------------------------------------- |
| db          | string / object | No       | This object generates the local rest api.               |
| middlewares | string / object | No       | Here you initialize the needed custom middlewares       |
| injectors   | string / object | No       | Helps to inject a route configs for the existing routes |
| rewriters   | string / object | No       | Helps to set route rewriters                            |

### **rewriter**

Sets the route rewrites and return the router of the rewriters;

```js
const rewriters = mockServer.rewriter("./rewriters.json");
app.use(rewriters);
```

**`Params`**

| Name      | Type            | Required | Description       |
| --------- | --------------- | -------- | ----------------- |
| rewriters | string / object | No       | Give the Rewrites |

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

### **resources**

Sets the routes and returns the resources router.

```js
const resources = mockServer.resources(
  "./db.json",
  "./middleware.js",
  "./injectors.json"
);
app.use(resources);
```

**`Params`**

| Name        | Type            | Required | Description                                             |
| ----------- | --------------- | -------- | ------------------------------------------------------- |
| db          | string / object | No       | This object generates the local rest api.               |
| middlewares | string / object | No       | Here you initialize the needed custom middlewares       |
| injectors   | string / object | No       | Helps to inject a route configs for the existing routes |

### **defaultRoutes**

Returns middlewares used by Mock Server.

```js
const defaultsRoutes = mockServer.defaultRoutes();
app.use(defaultsRoutes);
```

### **addDbData**

adds a new data to the existing db.

```js
mockServer.addDbData(db);
```

**`Params`**

| Name | Type   | Required | Description                             |
| ---- | ------ | -------- | --------------------------------------- |
| db   | object | No       | Give the new data to add to existing Db |

### **getDb**

Returns the routes

```js
const routes = mockServer.getDb(); // If param is not present return all the route values
```

**`Params`**

| Name       | Type     | Required | Description             |
| ---------- | -------- | -------- | ----------------------- |
| ids        | string[] | No       | Give List of route ids  |
| routePaths | string[] | No       | Give List of routePaths |

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

### **resetRoutes**

Returns the routes that are reset.

```js
const routes = mockServer.resetRoutes(); // If param is not present, it resets all the routes.
```

**`Params`**

| Name       | Type     | Required | Description                      |
| ---------- | -------- | -------- | -------------------------------- |
| ids        | string[] | No       | Give List of route ids to reset  |
| routePaths | string[] | No       | Give List of routePaths to reset |

### **resetStore**

Returns the store values that are reset.

```js
const store = mockServer.resetStore(); // If param is not present, it resets all the store values.
```

**`Params`**

| Name | Type     | Required | Description                |
| ---- | -------- | -------- | -------------------------- |
| keys | string[] | No       | Give List of keys to reset |

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

### **Setters**

set the db, middleware, injectors, rewriters, config, store

```js
mockServer.setData(
  db,
  middleware,
  injectors,
  rewriters
  config,
  store,
);

//or

mockServer.setDb(Db);
mockServer.setMiddleware(middleware);
mockServer.setInjectors(injectors);
mockServer.setRewriters(rewriters);
mockServer.setConfig(config);
mockServer.setStore(store);
```

**`Params`**

The same as the [MockServer](#mockserver)

### **Variables**

Other useful variables.

```js
// Please avoid directly modify or setting values to these variable.
// Use Setter method to modify or set any values to these variables.
const app = mockServer.app;
const server = mockServer.server;
const router = mockServer.router;
const data = mockServer.data;

const db = mockServer.db;
const middleware = mockServer.middleware;
const injectors = mockServer.injectors;
const rewriters = mockServer.rewriters;
const config = mockServer.config;
const store = mockServer.store;
const initialDb = mockServer.initialDb;
const initialStore = mockServer.initialStore;
```

### **Validators**

These helps to return a valid data from provided file path or object.

```js
// called only when the given data is in .Har format and called at each entry
const entryCallback = (entry, routePath, routeConfig) => {
  return { [routePath]: routeConfig };
};
// called only when the given data is in .Har format and called at end of the entry loop
const finalCallBack = (data, db) => {
  return db; // what ever you return here will be given back
};

const options = {
  reverse: true, // If true the db will be generated in reverse order
};

const db = mockServer.getValidDb(db, entryCallback, finalCallBack, options);
const middleware = mockServer.getValidMiddleware(middleware);
const injectors = mockServer.getValidInjectors(injectors);
const rewriters = mockServer.getValidRewriters(rewriters);
const config = mockServer.getValidConfig(config);
const store = mockServer.getValidStore(store);
```

## Author

**Sivaraman** - [sendmsg2siva.siva@gmail.com](sendmsg2siva.siva@gmail.com)

- _GitHub_ - [https://github.com/R35007/Mock-Server](https://github.com/R35007/Mock-Server)

## License

MIT
