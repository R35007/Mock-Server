## v9.2.2

- Build Fix

## v9.2.1

- Build Fix

## v9.2.0

- added - `log` in options - If true it logs the details.
- removed - `mockServer` in options from `launchServer`, `resources` and all Setters.
- fixed - passing a method to set data requires a instance of the mockserver explicitly - `Fixed`
- added - terminal spinners.
- added - `prefixed` method in utils. Helps to add route prefix for all the all the routes in the given Db.

## v9.1.0

- revoked - mockServer.rewriter`wont't set`rewriters`. - Now It will set to the global rewriters
- update - `config.host` - Set to empty string to set the host as your Local Ip Address.

## v9.0.1

- If methods passed as a param not working - `Fixed`.
- Update - `mockServer.default` wont't set `config`.
- Update - `mockServer.rewriter` wont't set `rewriters`.
- Always use only `Setter` methods to set any data.

## v9.0.0

- Renamed - `_getDb()`, `_getStore` to `getDb()`, `getStore()`.
- Added- Now it automatically picks the `index.js` file from the given folder path instead of getting all the files from the folder.
- Added- Now we can give a method as a param to set any config, rewriter, injectors, store, sb etc...
  For example: `db.js`

```js
const { MockServer } = require("@r35007/mock-server");
module.exports = (mockServer) => {
  if (mockServer) {
    // This can be undefined If you don't pass the mockServer instance.
  }
  return {
    // Your Db here
    "/post": { id: 1, name: "foo" },
  };
};

const mockServer = MockServer.Create();
const resources = mockServer.resource(db, { mockServer });
mockServer.app.use(resources);
```

> Note: For now it cant handle async methods.

- Updated following method params.

```ts
// launchServer sets all the resource data. It sets db, injectors, middlewares, store, rewriters, middlewares.
launchServer(db?: ParamTypes.Db, { injectors, middlewares, store, rewriters, router }?: LaunchServerOptions): Promise<Server | undefined>;
// Resources sets only db and it will not set injectors, middlewares or any other options provided. This db will be added to the existing db.
resources(db?: ParamTypes.Db, { injectors, middlewares, mockServer, reverse, rootPath, dbMode, router }?: ResourceOptions): express.Router;

// Setters
setData(data?: SetData, options?: SetterOptions): void;
setConfig(config?: Params.Config, { rootPath, merge, mockServer }?: SetterOptions): void;
setRewriters(rewriters?: Params.Rewriters, { rootPath, merge, mockServer }?: SetterOptions): void;
setMiddlewares(middleware?: Params.Middlewares, { rootPath, merge, mockServer }?: SetterOptions): void;
setInjectors(injectors?: Params.Injectors, { rootPath, merge, mockServer }?: SetterOptions): void;
setStore(store?: Params.Store, { rootPath, merge, mockServer }?: SetterOptions): void;
setDb(db?: Params.Db, { injectors, rootPath, reverse, dbMode, merge, mockServer }?: SetterOptions): void;

