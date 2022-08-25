/* 
  Global Middlewares
  These middlewares will be added to start of the the express app 
*/
const _globals = [
  (req, res, next) => {
    console.log(req.originalUrl);
    next();
  }
]

/* 
  Used in VS Code Mock Server extension
  This method is called only on generating db suing MockServer: Generate Db Command
  It will be called for each entry/hits in a HAR/Kibana formatted data
  Here you can return your custom route and routeConfig
  `_harEntryCallback`, `_kibanaHitsCallback` is a reserved word for generating Db 
*/
const _harEntryCallback = (entry, routePath, routeConfig) => {
  // your code goes here ...
  return { [routePath]: routeConfig }
};
const _kibanaHitsCallback = (hit, routePath, routeConfig) => {
  // your code goes here ...
  return { [routePath]: routeConfig }
};

/* 
  Used in VS Code Mock Server extension
  This method is called only on generating db suing MockServer: Generate Db Command
  It will be called at last of all entry/hits looping.
  Here you can return your custom db
  `_harDbCallback`, `_KibanaDbCallback` is a reserved word for generating Db
*/
const _harDbCallback = (data, db) => {
  // your code goes here ...
  return db;
};
const _KibanaDbCallback = (data, db) => {
  // your code goes here ...
  return db;
};

/* 
  This is a Express middleware used to call on a specific routes.
  example in db.json
  {
    "/customMiddleware": {
    "_config": true,
    "fetch": "http://jsonplaceholder.typicode.com/users",
    "middlewares": [
      "DataWrapper"
    ]
  }
*/

// You can create n number of middlewares like this and can be used in any routes as mentioned in above example.
const DataWrapper = (req, res, next) => {
  res.locals.data = {
    status: "Success",
    message: "Retrieved Successfully",
    result: res.locals.data
  }
  next();
};

const CustomLog = (req, res, next) => {
  console.log(new Date());
  next();
};

// Access store value
const GetStoreValue = (req, res, next) => {
  const store = res.locals.getStore();
  res.locals.data = "The store value is : " + store.data;
  next();
};

module.exports = (mockServer) => {
  const { app, routes, data, getDb, getStore } = mockServer || {};
  const { config, db, injectors, middlewares, rewriters, store } = data;
  // Your Global middleware logic here before setting default middlewares by the MockServer

  return {
    _globals,
    _harEntryCallback,
    _kibanaHitsCallback,
    _harDbCallback,
    _KibanaDbCallback,
    DataWrapper,
    CustomLog,
    GetStoreValue,
  }
}