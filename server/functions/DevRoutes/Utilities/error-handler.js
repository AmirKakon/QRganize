const { logger } = require("../../setup");
const { NotFoundError, MissingArgumentError } = require("../Contracts/Errors");

/**
 * Maps a given error to an appropriate HTTP status code.
 *
 * @param {Error} error - The error instance to map.
 * @return {number} The corresponding HTTP status code.
 */
const mapErrorToStatusCode = (error) => {
  switch (true) {
    case error instanceof NotFoundError:
      return 404;
    case error instanceof MissingArgumentError:
      return 400;
    default:
      return 500;
  }
};

/**
 * Handles error to an appropriate HTTP status code.
 *
 * @param {Response} res - the response of the current request
 * @param {Error} error - The error instance to map.
 * @param {string} errorMessage - the error message to add to the logs
 * @return {Response} - sends the response with data
 */
const handleError = (res, error, errorMessage) => {
  logger.error(errorMessage, error);

  return res.status(mapErrorToStatusCode(error)).send({
    status: "Failed",
    msg: errorMessage,
  });
};

module.exports = { handleError };
