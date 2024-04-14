const checkRequiredParams = (requiredParams, params) => {
  for (const param of requiredParams) {
    if (!params[param]) {
      throw new Error(`Missing parameter: ${param}`);
    }
  }
};

module.exports = { checkRequiredParams };
