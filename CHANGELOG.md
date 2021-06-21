# v2.0.8

- Bug Fix.
# v2.0.7

- Now we can also send empty string as a response.
# v2.0.6

- added `res.locals.store.remove("")` && `res.locals.store.clear()`
- Bug fix.

# v2.0.5

- Bug fix.

# v2.0.4

- Bug fix.

# v2.0.3

- Bug fix.

# v2.0.2

- Added badges to Readme.

# v2.0.1

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
