export const _ReadOnly = (req, res, next) => {
  if (req.method === 'GET') {
    next(); // Continue
  } else {
    res.sendStatus(403); // Forbidden
  }
};
