const { db, logger } = require("../../../setup");
const { NotFoundError } = require("../../Contracts/Errors");

const containersDB = "containers";
const containerItemsDB = "containerItems";

// Create a container
const createContainer = async (name, image, userId, id = null) => {
  let itemRef = null;

  if (id) {
    await db
      .collection(containersDB)
      .doc(String(id))
      .set({
        name: name,
        image: image,
        userId: userId,

      });
    itemRef = db.collection(containersDB).doc(String(id));
  } else {
    itemRef = await db.collection(containersDB).add({
      name: name,
      image: image,
      userId: userId,
    });
  }

  return {
    containerId: itemRef.id,
  };
};

// Get a single container
const getContainer = async (id) => {
  const doc = await db.collection(containersDB).doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError(`No container found with id: ${id}`);
  }

  return { id: doc.id, ...doc.data() };
};

// Get all containers
const getAllContainers = async () => {
  const snapshot = await db.collection(containersDB).get();

  if (snapshot.empty) {
    logger.info("Get all containers | No containers found");
    return { containers: [] };
  }

  return {
    containers: snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
};

// Get all containers of a user
const getUserContainers = async (userId, asSnapshot = false) => {
  const snapshot = await db
    .collection(containersDB)
    .where("userId", "==", userId)
    .get();

  if (snapshot.empty) {
    logger.info(
      `Get users containers | No containers found for user ${userId}`,
    );
    return { containers: [] };
  }

  return asSnapshot ?
    snapshot :
    {
      containers: snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
};

// Update a container
const updateContainer = async (id, name, image, userId) => {
  try {
    await db.collection(containersDB).doc(id).update({
      name: name,
      image: image,
      userId: userId,
    });
    return true;
  } catch (error) {
    logger.error(`Failed to update container: ${id}`, error);
    return false;
  }
};

// Delete a container
const deleteContainer = async (id) => {
  try {
    const batch = db.batch();

    const docRef = db.collection(containersDB).doc(id);
    if (!(await docRef.get()).exists) {
      throw new NotFoundError("Container not found");
    }

    const itemsSnapshot = await getItemsByContainerId(id, true);

    itemsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    batch.delete(docRef);
    await batch.commit();

    return true;
  } catch (error) {
    logger.error(`Failed to delete container: ${id}`, error);
    return false;
  }
};

// add item to container
const addItemToContainer = async (containerId, itemId, quantity) => {
  const itemRef = db
    .collection(containerItemsDB)
    .doc(`${containerId}_${itemId}`);
  await itemRef.set({
    containerId,
    itemId,
    quantity,
  });

  return {
    id: itemRef.id,
  };
};

// remove item from container
const removeItemFromContainer = async (containerId, itemId) => {
  await db
    .collection(containerItemsDB)
    .doc(`${containerId}_${itemId}`)
    .delete();
  return true;
};

// update quantity of item in container
const updateItemQuantity = async ( containerId, itemId, quantity ) => {
  const itemRef = db
    .collection(containerItemsDB)
    .doc(`${containerId}_${itemId}`);

  const itemDoc = await itemRef.get();
  if (!itemDoc.exists) {
    throw new NotFoundError(
      `Item ${itemId} not found in container ${containerId}`,
    );
  }

  await itemRef.update({ quantity });

  return true;
};

const updateItemQuantitiesBatch = async (containerId, items) => {
  const batch = db.batch();

  for (const { itemId, quantity } of items) {
    const itemRef = db
      .collection(containerItemsDB)
      .doc(`${containerId}_${itemId}`);

    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      throw new Error(`Item ${itemId} not found in container ${containerId}`);
    }

    batch.update(itemRef, { quantity });
  }

  await batch.commit();
  return true;
};

// get all items in a container
const getItemsByContainerId = async (containerId, asSnapshot = false) => {
  const snapshot = await db
    .collection(containerItemsDB)
    .where("containerId", "==", containerId)
    .get();

  if (snapshot.empty) {
    logger.info(
      `Get container items | No items found for container ${containerId}`,
    );
    return asSnapshot ? [] : { containerId, items: [] };
  }

  if (asSnapshot) {
    return snapshot;
  }

  const items = snapshot.docs.map((doc) => ({ ...doc.data() }));

  return { containerId, items };
};

// get all containers that an item is in
const getContainersByItemId = async (itemId, asSnapshot = false) => {
  const snapshot = await db
    .collection(containerItemsDB)
    .where("itemId", "==", itemId)
    .get();

  if (snapshot.empty) {
    logger.info(
      `Get container items | No containers found for item ${itemId}`,
    );
    return asSnapshot ? [] : { itemId, containers: [] };
  }

  if (asSnapshot) {
    return snapshot;
  }

  const containers = snapshot.docs.map((doc) => ({ ...doc.data() }));

  return { itemId, containers };
};

module.exports = {
  createContainer,
  getContainer,
  getAllContainers,
  getUserContainers,
  updateContainer,
  deleteContainer,
  addItemToContainer,
  removeItemFromContainer,
  updateItemQuantity,
  updateItemQuantitiesBatch,
  getItemsByContainerId,
  getContainersByItemId,
};