// Validators
getValidConfig(config?: ParamTypes.Config | undefined, { rootPath, mockServer }?: SetterOptions): ValidTypes.Config;
getValidMiddlewares(middlewares?: ParamTypes.Middlewares | undefined, { rootPath, mockServer }?: SetterOptions): ValidTypes.Middlewares;
getValidInjectors(injectors?: ParamTypes.Injectors | undefined, { rootPath, mockServer }?: SetterOptions): ValidTypes.Injectors;
getValidStore(store?: ParamTypes.Store | undefined, { rootPath, mockServer }?: SetterOptions): ValidTypes.Store;
getValidRewriters(rewriters?: ParamTypes.Rewriters | undefined, { rootPath, mockServer }?: SetterOptions): ValidTypes.Rewriters;
getValidDb(data?: ParamTypes.Db | undefined, { mockServer, injectors, rootPath, reverse, dbMode }?: SetterOptions): ValidTypes.Db;
```

## v8.0.1

- removed unwanted console logs.

## v8.0.0

- added `merge` param in all setters. If true it merges the data with the existing.
  For Example:

  ```js
  mockServer.setDb({ user:{ id: 1, name: "foo" } });
  mockServer.setDb({ post:{ id: 1, name: "bar" } }); // replaces the previous one
  mockServer.setDb({ comment:{ id: 1, comment: "I am Happy !" } }, true); // adds to the previous one

  mockServer.db
  {
    "/post":{_config: true, mock: { id: 1, name:"bar" } }
    "/comment":{_config: true, mock: { id: 1, comment: "I am Happy !" } }
  }
  ```

- renamed `defaultRoutes` to `homePage`. Now we can use `mockServer.homePage` which returns the hoePage router.
- removed - `mockServer.router`
- removed - `mockServer.addDb` instead use `mockServer.resource`
- update - `mockServer.resources` will always return the new router and if repeated it will add the resource to the existing resources.
  For Example:

  ```js
  const user = mockServer.resources({ user:{ id: 1, name: "foo" } }); // creates user resource
  mockServer.app.use(user);
  const post = mockServer.resources({ post:{ id: 1, name: "bar" } }); // creates post resource. this resource will be added in db with the existing resources.
  mockServer.app.use(post);

  mockServer.db
  {
    "/user":{_config: true, mock: { id: 1, name:"foo" } }
    "/post":{_config: true, mock: { id: 1, name:"bar" } }
  }
  ```

- updated `config.staticDir` - It uses `./public` directory as the default static host directory. Set it to empty string to avoid hosting static dir.

## v7.3.0

- renamed `mode` to `dbMode` in config.
- added `multi` dbMode in config.

  dbMode :

  - `multi` - Only direct sting value sets to `fetch` attribute. All other direct values will be set to - `mock` attribute.
  - `fetch` - All other direct values will be set to `fetch` attribute.
  - `mock` - All other direct values will be set to `mock` attribute.

- Fetch not showing any error on a invalid file path - `Fixed`

## v7.2.1

- rewriters not working - `Fixed`

## v7.2.0

- added `mockServer.port` - Gives the current running port. This will be `undefined` if server is stopped.
- added `mockServer.address` - Gives the current running server ip address. This will be `undefined` if server is stopped.
- Set Port to `0`(zero) to pick a dynamic available port
- Now we can do default import
  Example of imports :

  ```js
  const { MockServer } = require("@r35007/mock-server");
  const MockServer = require("@r35007/mock-server").default;

  import MockServer from "@r35007/mock-server";
  import { MockServer } from "@r35007/mock-server";
  ```

## v7.1.0

- added `cookieParser` in config and defaults. Enables the cookie parser.
  Click [here](https://www.npmjs.com/package/cookie-parser) for more details

## v7.0.1

- `toBase64` - method throws error on invalid route - `Fixed`

## v7.0.0

- added `ignoreMiddleWrappers` in routeConfig. If a direct method is set to route, then it wont be wrapped by helper middlewares and so no other route config would work except the given middleware if provided.
- added `mockServer.listeningTo` - give the homepage path only if the server is running.
- updated sample `db.json` to `db.js`

## v6.1.0

- Implemented `mode` in config. This helps to define on what attribute does the direct route value to be set.
  For Example:

  - If mode is `mock` by default

    ```js
    const db = {
      route1: "My Response",
      route2: { _config: true, fetch: "./path/to/fetch/data" },
    };

    // The above db will be transformed to
    const validDb = getValidDb(db, "./", { mode: "mock" });
    console.log(validDb);
    /* 
    { 
      "/route1":{ _config: true, mock: "My Response" },
      "/route2":{ _config: true, fetch: "./path/to/fetch/data" } ,
    }
    */
    ```

  - If mode is `fetch`

    ```js
    // Note: If the mode is `fetch` then the direct route value will be set to fetch attribute in the routeConfig

    const db = {
      route1: "./path/to/fetch/data",
      route2: { _config: true, mock: "My Response" },
    };

    // The above db will be transformed to
    const validDb = getValidDb(db, "./", { mode: "fetch" });
    console.log(validDb);
    /* 
    { 
      "/route1":{ _config: true, fetch: "./path/to/fetch/data" } ,
      "/route2":{ _config: true, mock: "My Response" },
    }
    */
    ```

- Now we can give middleware directly to the route.
  For Example:

  ```js
  const db = {
    route1: (req, res) => {
      res.send("My Response");
    },
  };

  // The above db will be transformed to
  const validDb = getValidDb(db);
  console.log(validDb);
  /*
  {
    "/route1":{
      _config: true,
      middlewares: [(req, res) => { res.send("My Response") }]
    }
  }
  */
  ```

## v6.0.5

- Renamed `addDbData` to `addDb`
- Home page ui improvements

## v6.0.4

- Implemented Dark and Light mode in Homepage.
- Added page loader in Homepage.
- Performance improvement.
- Added editing `Fetch Data Response` in homepage.
- removed resetting store

## v6.0.3

- Performance improvement.
- Homepage ui improvements.
- Removed editing `Fetch Data Response` in homepage.

## v6.0.2

- Now `getValidDb` can't transform HAR to db instead we need to use `extractDbFromHAR` method explicitly fom utils.
- Added `extractDbFromKibana` method in utils which helps to extract db from Kibana response.

## v6.0.1

- Bug fix in `cleanDb` method.

## v6.0.0

- Bug Fixes
- Added `_Fetch`, `_FetchUrl`, `_FetchFile` middlewares.
- Now injectors comes as a second pram in both `launchServer` and `resource` since `db` is dependant on `injectors`.
- In `setDb` method we cannot pass the `injectors` and `reverse` option to set the db. both `injectors` and `reverse` are used from internal values. So please make sure you use `setInjectors` first before setting the db.
- All the `validators` are moved in to utils. Now instead of `mockServer.getValidDb` please import validator methods from `@r35007/mock-server/dist/server/utils/validators`
- `getValidDb` params has been changed to the following

```ts
const getValidDb: (
  data?: ParamTypes.Db | undefined,
  injectors?: UserTypes.Injectors,
  rootPath?: string,
  { reverse, _harEntryCallback, _harDbCallback }?: GetValidDbOptions
) => ValidTypes.Db;
```

- Introduced more types. Example

```ts
// Types that you get in mockServer.data or from validator methods
import * as ValidTypes from "@r35007/mock-server/dist/server/types/valid.types";
// Types that you can give to the methods and apis
import * as UserTypes from "@r35007/mock-server/dist/server/types/user.types";
// Other Common Types
import * as CommonTypes from "@r35007/mock-server/dist/server/types/common.types";
// Types that you can give to give to the methods and apis. mostly combination of string and UserTypes
import * as ParamTypes from "@r35007/mock-server/dist/server/types/param.types";

