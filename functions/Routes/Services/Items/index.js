const { FieldValue } = require("firebase-admin/firestore");
const { db, logger } = require("../../../setup");
const { NotFoundError, MissingArgumentError } = require("../../Contracts/Errors");
const Utilities = require("../Utilities");
const LotService = require("../Lots");

const itemsDB = "items";

// Digits only, no leading zeros — the canonical form we store/compare barcodes
// in. A code shorter than 8 digits (e.g. a store PLU) is not a reliable key.
const normBarcode = (value) => String(value || "").replace(/\D/g, "").replace(/^0+/, "");
const isRealBarcode = (value) => normBarcode(value).length >= 8;

// Resolve a barcode to an item: first by document id (items are keyed by their
// primary barcode), then by the `barcodes` alias array (extra barcodes picked
// up when duplicates were merged). Returns null if nothing matches.
const getItemByBarcode = async (code) => {
  const doc = await db.collection(itemsDB).doc(String(code)).get();
  if (doc.exists) {
    return { id: doc.id, ...doc.data() };
  }
  const norm = normBarcode(code);
  if (norm) {
    const snapshot = await db
      .collection(itemsDB)
      .where("barcodes", "array-contains", norm)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      const match = snapshot.docs[0];
      return { id: match.id, ...match.data() };
    }
  }
  return null;
};

// Add a barcode alias to an item so a different package's barcode still
// resolves to it. Idempotent (array union). Ignores non-barcode codes.
const addBarcodeToItem = async (id, barcode) => {
  const norm = normBarcode(barcode);
  if (!isRealBarcode(barcode) || normBarcode(id) === norm) {
    return false; // nothing useful to add (its own id or a short PLU)
  }
  const ref = db.collection(itemsDB).doc(String(id));
  if (!(await ref.get()).exists) {
    throw new NotFoundError(`No item found with id: ${id}`);
  }
  await ref.update({ barcodes: FieldValue.arrayUnion(norm) });
  return true;
};

// Create an item
const createItem = async (name, price, image, shoppingList, id = null) => {
  let itemRef = null;

  if (id) {
    await db
      .collection(itemsDB)
      .doc(String(id))
      .set({
        name: name,
        price: price,
        image: image,
        shoppingList: shoppingList,

      });
    itemRef = db.collection(itemsDB).doc(String(id));
  } else {
    itemRef = await db.collection(itemsDB).add({
      name: name,
      price: price,
      image: image,
      shoppingList: shoppingList,
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

// find an item in db (by id or barcode alias) or online
const findItem = async (id) => {
  const item = await getItemByBarcode(id);
  if (item) {
    return item;
  }

  const barcodeResponse = await searchBarcode(id);
  if (barcodeResponse.data.length > 0) {
    return barcodeResponse.data[0];
  }

  throw new NotFoundError(`No item found with id: ${id}`);
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
const updateItem = async (id, name, price, image, shoppingList) => {
  try {
    await db.collection(itemsDB).doc(id).update({
      name: name,
      price: price,
      image: image,
      shoppingList: shoppingList,

    });
    return true;
  } catch (error) {
    logger.error(`Failed to update item: ${id}`, error);
    return false;
  }
};

// Set only the shopping-list flag of an item (no other fields required)
const setShoppingList = async (id, shoppingList) => {
  try {
    await db.collection(itemsDB).doc(String(id)).update({ shoppingList });
    return true;
  } catch (error) {
    logger.error(`Failed to update shoppingList for item: ${id}`, error);
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

    // Remove the item's stock batches too.
    await LotService.deleteLotsByItem(id);

    batch.delete(docRef);
    await batch.commit();

    return true;
  } catch (error) {
    logger.error(`Failed to delete item: ${id}`, error);
    return false;
  }
};

// Merge the source item into the target: move every stock batch (lot) onto the
// target (coalescing by container + date), carry over the shopping-list flag,
// then delete the source item. Used to consolidate duplicate items.
const mergeItems = async (sourceId, targetId) => {
  if (!sourceId || !targetId) {
    throw new MissingArgumentError("Both sourceId and targetId are required");
  }
  if (String(sourceId) === String(targetId)) {
    throw new MissingArgumentError("Cannot merge an item into itself");
  }

  // getItem throws NotFoundError if either id is missing.
  const source = await getItem(String(sourceId));
  const target = await getItem(String(targetId));

  const lots = await LotService.getLotsByItem(String(sourceId));
  for (const lot of lots) {
    await LotService.addLot(
      String(targetId),
      lot.containerId ?? null,
      lot.quantity || 0,
      lot.expirationDate ?? null,
    );
  }
  await LotService.deleteLotsByItem(String(sourceId));

  // Collect every barcode both items answer to (their own ids + existing
  // aliases) so scanning any merged package still resolves to the survivor.
  const barcodes = new Set([...(target.barcodes || []), ...(source.barcodes || [])]);
  [source.id, target.id].forEach((docId) => {
    if (isRealBarcode(docId) && /^\d+$/.test(String(docId))) {
      barcodes.add(normBarcode(docId));
    }
  });
  // Drop the target's own id — it already resolves by document id.
  barcodes.delete(normBarcode(target.id));

  const update = { barcodes: [...barcodes] };
  // Keep the target on the shopping list if either item was on it.
  if (source.shoppingList && !target.shoppingList) {
    update.shoppingList = true;
  }
  await db.collection(itemsDB).doc(String(targetId)).update(update);

  await db.collection(itemsDB).doc(String(sourceId)).delete();

  logger.info(`Merged item ${sourceId} into ${targetId} (${lots.length} lots)`);
  return {
    targetId: String(targetId),
    movedLots: lots.length,
    barcodes: update.barcodes,
  };
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
  setShoppingList,
  deleteItem,
  mergeItems,
  addBarcodeToItem,
  searchBarcode,
};
