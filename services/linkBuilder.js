const keys = require("../config/keys");

const buildResetLink = (tok) => {
  const url = keys.clientUrl;
  return `${url}/auth/reset/${tok}`;
};

module.exports = {
  buildResetLink,
};