// Example
const config: UserTypes.Config = { port: 4000 };
const validConfig: ValidTypes.Config = getValidConfig(config); // gives you a valid config type
```

- `middlewareNames` is removed. Now we can give both middleware method and middleware reference name in `middlewares`. Example
  `db.json`

```js
const db = {
  user: {
    _config: true,
    mock: [1,2,3,4,5]
    middlewares: [
      (req, res, next) => {
        console.log(req.path);
        next()
      },
      "_IterateResponse"
    ]
  }
}
```

## v5.0.1

- Readme update

## v5.0.0

- Added more Test cases ans stabilized this version with more minor bug fixes
- `UserConfig`, `UserMiddleware`, `UserDb`, `UserInjectors`, `UserStore`, `UserRewriters` types are removed
  - Instead we can use `Partial<Config>`, `Db`, `Middlewares`, `Injectors`, `Store`, `Rewriters`
- Now we can also provide a `.js` path to any of the data for `db`, `injectors`, `config`, `rewriters`, `store`, `middlewares`
- Now we can get the response time from a response headers of `x-response-time` in milliseconds
- The middlewares that are need to be used as a global middleware before start of all middlewares can be given as `_globals : [...your middlewares]` in `middleware.js` file
- Now injectors accepts only list as follows

```json
[
  {
    "routes": ["/injectors/1", "/injectors/2"],
    "override": true,
    "mock": "This data is injected using the injectors by matching the pattern '/injectors/1', '/injectors/1'."
  },
  {
    "routes": ["/(.*)"],
    "override": true,
    "middlewareNames": ["...", "CustomLog"]
  }
]
```

## v4.5.1

- Now we can access `config` and `req` variable on a fetch url.
  Example :
  ```jsonc
  {
    "/posts/:id?": {
      "_config": true,
      "fetch": "http://jsonplaceholder.typicode.com${req.url}" // will become http://jsonplaceholder.typicode.com/posts/1
    },
    "/comments/:id?": {
      "_config": true,
      "fetch": "http://jsonplaceholder.typicode.com/comments/${req.params.id}" // will become http://jsonplaceholder.typicode.com/comments/:id
    },
    "/pageNotFound": {
      "_config": true,
      "fetch": "http://${config.host}:${config.port}/404"
    }
  }
  ```
  - Inject any global middleware at the start of the express app by exporting `globals` in the `middleware.js` file.
    Example :
    ```js
    /* 
      Global Middlewares
      These middlewares will be added to start of the the express app 
    */
    exports.globals = [
      (req, res, next) => {
        console.log(req.path);
      },
    ];
    ```

## v4.4.2

- `getJSON` can now able to fetch mock data from `.js` file. Make sure you do `module.exports` the mock object

## v4.4.0

- `mockFirst` is added to RouteConfig
- Home Page update Bug Fixed.

## v4.3.1

- Enabled resource url edit in Home Page.
- removed `fetchError` attribute in routeConfig.
- `_CrudOperation` bug fixed.
- If any fetch error the `isError` flag is set to true in `fetchData`.
- Sample Files are updated with more examples.

## v4.3.0

- Rewriters list, ui issue in Home page resolved.
- Set `exact` flag to true in injectors to exactly match the route.
- Sample files are updated with new data.
- Attribute `middlewares` is renamed to `middlewareNames`.
- Storing Fetch data bug fixed.
- Now we can get image from image url as an img tag.
- Now injectors can be given in both the ways as shown below.

way 1:

```jsonc
{
  "/(.*)": {
    "fetchCount": 2
  },
  // Again we cannot give the same route match over here by this structure.
  "/(.*)": {
    "override": true,
    "statusCode": 200
  }
}
```

way 2:

```jsonc
[
  {
    "routeToMatch": "/(.*)",
    "fetchCount": 2
  },
  {
    "routeToMatch": "/(.*)",
    "override": true,
    "statusCode": 200
  }
]
```

## v4.2.0

- added `server.js` in samples
- removed `id` attribute in db snapshot.

## v4.1.2

- added `isSnapshot` options in `getValidDb` method.
- Bug Fix

## v4.1.0

- Injectors not applied properly- Bug Fixed.
- added `Create` method which returns the single instance of the MockServer.
- added `Destroy` method which stops the server and clears the instance of the MockServer.

## v4.0.0

- Improved CLI.
- --snapshot flag in CLI will create a snapshot of db in a .json file
- --watch will automatically restarts the db on changes.
- --sample - creates a sample db.json, middleware.json, injectors.json, rewrites.json files
- Code refactoring
- Set `_config` to true to set any route config like delay, statusCode etc...

## v3.0.9

- Home Page Bug Fix
- Implemented Home Page Screen inside the VS Code

## v3.0.8

- Bug Fix
- Ui update in Home Page
- Implemented Route Config Clone in Home page

## v3.0.7

- Bug Fix
- Readme Update

## v3.0.0

- `generateMockFromHAR` - removed. instead use `getValidRoutes` method
- specific method handler is removed in routeConfigs
- implemented defaults methods with some options like compression, readOnly, staticDir etc..
- Bug Fix
- Code refactoring and organized
- Middleware Utils are added and renamed
- Added Url rewrites
- Advanced Search operation is added in CRUD Operation middleware
- Sample Routes Data is updated
- many options are added to CLI
- Now can able to modify routeConfig and add new routes using the new Home Page.

## v2.4.2

- drag handle has been provided in homepage to resize the routes view an data view.

## v2.4.1

- Now has ability to render image and other files as a response in homepage
- Download option is given near the redirect link in homepage.
- renamed `transformHar` to `generateMockFromHAR`
- Ui improvements
- `finalCallback` in `generateMockFromHAR` now has the harData as the first param

```ts
  type generateMockFromHAR = (
    harData?: HAR | string,
    config?: TransformHARConfig,
    entryCallback?: (
      entry: object,
      routePath: string,
      routeConfig: RouteConfig,
      pathToRegexp: pathToRegexp
    ) => Routes,
    finalCallback?: (
      harData: any
      generatedMock: Routes,
      pathToRegexp: pathToRegexp
    ) => any
  ) => Routes;
