const { dev } = require("../../../setup");
const { handleError } = require("../../Utilities/error-handler");
const { authenticate } = require("../Auth");
const { checkRequiredParams } = require("../../Utilities");
const ItemService = require("../../Services/Items");
const UsersService = require("../../Services/Users");

// create an item
dev.post("/api/items/create", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["name", "price", "image", "quantity"], req.body);

    const item = await ItemService.createItem(
      req.body.name,
      req.body.price,
      req.body.image,
      req.body.shoppingList ?? false,
      req.body.id ?? null,
    );

    const userId = req.headers["uuid"];
    await UsersService.addItemToUser(userId, item.itemId, req.body.quantity, req.body.expirationDate);

    return res
      .status(200)
      .send({ status: "Success", msg: "Item Saved", item: item });
  } catch (error) {
    handleError(res, error, `Failed to create item: ${req.body}`);
  }
});

// get a single item
dev.get("/api/items/get/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);

    const itemId = req.params.id.replace(/^0+/, "");
    let item = await ItemService.getItem(itemId);

    const userId = req.headers["uuid"];
    const userItem = await UsersService.getItemByUserId(userId, itemId);

    item = {
      ...item, quantity: userItem.quantity, expirationDate: userItem.expirationDate,
    };

    return res.status(200).send({ status: "Success", data: item });
  } catch (error) {
    handleError(res, error, `Failed to get item: ${req.params.id}`);
  }
});

// find a single item in db or online
dev.get("/api/items/find/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);

    const id = req.params.id.replace(/^0+/, "");
    let item = await ItemService.findItem(id);

    const userId = req.headers["uuid"];
    const userItem = await UsersService.getItemByUserId(userId, id, false);

    item = {
      ...item, quantity: userItem.quantity ?? 0, expirationDate: userItem.expirationDate ?? null,
    };

    return res.status(200).send({ status: "Success", data: item });
  } catch (error) {
    handleError(res, error, `Failed to find item: ${req.params.id}`);
  }
});

// get all items
dev.get("/api/items/getAll", authenticate, async (req, res) => {
  try {
    const result = await ItemService.getAllItems();

    const userId = req.headers["uuid"];
    const userItems = await UsersService.getItemsByUserId(userId);

    const itemsWithUserData = result.items.map((item) => {
      const userItem = userItems.items.find((userItem) => userItem.itemId === item.id);
      return {
        ...item,
        quantity: userItem ? userItem.quantity : 0,
        expirationDate: userItem ? userItem.expirationDate : null,
      };
    });

    return res.status(200).send({
      status: "Success",
      data: itemsWithUserData,
    });
  } catch (error) {
    handleError(res, error, `Failed to get all items`);
  }
});

// get batch of items
dev.post("/api/items/getBatch", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["items"], req.body);

    const items = await ItemService.getBatchOfItems(req.body.items);

    return res.status(200).send({
      status: "Success",
      data: items,
    });
  } catch (error) {
    handleError(res, error, `Failed to get batch of items`);
  }
});

// update items
dev.put("/api/items/update/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    checkRequiredParams(["name", "price", "image"], req.body);

    const updated = await ItemService.updateItem(
      req.params.id,
      req.body.name,
      req.body.price,
      req.body.image,
      req.body.shoppingList,
    );

    return updated ?
      res.status(200).send({ status: "Success", msg: "Item Updated" }) :
      res
        .status(400)
        .send({ status: "Failed", msg: "Item failed to update" });
  } catch (error) {
    handleError(res, error, `Failed to update item: ${req.params.id}`);
  }
});

// delete item
dev.delete("/api/items/delete/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);

    const deleted = await ItemService.deleteItem(req.params.id);

    return deleted ?
      res.status(200).send({ status: "Success", msg: "Item Deleted" }) :
      res
        .status(400)
        .send({ status: "Failed", msg: "Item failed to delete" });
  } catch (error) {
    handleError(res, error, `Failed to delete item: ${req.params.id}`);
  }
});

dev.post(
  "/api/items/searchBarcode/:barcode",
  authenticate,
  async (req, res) => {
    try {
      checkRequiredParams(["barcode"], req.params);

      const barcode = Number(req.params.barcode);
      const items = await ItemService.searchBarcode(barcode);

      return res.status(200).send({ status: "Success", data: items });
    } catch (error) {
      handleError(
        res,
        error,
        `Failed to search for item: ${req.params.barcode}`,
      );
    }
  },
);

module.exports = { dev };
