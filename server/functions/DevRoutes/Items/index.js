const { dev, logger, db } = require("../../setup");
const { authenticate } = require("../Auth");
const { checkRequiredParams } = require("../Utilities");

const baseDB = "items_dev";

// create an item
dev.post("/api/items/create", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["name"], req.body);

    const itemRef = await db.collection(baseDB).add({
      name: req.body.name,
    });

    const doc = await itemRef.get();

    return res
      .status(200)
      .send({ status: "Success", msg: "Item Saved", itemId: doc.id });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ status: "Failed", msg: error });
  }
});

// get a single item using specific id
dev.get("/api/items/get/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const id = req.params.id;
    const itemRef = db.collection(baseDB).doc(id);
    const doc = await itemRef.get(); // gets doc
    const data = doc.data(); // the actual data of the item

    if (!data) {
      throw new Error(`No item found with id: ${id}`);
    }

    const item = {
      id: doc.id,
      ...data,
    };
    return res.status(200).send({ status: "Success", data: item });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ status: "Failed", msg: error });
  }
});

dev.get("/api/items/getAll", authenticate, async (req, res) => {
  try {
    const itemsRef = db.collection(baseDB);
    const snapshot = await itemsRef.get();

    if (snapshot.empty) {
      throw new Error("No items found");
    }

    const items = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Send the items as a response
    return res.status(200).send({
      status: "Success",
      data: items,
    });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ status: "Failed", msg: error.message });
  }
});

// update items
dev.put("/api/items/update/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    checkRequiredParams(["name"], req.body);

    const reqDoc = db.collection(baseDB).doc(req.params.id);
    await reqDoc.update({
      name: req.body.name,
    });

    return res
      .status(200)
      .send({ status: "Success", msg: "Item Updated" });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ status: "Failed", msg: error });
  }
});

// delete item
dev.delete("/api/items/delete/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);

    const reqDoc = db.collection(baseDB).doc(req.params.id);
    const doc = await reqDoc.get();

    if (!doc.exists) {
      throw new Error("Item not found");
    }

    await reqDoc.delete();

    return res
      .status(200)
      .send({ status: "Success", msg: "Item Deleted" });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ status: "Failed", msg: error });
  }
});

module.exports = { dev };