```

- The `finalCallback` will always be called even if it went to catch block if anything went wrong.
- CLI default routes is changed from `https://jsonplaceholder.typicode.com/db` to `http://jsonplaceholder.typicode.com/db`

## v2.3.1

- `transformHar` bug fix

## v2.3.0

- Bug Fix
- added CLI Usage with options.
- `excludeRoutes(routes, routesToExclude)` - returns routes with unExcluded routes.
- `transformHar` now has `excludedRoutes` in a config.
  This helps to excluded routes while generating mock from HAR.

```ts
  type transformHar = (
    harData?: HAR | string,
    config?: TransformHARConfig,
    ...
  ) => Routes;

  export type TransformHARConfig = {
    routesToLoop?: string[];
    routesToGroup?: string[];
    routeRewrite?: KeyValString;
    excludeRoutes?: string[];
  }

```

## v2.2.2

- Readme update

## v2.2.0

- added
  - `methods` in routeConfig. Now we can set a route to a specific methods.
  - `mockServer.getRewrittenRoutes(routes, routeRewrite)` - returns routes with rewritten route path.
  - `mockServer.getRouteMatchList(routeToMatch, routes)` - returns list of matched routes to the given pattern
  - `transformHar` method with additional options. `pathToRegexp` - gives the methods available in `path-to-regexp` npm package
  ```ts
  type transformHar = (
    harData?: HAR | string,
    config?: {
      routesToLoop?: string[];
      routesToGroup?: string[];
      routeRewrite?: KeyValString;
    },
    entryCallback?: (
      entry: object,
      routePath: string,
      routeConfig: RouteConfig,
      pathToRegexp: pathToRegexp
    ) => Routes,
    finalCallback?: (
      generatedMock: Routes,
      pathToRegexp: pathToRegexp
    ) => Routes
  ) => Routes;
  ```

