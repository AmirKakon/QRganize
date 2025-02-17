const { dev, db } = require("../../setup");
const { NotFoundError, handleErrors } = require("../Utilities/error-types");
const { authenticate } = require("../Auth");
const { checkRequiredParams, searchBarcode } = require("../Utilities");

const baseDB = "items_dev";

// create an item
dev.post("/api/items/create", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["name", "image"], req.body);

    let itemRef = null;

    if (req.body.id) {
      await db
        .collection(baseDB)
        .doc(String(req.body.id))
        .set({
          name: req.body.name,
          image: req.body.image,
          amount: req.body.quantity ?? 1,
        });
      itemRef = db.collection(baseDB).doc(String(req.body.id));
    } else {
      itemRef = await db.collection(baseDB).add({
        name: req.body.name,
        image: req.body.image,
        amount: req.body.quantity ?? 1,
      });
    }

    const doc = await itemRef.get();

    return res
      .status(200)
      .send({ status: "Success", msg: "Item Saved", itemId: doc.id });
  } catch (error) {
    handleErrors(res, error, `Failed to create item: ${req.body}`);
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
      throw new NotFoundError(`No item found with id: ${id}`);
    }

    const item = {
      id: doc.id,
      ...data,
    };
    return res.status(200).send({ status: "Success", data: item });
  } catch (error) {
    handleErrors(res, error, `Failed to get item: ${req.params.id}`);
  }
});

dev.get("/api/items/getAll", authenticate, async (req, res) => {
  try {
    const itemsRef = db.collection(baseDB);
    const snapshot = await itemsRef.get();

    if (snapshot.empty) {
      return res.status(200).send({ status: "Success", data: [] });
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
    handleErrors(res, error, `Failed to get all items`);
  }
});

// get batch of items
dev.post("/api/items/getBatch", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["items"], req.body);
    const itemsList = req.body.items;
    const itemsRef = db.collection(baseDB);
    const snapshot = await itemsRef.get();

    if (snapshot.empty) {
      return res.status(200).send({ status: "Success", data: [] });
    }

    const items = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((item) => itemsList.includes(item.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Send the items as a response
    return res.status(200).send({
      status: "Success",
      data: items,
    });
  } catch (error) {
    handleErrors(res, error, `Failed to get batch of items`);
  }
});

// update items
dev.put("/api/items/update/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    checkRequiredParams(["name", "image", "quantity"], req.body);

    const reqDoc = db.collection(baseDB).doc(req.params.id);
    await reqDoc.update({
      name: req.body.name,
      image: req.body.image,
    });

    return res.status(200).send({ status: "Success", msg: "Item Updated" });
  } catch (error) {
    handleErrors(res, error, `Failed to update item: ${req.params.id}`);
  }
});

// update quantity of item
dev.put("/api/items/quantity/update/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    checkRequiredParams(["quantity"], req.body);

    const id = req.params.id;
    const itemRef = db.collection(baseDB).doc(id);
    const doc = await itemRef.get(); // gets doc
    const data = doc.data(); // the actual data of the item

    if (!data) {
      throw new NotFoundError(`No item found with id: ${id}`);
    }

    const reqDoc = db.collection(baseDB).doc(req.params.id);
    await reqDoc.update({
      quantity: req.body.quantity,
    });

    return res
      .status(200)
      .send({ status: "Success", msg: "Item Quantity Updated" });
  } catch (error) {
    handleErrors(
      res,
      error,
      `Failed to update item quantity: ${req.params.id}`
    );
  }
});

// delete item
dev.delete("/api/items/delete/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);

    const reqDoc = db.collection(baseDB).doc(req.params.id);
    const doc = await reqDoc.get();

    if (!doc.exists) {
      throw new NotFoundError(`Item ${req.params.id} not found`);
    }

    await reqDoc.delete();

    return res.status(200).send({ status: "Success", msg: "Item Deleted" });
  } catch (error) {
    handleErrors(res, error, `Failed to delete item: ${req.params.id}`);
  }
});

dev.post(
  "/api/items/searchBarcode/:barcode",
  authenticate,
  async (req, res) => {
    try {
      checkRequiredParams(["barcode"], req.params);
      const barcode = Number(req.params.barcode);
      const results = await searchBarcode(barcode);

      if (!results || results.length === 0) {
        return res.status(200).send({ status: "Success", data: [] });
      }

      const items = results.map((item) => {
        return {
          id: barcode,
          name: item.title,
          image: item.src,
        };
      });

      return res.status(200).send({ status: "Success", data: items });
    } catch (error) {
      handleErrors(
        res,
        error,
        `Failed to search for item: ${req.params.barcode}`
      );
    }
  }
);

module.exports = { dev };
