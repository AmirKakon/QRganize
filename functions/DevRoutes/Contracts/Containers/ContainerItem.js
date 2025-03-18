/**
 * @class ContainerItem
 * @description Item inside a container
 */
class ContainerItem {
  /**
   * Creates a Container instance.
   * @param {string} containerId - ID of the container
   * @param {string} itemId - ID of the item
   * @param {int} quantity - quantity of item in container
   */
  constructor(containerId, itemId, quantity) {
    this.containerId = containerId;
    this.itemId = itemId;
    this.quantity = quantity;
  }
}

module.exports = ContainerItem;
