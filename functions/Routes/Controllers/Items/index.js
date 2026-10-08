const { app } = require("../../../setup");
const { handleError } = require("../../Utilities/error-handler");
const { authenticate } = require("../Auth");
const { checkRequiredParams } = require("../../Utilities");
const { MissingArgumentError } = require("../../Contracts/Errors");
const ItemService = require("../../Services/Items");
const LotService = require("../../Services/Lots");

// which backend build and Node runtime are serving (to confirm a deploy)
app.get("/api/version", (req, res) =>
  res.status(200).send({
    status: "Success",
    data: { version: require("../../../package.json").version, node: process.version },
  }),
);

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
      Array.isArray(req.body.aliases) ? req.body.aliases : [],
      Array.isArray(req.body.tags) ? req.body.tags : [],
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

// attach a barcode alias to an item (so another package's barcode resolves too)
app.put("/api/items/addBarcode/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    checkRequiredParams(["barcode"], req.body);

    const added = await ItemService.addBarcodeToItem(
      req.params.id,
      req.body.barcode,
    );

    return res
      .status(200)
      .send({ status: "Success", msg: added ? "Barcode added" : "No change" });
  } catch (error) {
    handleError(res, error, `Failed to add barcode to item: ${req.params.id}`);
  }
});

// add alternate names to an item (body: { alias } or { aliases: [...] })
app.put("/api/items/addAlias/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const aliases = Array.isArray(req.body.aliases) ? req.body.aliases : [req.body.alias];
    if (!aliases.some((a) => typeof a === "string" && a.trim())) {
      throw new MissingArgumentError("Missing parameter: alias");
    }

    const added = await ItemService.addAliasesToItem(req.params.id, aliases);

    return res
      .status(200)
      .send({ status: "Success", msg: added.length ? "Names added" : "No change", data: added });
  } catch (error) {
    handleError(res, error, `Failed to add names to item: ${req.params.id}`);
  }
});

// rename an item (only its name changes)
app.put("/api/items/rename/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    if (typeof req.body.name !== "string" || !req.body.name.trim()) {
      throw new MissingArgumentError("Missing parameter: name");
    }

    await ItemService.renameItem(req.params.id, req.body.name);

    return res.status(200).send({ status: "Success", msg: "Item renamed" });
  } catch (error) {
    handleError(res, error, `Failed to rename item: ${req.params.id}`);
  }
});

// replace an item's tags (body: { tags: [...] }; an empty list clears them)
app.put("/api/items/tags/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    if (!Array.isArray(req.body.tags)) {
      throw new MissingArgumentError("Missing parameter: tags (array)");
    }

    const tags = await ItemService.setItemTags(req.params.id, req.body.tags);

    return res.status(200).send({ status: "Success", msg: "Tags saved", data: tags });
  } catch (error) {
    handleError(res, error, `Failed to save tags for item: ${req.params.id}`);
  }
});

// remove an alternate name from an item
app.put("/api/items/removeAlias/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    checkRequiredParams(["alias"], req.body);

    await ItemService.removeAliasFromItem(req.params.id, req.body.alias);

    return res.status(200).send({ status: "Success", msg: "Name removed" });
  } catch (error) {
    handleError(res, error, `Failed to remove name from item: ${req.params.id}`);
  }
});

// remove an extra barcode (alias) from an item
app.put("/api/items/removeBarcode/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    checkRequiredParams(["barcode"], req.body);

    await ItemService.removeBarcodeFromItem(req.params.id, req.body.barcode);

    return res
      .status(200)
      .send({ status: "Success", msg: "Barcode removed" });
  } catch (error) {
    handleError(res, error, `Failed to remove barcode from item: ${req.params.id}`);
  }
});

// use N whole units of an item (FEFO, default 1); item-level so callers
// needn't pick a lot
app.post("/api/items/use/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const result = await ItemService.consume(req.params.id, req.body?.amount);
    return res.status(200).send({ status: "Success", data: result });
  } catch (error) {
    handleError(res, error, `Failed to use item: ${req.params.id}`);
  }
});

// finish an item: clear all its stock but keep the item record
app.post("/api/items/finish/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const result = await ItemService.finish(req.params.id);
    return res.status(200).send({ status: "Success", data: result });
  } catch (error) {
    handleError(res, error, `Failed to finish item: ${req.params.id}`);
  }
});

// set only an item's image (URL, data-URL, or raw base64)
app.put("/api/items/image/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    if (typeof req.body.image !== "string") {
      throw new MissingArgumentError("Missing string parameter: image");
    }
    const updated = await ItemService.setImage(req.params.id, req.body.image);
    return updated ?
      res.status(200).send({ status: "Success", msg: "Image updated" }) :
      res.status(400).send({ status: "Failed", msg: "Image failed to update" });
  } catch (error) {
    handleError(res, error, `Failed to update image for item: ${req.params.id}`);
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