## v2.1.1

- Bug Fix

## v2.1.0

- removed
  - `res.locals.store.get`
  - `res.locals.store.set`
  - `res.locals.store.clear`
  - `res.locals.store.remove`
- added
  - `res.locals.store` - now you can directly assign values to store.
  - Dynamic routConfig - Now the routeConfigs are mutable - means you can change the routeConfig inside a middleware using `res.locals.routeConfig`
  - `fetchOnce` - predefined middleware. Helps to get fetchData only once and returns the existing fetchData for every other api hit.

## v2.0.7,v2.0.8,v2.0.9,v2.0.10

- Bug Fix.
- Now we can also send empty string as a response.

## v2.0.6

- added `res.locals.store.remove("")` && `res.locals.store.clear()`
- Bug fix.

## v2.0.3,v2.0.4,v2.0.5

- Bug fix.

## v2.0.1,v2.0.2

- Readme Update.

## v2.0.0

_Welcome to v2.0. There are many major changes and bug fix has been done. Please follow the list below_

- `renamed`
  - `config.proxy` to `config.pathRewrite`
  - middleware params is reset to express middleware params. ex :` log = (req, res, next) => {next()}`;
- `removed`
  - `initialMock`, `alternateMock` are removed and introduced `fetch`
  - `globals`, `data`, `locals` params are removed in middleware method.
- `added`
  - `fetch` in routeConfig. Helps to fetch data from Url.
  - `mockFirst` in routeConfig. If true, it send you the mock data first. If mock not available then try to fetch the data from `fetch` url. By default its `false`.
  - `res.locals.store.get(key?)` and `res.locals.store.store(key, value)` - Helps to store the and share the values between routes inside a middleware.
  - transformHar method now accepts config of `{ routesToLoop?: string[], routesToGroup?: string[] } ` as a second param. It helps to set loop and group mock as per the routes provided.

## v1.0.3

- bug fix

## v1.0.2

- added `statusCode` to `entryCallBack` in transformHar

## v1.0.1

- `transformHar` Bug fix.
- added `finalCallBack` to `transformHar(harData, entryCallBack, finalCallBack)`

## v1.0.0

- initial release
