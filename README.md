# Mock Server[](#mock-server) [![](https://img.shields.io/npm/v/@r35007/mock-server?label=npm)](https://img.shields.io/npm/v/@r35007/mock-server?label=npm) [![](https://img.shields.io/npm/l/@r35007/mock-server?color=blue)](https://img.shields.io/npm/l/@r35007/mock-server?color=blue) [![](https://img.shields.io/npm/types/@r35007/mock-server)](https://img.shields.io/npm/types/@r35007/mock-server)

Get a full REST API with **zero coding** in **less than 30 seconds** (seriously)

Created with <3 for front-end developers who need a quick back-end for prototyping and mocking.
Now also available as a VSCodeExtension `thinker.mock-server`.

## Table of contents

- [Getting started](#getting-started)
- [Advantages](#advantages)
- [Using JS Module](#using-js-module)
- [Route Config](#route-config)
  - [Set Delay Response](#set-delay-response)
  - [Set Custom StatusCode](#set-custom-statuscode)
  - [Specific Request](#specific-request)
  - [Fetch Data From URL](#fetch-data-from-url)
    - [Fetch File](#fetch-file)
    - [Custom Fetch Options](#custom-fetch-options)
    - [Use Fetch as Proxy](#use-fetch-as-proxy)
  - [Custom Mock](#custom-mock)
  - [Add Middlewares](#add-middlewares)
- [Default Middlewares](#default-middlewares)
  - [loopMock](#loopmock)
  - [groupMock](#groupmock)
  - [crudMock](#crudmock)
  - [fetchOnce](#fetchonce)
- [Injectors](#injectors)
  - [Inject Route Configs](#inject-route-configs)
  - [Override Existing Route Configs](#override-existing-route-configs)
  - [Common Route Configs](#common-route-configs)
- [Store Data](#store-data)
- [Locals](#locals)
  - [Dynamic Route Config](#dynamic-route-config)
- [Config](#config)
  - [Alternative Port](#config)
  - [Static File Server](#config)
  - [Add Base Route](#config)
  - [Set RootPath to fetch Files](#config)
  - [Route Rewriter](#config)
  - [Exclude Unwanted Routes](#config)
- [Default Routes](#default-routes)
- [CLI Usage](#cli-usage)
- [API](#api)
  - [MockServer](#mockserver)
  - [launchServer](#launchserver)
  - [createExpressApp](#createexpressapp)
  - [startServer](#startserver)
  - [stopServer](#stopserver)
  - [resetServer](#resetserver)
  - [loadResources](#loadresources)
  - [createRoute](#createroute)
  - [createDefaultRoutes](#createdefaultroutes)
  - [setData](#setdata)
  - [Get Data](#get-data)
  - [Variables](#variables)
  - [Validators](#validators)
  - [Path Check](#path-check)
  - [generateMockFromHAR](#generatemockfromhar)
  - [getRouteMatchList](#getroutematchlist)
  - [getRewrittenRoutes](#getrewrittenroutes)
  - [excludeRoutes](#excluderoutes)
  - [getJSON](#getjson)
  - [getFilesList](#getfileslist)
- [Author](#author)
- [License](#license)

## Getting started

Install Mock Server

```sh
npm install -g @r35007/mock-server
```

Create a `routes.json` file with mock data.

```jsonc
{
  "/hello": {
    "mock": "hello World"
  }
}
```

Start Mock Server

```sh
mock-server ./mock.json
```

Now if you go to [http://localhost:3000/hello](http://localhost:3000/hello), you'll get

```text
Hello World
```

## Advantages

- A single response can be point to multiple route paths.
- Any file can be send as a response. (json, image, txt, etc..)
- Can set any value to globals and can be accessed at any point of time which also helps to share data between routes.
- The mock data can be maintained in different json files and urls which helps to organize your mock data
- The return response can be manipulated or overridden for a specific route by a middleware method.
- proxy routes can be used

## Using JS Module

First install nodemon for watching changes

```sh
npm install -g nodemon
```

Create `server.js` File

```js
const { MockServer } = require("@r35007/mock-server"); // use import if using ES6 module

// see Route Config for more configuration
const routes = {
  "/route/1": {
    mock: {
      data: "data 1",
    },
    middlewares: ["log"], // picks middleware from the middlewares object
  },
  "/route/2": {
    mock: {
      data: "data 2",
    },
  },
};

const middlewares = {
  log: (req, res, next) => {
    console.log(new Date()), next();
  }, // logs time
};

const injectors = {
  "/route/2": {
    delay: 3000, //injects delay 3 second to route/2
  },
};

const config = {
  port: 4000, // runs localhost in this port
};

const mockServer = new MockServer(routes, config, middlewares, injectors);
// Note: routes, config, middlewares, injectors - These can also be given as a url
// For example: const mockServer = new MockServer("./routes.json", "./config.json" ...);

mockServer.launchServer(); // Starts the Mock Server.
```

Now go to terminal and type the following command to start the Mock Server.

```sh
nodemon server.js
```

## **Route Config**

Create a routes.json file. Pay attention to start every route with /.
For Example:

`routes.json`

```jsonc
{
  "/routeName, /routeName2": {
    // two routes shares the same config and mock data
    "methods": ["GET"], // Specify Request. If Empty run with all requests
    "delay": 2000, // in milliseconds
    "statusCode": 200, // in number between 100 to 600
    "middlewares": ["loopMock"], // middlewares to be called
    "fetch": "./myFile.json", // this path will be relative to `config.rootPath`
    "mock": [{ "name": "foo" }, { "name": "bar" }],
    "mockFirst": false // If True it sends mock data first before fetch
  },
  "/routeName3": {
    "name": "foo",
    "age": "bar",
    "description": "Note: If `fetch` or `mock` is not available then it sends this whole object as a response."
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
    "mock": {
      "id": 1,
      "name": "Leanne Graham",
      "username": "Bret",
      "email": "Sincere@april.biz"
    },
    "delay": 3000
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

### **Specific Request**

Uisng `methods` you can set a specific request to route.
You can set `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`.

```jsonc
{
  "/user/1": {
    "mock": {
      "id": 1,
      "name": "Leanne Graham",
      "username": "Bret",
      "email": "Sincere@april.biz"
    },
    "methods": ["GET", "DELETE"]
  }
}
```

The above `/user/1` route can only make `GET` and `DELETE` request.
Note: If the `methods` is not assigned or empty array then the route can access `ALL` requests.

### **Fetch Data From URL**

`fetch` helps you get data from url.
The url can either be a http server or a local file server.

#### **Fetch File**

Give a absolute or a relative path to fetch any file and get as a response.
Note: The given relative path will be relative to `config.rootPath`.

```jsonc
{
  "/banner": {
    "fetch": "./assets/banner.jpg"
  }
}
```

#### **Custom Fetch Options**

You can also give a fetch as a axios request object with custom options.

```jsonc
{
  "/customUsers/:id": {
    "fetch": {
      "url": "https://jsonplaceholder.typicode.com/users",
      "params": "$params", // pass params from `customUsers/:id` route
      "method": "GET"
    }
  }
}
```

Note: The to pass any options from the route set the option value as `$<option Name>`

#### **Use Fetch as Proxy**

By directly giving a url it acts like a proxy.
It sends all the options like prams, query params, headers, data etc.. from the mock route

```jsonc
{
  "/customComments/:id?": {
    "fetch": "https://jsonplaceholder.typicode.com/comments"
  },
  "/posts": {
    "fetch": "https://jsonplaceholder.typicode.com/:routePath" // will become https://jsonplaceholder.typicode.com/posts
  }
}
```

Note: `/:routePath` will prepends the route to the url.

Now you could use any routing provided by the `"https://jsonplaceholder.typicode.com/posts"`..
For example: You could use the following.
`http://localhost:3000/customComments`
`http://localhost:3000/customComments/1`
`http://localhost:3000/customComments?postId=1`

### **Custom Mock**

By default the Mock Server try's to fetch the data from `fetch` url.
If it fails then it tries to get it from `mock`.

Set `mockFirst` to true to get the mock first.
If the mock is not available then it tries a to get data from `fetch` url.

```jsonc
{
  "/customComments/:id?": {
    "fetch": "https://jsonplaceholder.typicode.com/comments",
    "mock": [
      { "id": 1, "username": "foo" },
      { "id": 2, "username": "bar" }
    ],
    "mockFirst": true
  }
}
```

### **Add Middlewares**

You can add n number of middlewares to a route which helps you to manipulate or log the data.
First Create a `middlewares.js` file.

```js
exports.log = (req, res, next) => {
  console.log(new Date());
  // make sure you always call next() method when you don't sent any response using res.send().
  next();
};
exports.wrapper = (req, res, next) => {
  const wrapperResponse = {
    message: "Successful",
    result: res.local.data,
  };
  res.send(wrapperResponse);
};
```

`routes.json`

```jsonc
{
  "/posts/:id": {
    "fetch": "https://jsonplaceholder.typicode.com/posts",
    "middlewares": ["log", "wrapper"] // give the name of the middlewares which are available in the middlewares.js
  },
  "/comment": {
    "fetch": { "url": "https://jsonplaceholder.typicode.com/comments/1" },
    "middlewares": ["log"]
  }
}
```

Note: A middleware must be available at the name of the middlewares given in `routes.json`

Now in server.js

```js
const { MockServer } = require("@r35007/mock-server");
new MockServer("./routes.json", undefined, "./middlewares.js").launchServer();
// Here in the undefined place it uses the default configs.
```

Now when you go to `http://localhost:3000/posts/1`, you can see the new data og in console and also wrap's the response with the object.

But When you go to `http://localhost:3000/comment`, you can only see the date log and will not be wrapped with the object.

## **Default Middlewares**

We also provide a two default middlewares.

### **loopMock**

setting middleware to loopMock helps to send you a looped response one after the other in the mock array for each url hit.

example:

```jsonc
{
  "/loopMock": {
    "middlewares": ["loopMock"], // method name to be called
    "mock": ["response1", "response2]
  }
}
```

Now go and hit `http://localhost:3000/loopMock`. For the first hit you get `response1` as a response and for the second hit you get `response2` as a response and its loops through each element in the mock array for each url hit.

### **groupMock**

setting middleware to groupMock helps to send you a response that matched the route path from the mock

example:

```jsonc
{
  "/name/:id": {
    "middlewares": ["groupMock"], // method name to be called
    "mock": {
      "/name/1": "name1",
      "/name/2": "name2"
    }
  }
}
```

Now go and hit `http://localhost:3000/name/1`, you get `name1` as a response.
Now go and hit `http://localhost:3000/name/2`, you get `name2` as a response.
Now go and hit `http://localhost:3000/name/3`, since id `3` is not available it send you `name1` as a response.

### **crudMock**

This middleware handles all the crud operations of the given mock.
Note : the mock must of type Array of objects and must contain a unique value of attribute `id`. Following are the operations performed by this method.

routes.json

```jsonc
{
  "/posts/:id?": {
    "mock": [
      {
        "userId": 1,
        "id": 1,
        "title": "sunt aut facere repellat provident o",
        "body": "quia et suscipit\nsuscipit recusandae "
      },
      {
        "userId": 1,
        "id": 2,
        "title": "qui est esse",
        "body": "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor"
      }
    ],
    "middlewares": ["crudMock"]
  }
}
```

`api.http`

```http
###

GET http://localhost:3000/posts

### // returns posts data that has userId equals 1

GET http://localhost:3000/posts?userId=1


### // returns only post that has id equals 1

GET http://localhost:3000/posts/1

###

POST http://localhost:3000/posts
content-type: application/json

{
  "userId": 2,
  "title": "Galactic Star"
}

### // Note : `id` must not be provided. It will be auto generated

POST http://localhost:3000/posts
content-type: application/json

[
  {
    "userId": 2,
    "title": "Star wars"
  },
  {
    "userId": 2,
    "title": "Avengers"
  }
]

###

PUT http://localhost:3000/posts
content-type: application/json

{
  "userId": 2,
  "id": 1,
  "title": "Updated title"
}

### // delete only post that has id equals 1

DELETE http://localhost:3000/posts/5


```

### **fetchOnce**

This middleware helps to fetch data only once and cache it for next time.

routes.json

```jsonc
{
  "/posts/:id?": {
    "fetch": "https://jsonplaceholder.typicode.com/posts",
    "middlewares": ["fetchOnce"]
  }
}
```

Here the it gets the data from the url at first and returns a existing fetchData for every other hit.

## **Injectors**

Injectors helps to inject a Route Configs explicitly.
This also helps to provide a common route configs.
Injector uses [`path-to-regexp`](https://github.com/pillarjs/path-to-regexp) pattern recognition to set config for multiple routes.

### **Inject Route Configs**

Here we are explicitly injecting `delay`, `middlewares`, `statusCode` to the `/posts` route.
You can any route configs to a specific or to a group of routes using Injectors.

example :

`routes.json`

```jsonc
{
  "/posts": {
    "fetch": { "url": "https://jsonplaceholder.typicode.com/posts" }
  },
  "/comments/1": {
    "fetch": { "url": "https://jsonplaceholder.typicode.com/comments/1" },
    "middlewares": ["crudMock", "log"]
  },
  "/comments/2": {
    "delay": 3000,
    "fetch": { "url": "https://jsonplaceholder.typicode.com/comments/2" }
  },
  "/comments/3": {
    "fetch": { "url": "https://jsonplaceholder.typicode.com/comments/3" }
  }
}
```

`injectors.json`

```jsonc
{
  "/posts": {
    "delay": 2000,
    "middlewares": ["log", "counter", "crudMock"],
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
Make sure the middlewares are available in the `middlewares.js` in the given middlewares name.

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
Make sure you give `(.*)` at the end of the `injectors.json` object to set route configs to all the routes.

## **Store Data**

Using `res.locals.store` you could store any value and can be shared across any routes.
This also helps to manipulate the response in many ways. Lets see a simple counter Example :

`server.js`

```js
const { MockServer } = require("@r35007/mock-server");

const routes = {
  "/counter": {
    middleware: ["countIncrement"],
  },
};

const middlewares = {
  countIncrement: (req, res) => {
    let count = res.locals.store.get(req.path);
    res.locals.store.set(req.path, count++);
    res.send(count);
  },
};

const store = {
  count: 5,
};

const mockServer = new MockServer(
  routes,
  undefined,
  middlewares,
  undefined,
  store
);
mockServer.launchServer();
```

```sh
nodemon server.js
```

From the above the count increases on each hit of the endpoint.

## **Locals**

`res.locals` helps to access the current route config, fetchData, store etc..
Here are the available optons in `res.locals`

```ts
interface Locals {
  routePath: string;
  routeConfig: {
    metods?: string[];
    statusCode?: number;
    delay?: number;
    fetch?: string | AxiosRequestConfig;
    mock?: any;
    mockFirst?: boolean;
    middlewares?: Array<defaultMiddlewaresName | string>;
  };
  fetch: AxiosRequestConfig;
  fetchData?: any;
  fetchError?: any;
  data: any;
  store: object;
}
```

### **Dynamic Route Config**

RouteConfigs are mutatable. Means we can able to modify the routeConfigs in runtime using middleware.
For Example:

`middlewares.js`

```js
exports.fetchOnce = (_req, res, next) =>{
  const locals = res.locals as Locals;
  const routeConfig = locals.routeConfig as RouteConfig; // return the current route's config.
  if (!routeConfig.mockFirst && locals.fetchData) {
    routeConfig.mockFirst = true;
    routeConfig.mock = locals.fetchData;
  }
  next();
}
```

The above middleware helps to fetch the data from url only once and saves the response as a mock for the next api hit.

## **Config**

you can provide your own config by passing the config object in the `MockServer` constructor. For Example :

`server.js` :

```js
// These are default config. You can provide your custom config as well.

const config = {
  port: 3000, // by default mock will be launched at this port. http://localhost:3000/
  rootPath: "./", // all paths will be relative to this path. Please provide a absolute path here.
  baseUrl: "/", // all routes will be prefixed with the given baseUrl.
  staticUrl: "", // Please provide a folder path. This will be hosted locally and all files will be statically accessed
  routeRewrite: {}, // example { "route/:id" : "newroute/:id" } - all routes that matches the pattern `route/:id` will be renamed to `newroute/:id`
  excludeRoutes: [], // example [ "route/:id"] - all routes that matched this pattern will be excluded
  reverseRouteOrder: false, // If true routes will be generated in reverse order
  throwError: false, // If True will throw an error instead of console log, if something went wrong
};

new MockServer("./routes.json", config).launchServer();
```

## Default Routes

- `Home` - [http://localhost:3000/home](http://localhost:3000/home)
- `Routes List` - [http://localhost:3000/routesList](http://localhost:3000/routesList)
- `Routes` - [http://localhost:3000/routes](http://localhost:3000/routes)
- `Config` - [http://localhost:3000/config](http://localhost:3000/config)
- `Store` - [http://localhost:3000/store](http://localhost:3000/store)

[http://localhost:3000/home](http://localhost:3000/home)

![Home Page](https://r35007.github.io/Mock-Server/homePage.png)

## CLI Usage

```
mock-server [options]

Options:
      --help         Show help                            [boolean]
      --version      Show version number                  [boolean]

  -r, --routes       Path to routes                       [string] [default: "https://jsonplaceholder.typicode.com/db"]
  -c, --config       Path to Config file                  [string]
  -m, --middlewares  Path to Middlewares file             [string]
  -i, --injectors    Path to Injectors file               [string]
  -st,--store        Path to Store                        [string]
  -p, --port         Set port                             [number] [default: 3000]
  -s, --static       Set static files directory           [string]

Examples:
  mock-server
  mock-server --r=routes.json
  mock-server --r=https://github.com/typicode/json-server/db
  mock-server --r=routes.json --port=4000
```

## API

### **MockServer**

This is a constructor to initialize the routes, config, middlewares, Injectors, store.

```js
const { MockServer } = require("@r35007/mock-server");
const mockServer = new MockServer(
  "./routes.json",
  "./config.json",
  "./middlewares.js",
  "./injectors.json",
  "./store.json"
).launcherServer();
mockServer.launchServer(); // starts the mock server.

// Note: the middlewares must be in .js extension
```

**`Params`**

| Name        | Type            | Required | Description                                             |
| ----------- | --------------- | -------- | ------------------------------------------------------- |
| routes      | string / object | No       | This object generates the local rest api.               |
| config      | string / object | No       | This object sets the port, common middleware and delay  |
| middlewares | string / object | No       | Here you initialize the needed custom middlewares       |
| injectors   | string / object | No       | Helps to inject a route configs for the existing routes |
| store       | string / object | No       | Helps to store values and share between routes          |

### **launchServer**

It validates all the params in the MockServer, loads the resources and starts the server.

```js
mockServer.launchServer();
```

### **createExpressApp**

Returns the instance of the express.Application - helps set any external routes or middleware.

```js
const app = mockServer.createExpressApp();
```

### **startServer**

Returns a Promise of `Server`. - helps to start the app server externally

```js
const server = await mockServer.startServer(3000); // port is optional param
```

### **stopServer**

Returns a Promise of Boolean. - helps to stop the app server externally

```js
const isStopped = await mockServer.stopServer();
```

### **resetServer**

Clears out all values and resets the server for a fresh start

```js
mockServer.resetServer();
```

### **loadResources**

```js
mockServer.loadResources();
```

### **createRoute**

```js
mockServer.createRoute(routePath, routeConfig);
```

**`Params`**

| Name        | Type   | Required | Default | Description             |
| ----------- | ------ | -------- | ------- | ----------------------- |
| routePath   | string | YES      |         | Your custom Route Path  |
| routeConfig | object | NO       | {}      | Set your Mock data here |

### **createDefaultRoutes**

Create a default home and routes list api

```js
mockServer.createDefaultRoutes();
```

### **setData**

set the routes, config, middlewares, injectors, store

```js
mockServer.setData(routes, config, middlewares, injectors, store);

//or

mockServer.setRoutes(routes);
mockServer.setConfig(config);
mockServer.setMiddlewares(middlewares);
mockServer.setInjectors(injectors);
mockServer.setStore(store);
```

**`Params`**

The same as the [MockServer](#mockserver)

### **Get Data**

returns the valid Routes, config, middlewares, injectors, store

```js
let { routes, config, middlewares, injectors, store } = mockServer.data; // returns current valid data of the Mock server.

// or

const routes = mockServer.routes;
const config = mockServer.config;
const middlewares = mockServer.middlewares;
const injectors = mockServer.injectors;
const store = mockServer.store;
```

### **Variables**

Other useful variables.

```js
const app = mockServer.app;
const server = mockServer.server;
const router = mockServer.router;
const routesList = mockServer.routesList;

const isServerLaunched = mockServer.isServerLaunched;
const isExpressAppCreated = mockServer.isExpressAppCreated;
const isServerStarted = mockServer.isServerStarted;
const isResourcesLoaded = mockServer.isResourcesLoaded;
const isDefaultsCreated = mockServer.isDefaultsCreated;
```

### **Validators**

These methods returns a valid data.

```js
const routes = mockServer.getValidRoutes(routes);
const config = mockServer.getValidConfig(config);
const middlewares = mockServer.getValidMiddlewares(middlewares);
const injectors = mockServer.getValidInjectors(injectors);
const store = mockServer.getValidStore(store);

const valid_routePaths = mockServer.getValidRoutePaths(routePaths); // returns list of valid routePath
const valid_routePath = mockServer.getValidRoutePath(routePath); // returns valid routePath
```

### **Path Check**

These other useful methods.

```js
const parsedUrl = mockServer.parseUrl(url); // returns a valid path.
const isPathExist = mockServer.isPathExist(path);
const isDirectoryExist = mockServer.isDirectoryExist(path);
const isFileExist = mockServer.isFileExist(path);
```

### **generateMockFromHAR**

The HTTP Archive format, or HAR, is a JSON-formatted archive file format for logging of a web browser's interaction with a site. The common extension for these files is .har. [Wikipedia](<https://en.wikipedia.org/wiki/HAR_(file_format)>).

Using this now it is very much simpler to mock your prod data in ease. Follow the steps to mock your prod Data.

Step 1 : Open Chrome and developer tools
Step 2 : Start the network listening and run your app which you like to mock the data
Step 3 : click the export HAR download icon and save it as a `localhost.json`.
Step 4 : Now do the following code in index.js

```js
const { MockServer } = require("@r35007/mock-server");
const localhostData = require("./localhost.json");

const mockServer = new MockServer();

const entryCallback = (entry, routePath, routeConfig, pathToRegexp) => {
  return { [routePath]: routeConfig };
};

const finallCallback = (harData, generatedMock, pathToRegexp) => generatedMock;

const mock = mockServer.generateMockFromHAR(
  "./localhost.har",
  {
    routesToLoop: ["*"],
    routesToGroup: ["posts/:id"],
    routeRewrite: { "/posts/:id": "customPosts/:id" },
  },
  entryCallback,
  finallCallback
);
mockServer.setData(mock);
mockServer.launchServer();
```

**`Params`**

| Name          | Type          | Required | Default   | Description                                                                   |
| ------------- | ------------- | -------- | --------- | ----------------------------------------------------------------------------- |
| harData       | object/string | No       | {}        | This object generates the local rest api.                                     |
| config        | object        | No       | {}        | Here you can give routesToLoop, routesToGroup, routeRewrite and excludeRoutes |
| entryCallback | Function      | No       | undefined | This method is called on each entry of the har data                           |
| finalCallback | Function      | No       | undefined | This method is at the end of the final generated mock                         |

Note: If using VS Code extension, You can give the `entryCallback` and `finalCallback` in the `middlewares.js` when using the command `Generate Mock From HAR`

```js
exports.entryCallback = (entry, routePath, routeConfig, pathToRegexp) => {
  // your code goes here
};

exports.finalCallback = (harData, generatedMock, pathToRegexp) => {
  // your code goes here
  // Note: this method will always be called even in catch block when something went wrong;
};
```

### **getRouteMatchList**

returns routes string from the given pattern route to match

```js
const matchedList = mockserver.getRouteMatchList("/posts/:id");
```

**`Params`**

| Name         | Type   | Required | Default | Description                                         |
| ------------ | ------ | -------- | ------- | --------------------------------------------------- |
| routeToMatch | string | YES      |         | Give the route pattern to match.                    |
| routes       | object | No       | routes  | Give the routes object to compare the route Pattern |

### **getRewrittenRoutes**

returns routes along with rewritten routes

```js
const routes = mockserver.getRewrittenRoutes(routes, {
  "/posts/:id": "/custom/posts/:id",
});
```

**`Params`**

| Name         | Type   | Required | Default             | Description                                         |
| ------------ | ------ | -------- | ------------------- | --------------------------------------------------- |
| routes       | object | YES      |                     | Give the routes object to compare the route Pattern |
| routeToMatch | string | NO       | config.routeRewrite | Give the routes pattern to rewrite.                 |

### **excludeRoutes**

Helps to excluded routes and returns an unexcluded routes.

```js
const routes = mockserver.excludeRoutes(routes, ["/posts/:id"]);
```

**`Params`**

| Name            | Type     | Required | Default              | Description                                         |
| --------------- | -------- | -------- | -------------------- | --------------------------------------------------- |
| routes          | object   | YES      |                      | Give the routes object to compare the route Pattern |
| routesToExclude | string[] | NO       | config.excludeRoutes | Give the route pattern to exclude routes.           |

### **getJSON**

return all the json files data to a combined json data from the given path

```js
const mock = mockServer.getJSON(directoryPath, excludeFolders, true);
```

**`Params`**

| Name           | Type    | Required | Default | Description                                                   |
| -------------- | ------- | -------- | ------- | ------------------------------------------------------------- |
| directoryPath  | string  | NO       | "./"    | Provide the filepath or the directory path                    |
| excludeFolders | object  | No       | []      | list of path or filename to exclude from requiring json files |
| recursive      | boolean | No       | true    | If true, it search's for all nested folder                    |

### **getFilesList**

returns the list of all fileName, extension and its path from the given folder.

```js
const mock = mockServer.getFilesList(directoryPath, excludeFolders, true);
```

**`Params`**

| Name           | Type    | Required | Default | Description                                                   |
| -------------- | ------- | -------- | ------- | ------------------------------------------------------------- |
| directoryPath  | string  | NO       | "./"    | Provide the filepath or the directory path                    |
| excludeFolders | object  | No       | []      | list of path or filename to exclude from requiring json files |
| recursive      | boolean | No       | true    | If true, it search's for all nested folder                    |

## Author

**Sivaraman** - [sendmsg2siva.siva@gmail.com](sendmsg2siva.siva@gmail.com)

- _Website_ - [https://r35007.github.io/Siva_Profile/](https://r35007.github.io/Siva_Profile/)
- _Portfolio_ - [https://r35007.github.io/Siva_Profile/portfolio](https://r35007.github.io/Siva_Profile/portfolio)
- _GitHub_ - [https://github.com/R35007/Mock-Server](https://github.com/R35007/Mock-Server)

## License

MIT
