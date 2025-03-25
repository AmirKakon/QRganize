const { db, logger } = require("../../../setup");
const { NotFoundError } = require("../../Contracts/Errors");
const Utilities = require("../Utilities");

const itemsDB = "items";

// Create an item
const createItem = async (name, price, image, id = null) => {
  let itemRef = null;

  if (id) {
    await db
      .collection(itemsDB)
      .doc(String(id))
      .set({
        name: name,
        price: price,
        image: image,
      });
    itemRef = db.collection(itemsDB).doc(String(id));
  } else {
    itemRef = await db.collection(itemsDB).add({
      name: name,
      price: price,
      image: image,
    });
  }

  return {
    itemId: itemRef.id,
  };
};

// Get a single item
const getItem = async (id) => {
  const doc = await db.collection(itemsDB).doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError(`No item found with id: ${id}`);
  }

  return { id: doc.id, ...doc.data() };
};

// find an item in db or online
const findItem = async (id) => {
  const doc = await db.collection(itemsDB).doc(id).get();

  if (!doc.exists) {
    const barcodeResponse = await searchBarcode(id);

    if (barcodeResponse.data.length > 0) {
      return barcodeResponse.data[0];
    }

    throw new NotFoundError(`No item found with id: ${id}`);
  }

  return { id: doc.id, ...doc.data() };
};

// Get all items
const getAllItems = async () => {
  const snapshot = await db.collection(itemsDB).get();

  if (snapshot.empty) {
    logger.info("Get all items | No items found");
    return { items: [] };
  }

  return {
    items: snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
};

// Get batch of items
const getBatchOfItems = async (itemsList) => {
  const itemsRef = db.collection(itemsDB);
  const snapshot = await itemsRef.get();

  if (snapshot.empty) {
    return { data: [] };
  }

  const items = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((item) => itemsList.includes(item.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    data: items,
  };
};

// Update an item
const updateItem = async (id, name, price, image) => {
  try {
    await db.collection(itemsDB).doc(id).update({
      name: name,
      price: price,
      image: image,
    });
    return true;
  } catch (error) {
    logger.error(`Failed to update item: ${id}`, error);
    return false;
  }
};

// Delete an item
const deleteItem = async (id) => {
  try {
    const batch = db.batch();

    const docRef = db.collection(itemsDB).doc(id);
    if (!(await docRef.get()).exists) {
      throw new NotFoundError("Item not found");
    }

    batch.delete(docRef);
    await batch.commit();

    return true;
  } catch (error) {
    logger.error(`Failed to delete item: ${id}`, error);
    return false;
  }
};

const searchBarcode = async (barcode) => {
  const results = await Utilities.searchBarcode(barcode);

  if (!results || results.length === 0) {
    return { data: [] };
  }

  const items = results.map((item) => {
    return {
      id: barcode,
      name: item.title,
      image: item.src,
    };
  });

  return { data: items };
};

module.exports = {
  createItem,
  getItem,
  findItem,
  getAllItems,
  getBatchOfItems,
  updateItem,
  deleteItem,
  searchBarcode,
};
