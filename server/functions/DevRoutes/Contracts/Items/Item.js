/**
 * @class Item
 * @description Item object
 */
class Item {
  /**
   * Creates a Item instance.
   * @param {string} id - ID of the Item
   * @param {string} name - Friendly name for the Item
   * @param {string} price - The price of the Item
   * @param {string} image - The image of the Item in base64
   */
  constructor(id, name, price, image) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.image = image;
  }
}

module.exports = Item;
