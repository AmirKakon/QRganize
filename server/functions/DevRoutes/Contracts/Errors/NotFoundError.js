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

module.exports = NotFoundError;