/**
 * @class Container
 * @description Container object
 */
class Container {
  /**
   * Creates a Container instance.
   * @param {string} id - ID of the container
   * @param {string} name - Friendly name for the container
   * @param {string} userId - The user that owns the container
   */
  constructor(id, name, userId) {
    this.id = id;
    this.name = name;
    this.userId = userId;
  }
}

module.exports = Container;
