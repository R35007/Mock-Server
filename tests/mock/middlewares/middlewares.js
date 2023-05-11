module.exports = {
  logger: (req, res, next) => {
    next();
  },
  auth: [
    (req, res, next) => {
      next();
    },
    (req, res, next) => {
      next();
    },
  ],
  globals: [
    (req, res, next) => {
      next();
    },
    {},
    'XXX',
  ],
  dummy: {},
};
