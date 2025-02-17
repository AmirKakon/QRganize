const { logger } = require("../../setup");

/**
 * @class NotFoundError
 * @extends Error
 * @description Custom error for cases where a requested resource is not found.
 */
class NotFoundError extends Error {
  /**
   * Creates a NotFoundError instance.
   * @param {string} message - Error message describing the missing resource.
   */
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * @class MissingArgumentError
 * @extends Error
 * @description Custom error for cases where a required argument is missing.
 */
class MissingArgumentError extends Error {
  /**
   * Creates a MissingArgumentError instance.
   * @param {string} message - Error message describing the missing argument.
   */
  constructor(message) {
    super(message);
    this.name = "MissingArgumentError";
  }
}

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
 * @return {Response} - sends the response with data
 */
const handleError = (res, error, errorMessage) => {
  logger.error(errorMessage, error);

  return res.status(mapErrorToStatusCode(error)).send({
    status: "Failed",
    msg: errorMsg,
  });
};

module.exports = { NotFoundError, MissingArgumentError, handleError };
