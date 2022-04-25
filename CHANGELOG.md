# v5.0.1

 - Readme update
# v5.0.0

 - Added more Testcases ans stabalized this version with more minor bug fixes
 - `UserConfig`, `UserMiddleware`, `UserDb`, `UserInjectors`, `UserStore`, `UserRewriters` types are removed
   - Instead we can use `Partial<Config>`, `Db`, `Middlewaers`, `Injectors`, `Store`, `Rewriters`
 - Now we can also provide a `.js` path to any of the data for `db`, `injectors`, `config`, `rewriters`, `store`, `middlewares` 
 - Now we can get the response time from a response headers of `x-response-time` in milliseconds
 - The middlewares that are need to be used as a global middleware before start of all middlewares can be given as `_globals : [...your middlewares]` in `middleware.js` file
 - Now injectors accepts only list as follows
```json
[
  {
    "routes": [
      "/injectors/1", 
      "/injectors/2"
    ],
    "override": true,
    "mock": "This data is injected using the injectors by matching the pattern '/injectors/1', '/injectors/1'."
  },
  {
    "routes": [
      "/(.*)"
    ],
    "override": true,
    "middlewareNames": [
      "...",
      "CustomLog"
    ]
  }
]
``` 
# v4.5.1

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
      "fetch": "http://${config.host}:${config.port}/404",
    }
  }
  ```
  - Inject any global middleware at the start of the express app by exporting `globals` in the `middleware.js` file.
  Example : 
    ```js
    /* 
      Global Middlewares
      These middlewares will be addded to start of the the express app 
    */
    exports.globals = [
      (req, res, next) => {
        console.log(req.path);
      }
    ]
    ```
# v4.4.2

- `getJSON` can now able to fetch mock data from `.js` file. Make sure you do `module.exports` the mock object
# v4.4.0

- `mockFirst` is added to RouteConfig
- Home Page update Bug Fixed.

# v4.3.1

- Enabled resource url edit in Home Page.
- removed `fetchError` attribute in routeConfig.
- `_CrudOperation` bug fixed.
- If any fetch error the `isError` flag is set to true in `fetchData`.
- Sample Files are updated with more examples.

# v4.3.0

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

# v4.2.0

- added `server.js` in samples
- removed `id` attribute in db snapshot.

# v4.1.2

- added `isSnapshot` options in `getValidDb` method.
- Bug Fix

# v4.1.0

- Injectors not applied properly- Bug Fixed.
- added `Create` method which returns the single instance of the MockServer.
- added `Destroy` method which stops the server and clears the instance of the MockServer.

# v4.0.0

- Improved CLI.
- --snapshot flag in CLI will create a snaphost of db in a .json file
- --watch will automatically restarts the db on changes.
- --sample - creates a sample db.json, middleware.json, injectors.json, rewrites.json files
- Code refactoring
- Set `_config` to true to set any route config like delay, statusCode etc...

# v3.0.9

- Home Page Bug Fix
- Implemented Home Page Screen inside the VS Code

# v3.0.8

- Bug Fix
- Ui update in Home Page
- Implemented Route Config Clone in Home page

# v3.0.7

- Bug Fix
- Readme Update

# v3.0.0

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

# v2.4.2

- drag handle has been provided in homepage to resize the routes view an data view.

# v2.4.1

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

# v2.3.1

- `transformHar` bug fix

# v2.3.0

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

# v2.2.2

- Readme update

# v2.2.0

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

# v2.1.1

- Bug Fix

# v2.1.0

- removed
  - `res.locals.store.get`
  - `res.locals.store.set`
  - `res.locals.store.clear`
  - `res.locals.store.remove`
- added
  - `res.locals.store` - now you can directly assign values to store.
  - Dynamic routConfig - Now the routeConfigs are mutable - means you can change the routeConfig inside a middleware using `res.locals.routeConfig`
  - `fetchOnce` - predefined middleware. Helps to get fetchData only once and returns the existing fetchData for every other api hit.

# v2.0.7,v2.0.8,v2.0.9,v2.0.10

- Bug Fix.
- Now we can also send empty string as a response.

# v2.0.6

- added `res.locals.store.remove("")` && `res.locals.store.clear()`
- Bug fix.

# v2.0.3,v2.0.4,v2.0.5

- Bug fix.

# v2.0.1,v2.0.2

- Readme Update.

# v2.0.0

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

# v1.0.3

- bug fix

# v1.0.2

- added `statusCode` to `entryCallBack` in transformHar

# v1.0.1

- `transformHar` Bug fix.
- added `finalCallBack` to `transformHar(harData, entryCallBack, finalCallBack)`

# v1.0.0

- initial release
