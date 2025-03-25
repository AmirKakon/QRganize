const { MissingArgumentError } = require("./error-handler");

const checkRequiredParams = (requiredParams, params) => {
  for (const param of requiredParams) {
    if (!params[param]) {
      throw new MissingArgumentError(`Missing parameter: ${param}`);
    }
  }
};

module.exports = { checkRequiredParams };
