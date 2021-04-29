# Mock Server[](#mock-server) [![](https://badge.fury.io/js/mock-server.svg)](http://badge.fury.io/js/mock-server)

Get a full REST API with **zero coding** in **less than 30 seconds** (seriously)

Created with <3 for front-end developers who need a quick back-end for prototyping and mocking.

## Table of contents

- [Getting started](#getting-started)
- [Advantages](#advantages)
- [How To Use](#how-to-use)
  - [Route Config](#route-config)
  - [Default Middlewares](#default-middlewares)
    - [loopMock](#loopmock)
    - [groupMock](#groupmock)
    - [curdMock](#curdmock)
  - [User Middleware](#user-middleware)
  - [Injectors](#injectors)
  - [Globals](#globals)
  - [Config](#config)
- [Default Routes](#default-routes)
- [API](#api)
  - [MockServer](#mockserver)
  - [launchServer](#launchserver)
  - [createExpressApp](#createexpressapp)
  - [startServer](#startserver)
  - [stopServer](#stopserver)
  - [resetServer](#resetserver)
  - [loadResources](#loadresources)
  - [createDefaultRoutes](#createdefaultroutes)
  - [setData](#setdata)
  - [Get Data](#get-data)
  - [Variables](#variables)
  - [Validators](#validators)
  - [Path Check](#path-check)
  - [transformHar](#transformhar)
  - [getJSON](#getjson)
  - [getFilesList](#getfileslist)
- [Author](#author)
- [License](#license)

## Getting started

Install Mock Server

```sh
npm install -g @r35007/mock-server
```

install nodemon for watching changes

```sh
npm install -g nodemon
```

Create a `mock.json` file

```json
{
  "/hello": {
    "mock": "hello World",
  },
};

```

Now to run the file go to terminal and type the following

```sh
mock-server ./mock.json
```

The above command runs the file and starts the local server.

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

## How To Use

### **Route Config**

You could also delay the response of your request.
For Example:

routes.json

```json
{
  "routeName, routeName2": {
    "delay": 2000, // in milliseconds
    "statusCode": 200, // in number between 100 to 600
    "middleware": "loopMock", // method name to be called
    /* 
      You must provide a valid Url in `initialMock` attribute. It fetches the data and gives as a response.
      If this fetch call fails, it returns the `mock` data.
      If the `mock` data is not provided then it tries to fetch the data from te `alternateMock` url.
    */
    "initialMock": "https://jsonplaceholder.typicode.com/todos/1",
    "mock": [
      {
        "name": "foo"
      },
      {
        "name": "bar"
      }
    ],
    "alternateMock": {
      "url": "./myFile.json",
      "isFile": true
    }
  }
}
```

Note : `initialMock` and `alternateMock` can be either `string` type or `AxiosRouteConfig` type. Set `isFile` to be true to fetch the file from the given url.

### **Default Middlewares**

We also provide a two default middlewares.

#### **loopMock**

setting middleware to loopMock helps to send you a looped response one after the other in the mock array for each url hit.

example:

```json
{
  "routeName": {
    "middleware": "loopMock", // method name to be called
    "mock": ["response", "response2]
  }
}
```

Now go and hit `http://localhost:3000/routeName`. For the first hit you get `response1` as a response and for the second hit you get `response2` as a response and its loops through each element in the mock array for each url hit.

#### **groupMock**

setting middleware to groupMock helps to send you a response that matched the route path from the mock

example:

```json
{
  "name/:id": {
    "middleware": "groupMock", // method name to be called
    "mock": {
      "name/1": "name1",
      "name/2": "name2"
    }
  }
}
```

Now go and hit `http://localhost:3000/name/1`, you get `name1` as a response.
Now go and hit `http://localhost:3000/name/2`, you get `name2` as a response.
Now go and hit `http://localhost:3000/name/3`, since id `3` is not available it send you `name1` as a response.

#### **crudMock**

This middleware handles all the crud operations of the given mock.
Note : the mock must of type Array of objects and must contain a unique value of attribute `id`. Following are the operations performed by this method.

routes.json

```json
{
  "posts/:id?": {
    "initialMock": "https://jsonplaceholder.typicode.com/posts",
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
    "middleware": "crudMock"
  }
}
```

api.http

```txt
### // returns all posts data

GET http://localhost:3000/posts

### // returns all posts data that has userId equals 1

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

### **User Middleware**

You could also have your own custom middlewares.
example:
middlewares.js

```js
exports.customMiddleware = ({ req, res, next, data, globals, locals }) => {
  res.send("custom middleware");
};

exports.log = ({ req, res, next, data, globals, locals }) => {
  console.log(req.path); // logs the route path
  next();
};
```

routes.json

```json
{
  "route1": {
    "middleware": "customMiddleware", // the middleware must be available in the middleware.js file
    "mock": "dummy"
  },
  "route2": {
    "middleware": "log",
    "mock": "Please check the terminal log"
  }
}
```

```sh
mock-server ./routes.json ./config.json ./injectors.json ./globals.json ./middlewares.js
```

### **Injectors**

Injectors helps to inject a Route Configs explicitly.
This also helps to provide a common route configs.
Injector uses [`path-to-regexp`](https://github.com/pillarjs/path-to-regexp) pattern recognition to set config for multiple routes.

example :

middlewares.js

```js
exports.customLog = ({ req, next }) => {
  console.log(req.path);
  next(); // If not sending any response please call `next()` method.
};
```

injectors.json

```json
{
  "route/:id"{
    "delay": 2000,
    "override": true // If true it overrides the existing delay property
  },
  "(.*)":{ // (.*) matches every route path. Helps to provide a common route configs
    "middleware":"customLog"
  }
}
```

routes.json

```json
{
  "route/1": {
    "delay": 5000, // will be overridden by the injector
    "mock": "foo"
  },
  "route/2": {
    "mock": "bar"
  },
  "route/1/2": {
    "mock": "bro"
  }
}
```

```sh
mock-server ./routes.json ./config.json ./injectors.json ./globals.json ./middlewares.js
```

from the above code `route/1` and `route/2` has delay of 2 seconds and all routes has a middleware mapped to `customLog`

### **Globals**

Using **Globals** you could store any value in the `globals` object and can be shared across any routes.
This also helps to manipulate the response in many ways. Lets see a simple count Example :

routes.json

```json
{
  "/count": {
    "middleware": "countIncrement"
  }
}
```

globals.json

```json
{
  "/count": 5 // count starts from five
}
```

middleware.js

```js
exports.countIncrement: ({ req, res, globals }) => {
    globals[req.path].count++;
    res.send(globals[req.path].count);
  },
```

```sh
mock-server ./routes.json ./config.json ./injectors.json ./globals.json ./middlewares.js
```

From the above the count increases on each hit of the endpoint.

### **Config**

you can provide your own config by passing the config object in the `MockServer` constructor. For Example :

`default config` :

```json
{
  "port": 3000, // by default mock will be launched at this port. http://localhost:3000/
  "rootPath": "./", // all paths will be relative to this path. Please provide a absolute path here.
  "baseUrl": "", // all routes will be prefixed with the given baseUrl.
  "staticUrl": "", // Please provide a folder path. This will be hosted locally and all files will be statically accessed
  "proxy": {}, // example { "route/:id" : "newroute/:id" } - all routes that matches the pattern `route/:id` will be renamed to `newroute/:id`
  "excludeRoutes": [], // example [ "route/:id"] - all routes that matched this pattern will be excluded
  "reverseRouteOrder": false, // If true routes will be generated in reverse order
  "throwError": false // If True will throw an error instead of console log, if something went wrong
}
```

## Default Routes

- `Home` - [http://localhost:3000](http://localhost:3000)
- `Routes` - [http://localhost:3000/routes](http://localhost:3000/routes)
- `Globals` - [http://localhost:3000/globals](http://localhost:3000/globals)
- `Routes List` - [http://localhost:3000/routesList](http://localhost:3000/routesList)

The routes and port can be overridden in the `routes.json`

## API

### **MockServer**

This is a constructor to initialize the routes, config, globals, Injectors, middlewares

middlewares.js

```js
exports.logTime = ({ next }) => {
  console.log(new Date());
  next();
};

exports.counter = ({ req, globals, res }) => {
  const path = req.path;
  globals[path] += 1;

  res.send(globals[path]);
};
```

routes.js

```js
const { MockServer } = require("@r35007/mock-server");
const middlewares = require("./middlewares.js");

const routes = {
  "/hello": {
    mock: "Hello World",
    middleware: "logTime",
  },
  "/counter": {
    middleware: "counter",
  },
};

const config = {
  port: 4000,
};

const globals = {
  "/counter": 0,
};

const Injectors = {
  "/hello": {
    delay: 2000,
  },
};

const mockServer = new MockServer(
  routes,
  config,
  injectors,
  globals,
  middlewares
);
mockServer.launchServer(); // starts the mock server.

// You can also prove the path in initializer.
// Note: the middleware must be in .js extension
new MockServer(
  "./routes.json",
  "./config.json",
  "./injectors.json",
  "./globals.json",
  "./middlewares.js"
).launcherServer();
```

**`Params`**

| Name        | Type            | Required | Description                                             |
| ----------- | --------------- | -------- | ------------------------------------------------------- |
| routes      | string / object | No       | This object generates the local rest api.               |
| config      | string / object | No       | This object sets the port, common middleware and delay  |
| injectors   | string / object | No       | Helps to inject a route configs for the existing routes |
| globals     | string / object | No       | This object helps to store the global values            |
| middlewares | string / object | No       | Here you initialize the needed custom middlewares       |

### **launchServer**

It validates all the params in the MockServer, loads the resources and starts the server.

```js
mockServer.launchServer();
```

### **createExpressApp**

Returns the instance of the express.Application - helps set any external routes or middleware.

```js
mockServer.createExpressApp();
```

### **startServer**

Returns a Promise of `Server`. - helps to start the app server externally

```js
mockServer.startServer();
```

### **stopServer**

Returns a Promise of Boolean. - helps to stop the app server externally

```js
mockServer.stopServer();
```

### **resetServer**

Clears out all values and resets the server for a fresh start

```js
mockServer.resetServer();
```

### **loadResources**

Returns a Promise of Routes results - the success and failure status of the generated routes

```js
mockServer.loadResources();
```

### **createDefaultRoutes**

Create a default home and routes list api

```js
mockServer.createDefaultRoutes();
```

### **setData**

set the routes, config, injectors, globals.

```js
mockServer.setData(routes, config, injectors, globals, middlewares);

//or

mockServer.setRoutes(routes);
mockServer.setConfig(config);
mockServer.setInjectors(injectors);
mockServer.setGlobals(globals);
mockServer.setMiddlewares(middlewares);
```

**`Params`**

The same as the [MockServer](#mockserver)

### **Get Data**

returns the valid Routes, config, globals, injectors, middlewares

```js
let { routes, config, injectors, globals, middlewares } = mockServer.data; // returns current valid data of the Mock server.

// or

routes = mockServer.routes;
config = mockServer.config;
injectors = mockServer.injectors;
middlewares = mockServer.middlewares;
```

### **Variables**

Other useful variables.

```js
const app = mockServer.app;
const server = mockServer.server;

const isServerLaunched = mockServer.isServerLaunched;
const isExpressAppCreated = mockServer.isExpressAppCreated;
const isServerStarted = mockServer.isServerStarted;
const isResourcesLoaded = mockServer.isResourcesLoaded;
const isDefaultsCreated = mockServer.isDefaultsCreated;
```

### **Validators**

These methods returns a valid data.

```js
const valid_config = mockServer.getValidConfig(config);
const valid_globals = mockServer.getValidGlobals(globals);
const valid_injectors = mockServer.getValidInjectors(injectors);
const valid_routes = mockServer.getValidRoutes(routes);
const valid_middlewares = mockServer.getValidRoutes(middlewares);

const valid_proxy = mockServer.getValidProxy(proxy);
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

### **transformHar**

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
const mock = mockServer.transformHar(
  localhostData,
  (entry, route, response) => {
    return { [route]: response };
  }
);
mockServer.setData(mock);
mockServer.launchServer();
```

**`Params`**

| Name     | Type     | Required | Default   | Description                                         |
| -------- | -------- | -------- | --------- | --------------------------------------------------- |
| harData  | object   | No       | {}        | This object generates the local rest api.           |
| callback | Function | No       | undefined | This method is called on each entry of the har data |

### **getMockJSON**

return the current routes in a json format

```js
const mock = mockServer.getMockJSON();
```

### **getMatchedRoutesList**

Helps to get list of all exact and pattern Matched routes

```js
const {MockServer} = require("@r35007/mock-server");
const mockServer = new MockServer()
const data = {
  "parent/1":"data 1",
  "parent/2":"data 2",
  "parent/1/1":"data 1/1",
  "parent/3":"data 3",
  "parent/1/2":"data 1/2",
}

matchList = {
  exactMatch:["parent/1/1"]
  patternMatch:["parent/:child"]
}
const routes = mockServer.getMatchedRoutesList(data, matchList);
```

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
