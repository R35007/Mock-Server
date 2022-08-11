module.exports = {
  "/customMockData/1": {
    "description": "Since '_config' flag is not set to true. This whole object will be considered as a mock data. If you don't have any specific route configuration you can directly give the mock data to the route or please make sure you provide '_config' to true to set any route configuration.",
    "mock": [
      {
        "userId": 1,
        "id": 1,
        "title": "Lorem ipsum dolor sit.",
        "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
      },
      {
        "userId": 1,
        "id": 2,
        "title": "Lorem ipsum dolor sit.",
        "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
      },
      {
        "userId": 1,
        "id": 3,
        "title": "Lorem ipsum dolor sit.",
        "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
      },
      {
        "userId": 1,
        "id": 4,
        "title": "Lorem ipsum dolor sit.",
        "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
      },
      {
        "userId": 1,
        "id": 5,
        "title": "Lorem ipsum dolor sit.",
        "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
      }
    ]
  },
  "/customMockData/2": {
    "_config": true,
    "mock": [
      {
        "userId": 1,
        "id": 1,
        "title": "Lorem ipsum dolor sit.",
        "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
      },
      {
        "userId": 1,
        "id": 2,
        "title": "Lorem ipsum dolor sit.",
        "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
      },
      {
        "userId": 1,
        "id": 3,
        "title": "Lorem ipsum dolor sit.",
        "body": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolorem."
      }
    ]
  },
  "/customDelay": {
    "_config": true,
    "delay": 2000,
    "description": "Note: give delay in milliseconds",
    "mock": "This is response is received with a delay of 2000 milliseconds"
  },
  "/customStatusCode": {
    "_config": true,
    "statusCode": 500,
    "mock": "This is response is received with a statusCode of 500"
  },
  "/fetch/photos/records/data": {
    "_config": true,
    "description": "By default fetch call will be made only once. Then it stores the value in the `fetchData` attribute and make the `fetchCount` to 0. When you again hit the url it will get the data from `fetchData` and returns as a response",
    "fetch": "http://jsonplaceholder.typicode.com/photos"
  },
  "/fetch/comments/proxy": {
    "_config": true,
    "description": "When you directly give the url, all the request query params and posted body data will also to sent to the given url",
    "fetch": "http://jsonplaceholder.typicode.com/comments",
    "fetchCount": -1
  },
  "/posts/:id?": {
    "_config": true,
    "fetch": "http://jsonplaceholder.typicode.com${req.url}",
    "fetchCount": -1
  },
  "/mockFirst": {
    "_config": true,
    "description": "This route sends the mock data first. If the mock attribute is undefined then It tries to fetch the data from the url. By default mockFirst is set to false.",
    "mockFirst": true,
    "mock": "This is response comes from mock attribute",
    "fetch": "http://jsonplaceholder.typicode.com/todos"
  },
  "/fetch/posts/customOptions/:id": {
    "_config": true,
    "description": "Give the `fetch` attribute as a axios request object. enclose the value with ${<variables>} to pass the req values",
    "fetch": {
      "method": "GET",
      "url": "http://jsonplaceholder.typicode.com/posts/${req.params.id}"
    },
    "fetchCount": 5
  },
  "/fetch/local/file": {
    "_config": true,
    "description": "The given fetch path will be relative to the root path given in config",
    "fetch": "./data/users.json"
  },
  "/fetch/local/image": {
    "_config": true,
    "description": "The given fetch path will be relative to the root path given in config",
    "fetch": "./data/mockserverlogo.png",
    "fetchCount": -1
  },
  "/fetch/image/url": {
    "_config": true,
    "fetch": "https://via.placeholder.com/600/771796"
  },
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
  },
  "/fetch/404/skipFetchError": {
    "_config": true,
    "description": "Bu default fetch returns the actual error if occur. If you set `skipFetchError` flag to true. the If any error occur in fetch call it will then skips the fetch error and return you the mock data",
    "fetch": "http://localhost:3000/404",
    "skipFetchError": true,
    "mock": "This data is returned due to some error in fetch call. You can see the error in 'fetchError' attribute",
    "fetchCount": -1
  },
  "/fetch/users/customMiddleware": {
    "_config": true,
    "description": "Note: This middleware must be available in the 'middleware.js' by the below given names. This 'DataWrapper' will be called on every hit of this route.",
    "fetch": "http://jsonplaceholder.typicode.com/users",
    "middlewares": [
      "DataWrapper"
    ]
  },
  "/fetch/users/customMiddleware2": {
    "_config": true,
    "description": "Note: This middleware must be available in the 'middleware.js' by the below given names. This 'DataWrapper' will be called on every hit of this route.",
    "fetch": "http://jsonplaceholder.typicode.com/users",
    "middlewares": (req, res, next) => {
      res.locals.data = {
        status: "Success",
        message: "Retrieved Successfully",
        result: res.locals.data
      }
      next();
    }
  },
  "/addDirectMiddleware": (req, res) => {
    // this route will ignoreMiddlewareWrappers
    // In this route we cannot access res.locals.data or res.locals.getStore() etc...
    // This route is similar to /ignoreMiddlewareWrappers route given below
    res.send('This route cannot access res.locals.data or res.locals.getStore() etc... It ignores all helper middleware wrappers.');
  },
  "/ignoreMiddlewareWrappers": {
    "_config": true,
    "ignoreMiddlewareWrappers": true,
    "middlewares": (req, res) => {
      res.send('This route cannot access res.locals.data or res.locals.getStore() etc... It ignores all helper middleware wrappers.');
    }
  },
  "/middleware/utils/list": {
    "_config": true,
    "description": "These are the list of predefined middleware that are available for ease of use. For Example: This route uses the '_IterateResponse' middleware to iterate the mock data",
    "mock": [
      "_IterateResponse - Iterates to each response in an array for each hit. Note: the data must be an array",
      "_IterateRoutes - Iterates to each route in a mock data. Note: mock data contains the list of routes to be redirected",
      "_AdvancedSearch - This middleware helps to retrieve the data using filter, sort, pagination etc... Note: data must be an array of objects and contains a unique id",
      "_CrudOperation - Helps to do all the CRUD operations like Create, Read, Update, Delete using GET, PUT, PATCH, POST, DELETE method. Note: Id values are not mutable. Any id value in the body of your PUT or PATCH request will be ignored. Only a value set in a POST request will be respected, but only if not already take",
      "_FetchTillData - Helps to keep on make fetch calls until it gets a valid success data",
      "_SetFetchDataToMock - This middleware sets the 'fetchData' to 'mock' attribute. Note: The existing data in mock will be overridden",
      "_SetStoreDataToMock - This is similar to '_FetchTillData'. This sets the 'store' value to 'mock' attribute",
      "_MockOnly - Always send only the mock data the even If it has a 'fetchData'.",
      "_FetchOnly - Always send only the 'fetchData'",
      "_ReadOnly - Only GET methods calls are allowed."
    ]
  },
  "/middleware/utils/example/_IterateResponse": {
    "_config": true,
    "description": "This route iterates through each data. Try to hit again to see the data change. Note: The data must be of type array",
    "fetch": {
      "url": "http://jsonplaceholder.typicode.com/photos"
    },
    "middlewares": [
      "_IterateResponse"
    ]
  },
  "/middleware/utils/example/_IterateRoutes": {
    "_config": true,
    "description": "This route iterates through each route provide in the mock. Try to hit again to see the route change. Note: The data must be of type array",
    "mock": [
      "/injectors/1",
      "/injectors/2"
    ],
    "middlewares": [
      "_IterateRoutes"
    ]
  },
  "/middleware/utils/example/_AdvancedSearch/users/:id?": {
    "_config": true,
    "fetch": {
      "url": "http://jsonplaceholder.typicode.com/users"
    },
    "middlewares": [
      "_AdvancedSearch"
    ]
  },
  "/middleware/utils/example/_FetchTillData": {
    "_config": true,
    "description": "This route keeps on making fetch call until it gets a success data.",
    "fetch": "http://jsonplaceholder.typicode.com/dbs",
    "middlewares": [
      "_FetchTillData"
    ]
  },
  "/injectors/1": "I am from /injectors/1",
  "/injectors/2": "I am from /injectors/2",
  "/injectors/:id": {},
  "/getStoreValue": {
    "_config": true,
    "description": "This will call the below middleware and send the store value.",
    "middlewares": [
      "GetStoreValue"
    ]
  },
  "/internalRequest": {
    "_config": true,
    "description": "Gets the data from /customMockData/1 route",
    "fetch": "http://${config.host}:${config.port}/customMockData/1"
  },
  "/pageNotFound": {
    "_config": true,
    "fetch": "http://${config.host}:${config.port}/404",
    "fetchCount": -1
  }
}