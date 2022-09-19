/* 
  Global Middlewares
  These middlewares will be added to start of the the express app 
*/
const globals = [
  (req, res, next) => {
    console.log(req.originalUrl);
    next();
  }
]

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
  const { config, db, injectors, middlewares, rewriters, store } = data || {};
  // Your Global middleware logic here before setting default middlewares by the MockServer

  return {
    globals,
    DataWrapper,
    CustomLog,
    GetStoreValue,
  }
}