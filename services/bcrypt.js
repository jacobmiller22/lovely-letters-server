const bcrypt = require("bcrypt");

const hashPass = (password, callback) => {
  const saltRounds = 5;
  bcrypt.hash(password, saltRounds, callback);
};

const compHash = (password, hash, callback) => {
  bcrypt.compare(password, hash, callback);
};

module.exports = {
  hashPass,
  compHash,
};
