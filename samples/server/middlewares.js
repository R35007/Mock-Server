const DataWrapper = (req, res, next) => {
  res.locals.data = {
    status: 'Success',
    message: 'Retrieved Successfully',
    result: res.locals.data,
  };
  next();
};

module.exports = (mockServer) => {
  const { app, routes, data, getDb, getStore } = mockServer || {};
  const { config, db, injectors, middlewares, rewriters, store } = data || {};
  // Your global middleware logic here before setting default middlewares by the MockServer
  // app.use(auth);

  return { DataWrapper };
};
