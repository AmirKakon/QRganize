const { db, logger } = require("../../../setup");
const { NotFoundError } = require("../../Contracts/Errors");

const containersDB = "containers_dev";
const containerItemsDB = "containerItems_dev";

// Create a container
const createContainer = async (name, userId) => {
  const itemRef = await db.collection(containersDB).add({
    name: name,
    userId: userId,
  });

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
const updateContainer = async (id, name, userId) => {
  try {
    await db.collection(containersDB).doc(id).update({
      name: name,
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
    return { containerId, items: [] };
  }

  if (asSnapshot) {
    return snapshot;
  }

  const items = snapshot.docs.map((doc) => ({ ...doc.data() }));

  return { containerId, items };
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
  getItemsByContainerId,
};
