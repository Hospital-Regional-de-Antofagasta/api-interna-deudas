const secret = process.env.HRADB_A_MONGODB_SECRET;

const isAuthenticated = (req, res, next) => {
  const token = req.headers.authorization;
  if (token !== secret) {
    return res.status(401).send({ error: "Acceso no autorizado." });
  }
  next();
};

module.exports = { isAuthenticated };
