const { app } = require("../../../setup");
const { handleError } = require("../../Utilities/error-handler");
const { authenticate } = require("../Auth");
const { checkRequiredParams } = require("../../Utilities");
const { MissingArgumentError } = require("../../Contracts/Errors");
const ItemService = require("../../Services/Items");
const LotService = require("../../Services/Lots");

// create an item
app.post("/api/items/create", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["name", "price"], req.body);

    const item = await ItemService.createItem(
      req.body.name,
      req.body.price,
      req.body.image ?? null,
      req.body.shoppingList ?? false,
      req.body.id ?? null,
    );

    return res
      .status(200)
      .send({ status: "Success", msg: "Item Saved", item: item });
  } catch (error) {
    handleError(res, error, `Failed to create item: ${req.body}`);
  }
});

// merge one item into another (consolidate duplicates)
app.post("/api/items/merge", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["sourceId", "targetId"], req.body);

    const result = await ItemService.mergeItems(
      req.body.sourceId,
      req.body.targetId,
    );

    return res
      .status(200)
      .send({ status: "Success", msg: "Items Merged", data: result });
  } catch (error) {
    handleError(res, error, `Failed to merge items: ${req.body}`);
  }
});

// get a single item
app.get("/api/items/get/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);

    const itemId = req.params.id.replace(/^0+/, "");
    const item = await ItemService.getItem(itemId);

    return res.status(200).send({ status: "Success", data: item });
  } catch (error) {
    handleError(res, error, `Failed to get item: ${req.params.id}`);
  }
});

// find a single item in db or online
app.get("/api/items/find/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);

    const id = req.params.id.replace(/^0+/, "");
    const item = await ItemService.findItem(id);

    return res.status(200).send({ status: "Success", data: item });
  } catch (error) {
    handleError(res, error, `Failed to find item: ${req.params.id}`);
  }
});

// get all items
app.get("/api/items/getAll", authenticate, async (req, res) => {
  try {
    const result = await ItemService.getAllItems();

    // Quantity and expiries are derived purely from lots (batches).
    const allLots = await LotService.getAllLots();
    const lotsByItem = {};
    for (const lot of allLots) {
      (lotsByItem[lot.itemId] = lotsByItem[lot.itemId] || []).push(lot);
    }

    const itemsWithUserData = result.items.map((item) => {
      const lots = lotsByItem[item.id] || [];
      const quantity = lots.reduce((sum, lot) => sum + (lot.quantity || 0), 0);
      const lotDates = lots
        .map((lot) => lot.expirationDate)
        .filter(Boolean)
        .sort();

      return {
        ...item,
        quantity,
        expirationDate: lotDates[0] || null,
        lots,
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
app.post("/api/items/getBatch", authenticate, async (req, res) => {
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
app.put("/api/items/update/:id", authenticate, async (req, res) => {
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

// toggle/set an item's shopping-list flag (id only, no other fields needed)
app.put("/api/items/shoppingList/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);

    if (typeof req.body.shoppingList !== "boolean") {
      throw new MissingArgumentError("Missing boolean parameter: shoppingList");
    }

    const updated = await ItemService.setShoppingList(
      req.params.id,
      req.body.shoppingList,
    );

    return updated ?
      res.status(200).send({ status: "Success", msg: "Shopping list updated" }) :
      res
        .status(400)
        .send({ status: "Failed", msg: "Failed to update shopping list" });
  } catch (error) {
    return handleError(
      res,
      error,
      `Failed to update shopping list for item: ${req.params.id}`,
    );
  }
});

// delete item
app.delete("/api/items/delete/:id", authenticate, async (req, res) => {
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

app.post(
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

module.exports = { app };
