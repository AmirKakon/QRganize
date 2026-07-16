const { db, logger } = require("../../../setup");
const { NotFoundError } = require("../../Contracts/Errors");
const LotService = require("../Lots");

const containersDB = "containers";

// Create a container
const createContainer = async (name, image, userId, id = null, areaId = null) => {
  let itemRef = null;

  if (id) {
    await db
      .collection(containersDB)
      .doc(String(id))
      .set({
        name: name,
        image: image,
        userId: userId,
        areaId: areaId ?? null,
      });
    itemRef = db.collection(containersDB).doc(String(id));
  } else {
    itemRef = await db.collection(containersDB).add({
      name: name,
      image: image,
      userId: userId,
      areaId: areaId ?? null,
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
const updateContainer = async (id, name, image, userId, areaId = null) => {
  try {
    await db.collection(containersDB).doc(id).update({
      name: name,
      image: image,
      userId: userId,
      areaId: areaId ?? null,
    });
    return true;
  } catch (error) {
    logger.error(`Failed to update container: ${id}`, error);
    return false;
  }
};

// Clear an area from every container in it (used when an area is deleted).
const clearAreaFromContainers = async (areaId) => {
  const snapshot = await db
    .collection(containersDB)
    .where("areaId", "==", areaId)
    .get();
  if (snapshot.empty) {
    return 0;
  }
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.update(doc.ref, { areaId: null }));
  await batch.commit();
  return snapshot.size;
};

// Delete a container
const deleteContainer = async (id) => {
  try {
    const batch = db.batch();

    const docRef = db.collection(containersDB).doc(id);
    if (!(await docRef.get()).exists) {
      throw new NotFoundError("Container not found");
    }

    // Remove the stock batches stored in this container too.
    await LotService.deleteLotsByContainer(id);

    batch.delete(docRef);
    await batch.commit();

    return true;
  } catch (error) {
    logger.error(`Failed to delete container: ${id}`, error);
    return false;
  }
};

module.exports = {
  createContainer,
  getContainer,
  getAllContainers,
  getUserContainers,
  updateContainer,
  clearAreaFromContainers,
  deleteContainer,
};
