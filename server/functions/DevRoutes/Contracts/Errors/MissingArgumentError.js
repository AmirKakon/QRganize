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

module.exports = MissingArgumentError;