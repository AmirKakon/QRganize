const { db, logger } = require("../../../setup");
const { NotFoundError } = require("../../Contracts/Errors");

const lotsDB = "lots";
const containerItemsDB = "containerItems";

// A "lot" is one batch of an item: a quantity, an optional container, and an
// optional expiration date. An item is the sum of its lots. This is the unit
// that lets the same item live in several containers and carry several dates.

const normContainer = (containerId) => containerId ?? null;
const normDate = (expirationDate) => expirationDate ?? null;

// Find an existing lot to merge into: same item, same container, same date.
const findMergeableLot = async (itemId, containerId, expirationDate) => {
  const snapshot = await db
    .collection(lotsDB)
    .where("itemId", "==", itemId)
    .get();
  return snapshot.docs.find((doc) => {
    const lot = doc.data();
    return (
      normContainer(lot.containerId) === normContainer(containerId) &&
      normDate(lot.expirationDate) === normDate(expirationDate)
    );
  });
};

// Add stock. Merges into an existing (item, container, date) lot if present.
const addLot = async (
  itemId,
  containerId = null,
  quantity = 1,
  expirationDate = null,
) => {
  const qty = Number(quantity) || 0;

  const existing = await findMergeableLot(itemId, containerId, expirationDate);
  if (existing) {
    const newQty = (existing.data().quantity || 0) + qty;
    await existing.ref.update({ quantity: newQty });
    return { id: existing.id, quantity: newQty, merged: true };
  }

  const ref = await db.collection(lotsDB).add({
    itemId,
    containerId: normContainer(containerId),
    quantity: qty,
    expirationDate: normDate(expirationDate),
  });
  return { id: ref.id, quantity: qty, merged: false };
};

// Edit a lot's quantity / container / date. Quantity <= 0 deletes the lot.
const updateLot = async (id, fields) => {
  const ref = db.collection(lotsDB).doc(id);
  if (!(await ref.get()).exists) {
    throw new NotFoundError(`No lot found with id: ${id}`);
  }

  const update = {};
  if (fields.containerId !== undefined) {
    update.containerId = normContainer(fields.containerId);
  }
  if (fields.expirationDate !== undefined) {
    update.expirationDate = normDate(fields.expirationDate);
  }
  if (fields.quantity !== undefined) {
    const qty = Number(fields.quantity) || 0;
    if (qty <= 0) {
      await ref.delete();
      return { id, deleted: true };
    }
    update.quantity = qty;
  }

  await ref.update(update);
  return { id };
};

// Consume `amount` from a lot (used it); removes the lot when it hits zero.
const useLot = async (id, amount = 1) => {
  const ref = db.collection(lotsDB).doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new NotFoundError(`No lot found with id: ${id}`);
  }

  const remaining = (doc.data().quantity || 0) - (Number(amount) || 1);
  if (remaining <= 0) {
    await ref.delete();
    return { id, quantity: 0, deleted: true };
  }
  await ref.update({ quantity: remaining });
  return { id, quantity: remaining };
};

// Discard a whole lot (e.g. it spoiled).
const deleteLot = async (id) => {
  await db.collection(lotsDB).doc(id).delete();
  return true;
};

const getLotsByItem = async (itemId) => {
  const snapshot = await db
    .collection(lotsDB)
    .where("itemId", "==", itemId)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const getLotsByContainer = async (containerId) => {
  const snapshot = await db
    .collection(lotsDB)
    .where("containerId", "==", containerId)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const getAllLots = async () => {
  const snapshot = await db.collection(lotsDB).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// One-time migration: seed `lots` from existing containerItems (per-container
// amounts, no expiry). Idempotent — does nothing if lots already exist.
const migrateFromContainerItems = async () => {
  const existing = await db.collection(lotsDB).limit(1).get();
  if (!existing.empty) {
    return { migrated: 0, skipped: true, note: "lots already present" };
  }

  const snapshot = await db.collection(containerItemsDB).get();
  const docs = snapshot.docs;
  let migrated = 0;

  // Commit in chunks to stay under Firestore's 500-write batch limit.
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    for (const doc of docs.slice(i, i + 400)) {
      const { itemId, containerId, quantity } = doc.data();
      const ref = db.collection(lotsDB).doc();
      batch.set(ref, {
        itemId,
        containerId: normContainer(containerId),
        quantity: Number(quantity) || 0,
        expirationDate: null,
      });
      migrated += 1;
    }
    await batch.commit();
  }

  logger.info(`Lots migration | created ${migrated} lots`);
  return { migrated, skipped: false };
};

module.exports = {
  addLot,
  updateLot,
  useLot,
  deleteLot,
  getLotsByItem,
  getLotsByContainer,
  getAllLots,
  migrateFromContainerItems,
};
