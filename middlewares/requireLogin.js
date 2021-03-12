const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
require("../config/keys");

module.exports = async (req, res, next) => {
  const bearerHeader = req.headers["authorization"];

  if (bearerHeader !== undefined) {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];

    req.token = bearerToken;

    // Verify token
    await jwt.verify(req.token, keys.jwtSecret, (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(403);
      } else {
        req.user = data.user;

        next();
      }
    });
  } else {
    if (bearerHeader === undefined) {
      res.status(401).send();
    }
    res.status(403);
    res.send();
  }
};
