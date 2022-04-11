/* 
  Global Middlewares
  These middlewares will be addded to start of the the express app 
*/
exports.globals = [
  (req, res, next) => {
    console.log(req.path);
  }
]


/* 
  Used in VS Code Mock Server extension
  This method is called only on generating db suing MockServer: Generate Db Command
  It will be called for each entry in a HAR formatted data
  Here you can return your custom route and routeConfig
  `entryCallback` is a reserved word for generating Db 
*/
exports.entryCallback = (entry, routePath, routeConfig) => {
  // your code goes here ...
  return { [routePath]: routeConfig }
};

/* 
  Used in VS Code Mock Server extension
  This method is called only on generating db suing MockServer: Generate Db Command
  It will be called at last of all entry looping.
  Here you can return your custom db
  Whatever you return here will be pasted in the file
  `finalCallback` is a reserved word for generating Db
*/
exports.finalCallback = (data, db) => {
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
    "middlewareNames": [
      "DataWrapper"
    ]
  }
*/

// You can create n number of middlewares like this and can be used in any routes as mentioned in above example.
exports.DataWrapper = (req, res, next) => {
  res.locals.data = {
    status: "Success",
    message: "Retrived Successfully",
    result: res.locals.data
  }
  next();
};

exports.CustomLog = (req, res, next) => {
  console.log(new Date());
  next();
};

// Access store value
exports.GetStoreValue = (req, res, next) => {
  res.locals.data = "The store value is : " + res.locals.store.data;
  next();
};