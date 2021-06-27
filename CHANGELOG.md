# v2.2.0

- added
  - `methods` in routeConfig. Now we can set a route to a specific methods.
  - `mockserver.getRewrittenRoutes(routes, routeRewrite)` - returns routes with rewritten route path.
  - `mockserver.getRouteMatchList(routeToMatch, routes)` - returns list of matched routes to the given pattern
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
    finalCallback?: (generatedMock: Routes, pathToRegexp: pathToRegexp) => Routes
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
  - `fetchOnce` - predefined midleware. Helps to get fetchData only once and returns the existing fetchData for every other api hit.

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
