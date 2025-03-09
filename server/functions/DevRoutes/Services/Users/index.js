const { dev, db } = require("../../../setup");
const { NotFoundError, handleError } = require("../Utilities/error-handler");
const ContainerService = require("../Containers");

const usersDB = "users_dev";
const userItemsDB = "userItems_dev";

// Create a user
const createUser = async (name, email, phone) => {
  const itemRef = await db.collection(usersDB).add({
      name: name,
      email: email,
      phone: phone
    });
  
    return {
      userId: itemRef.id,
    };
};

// Get a single user
const getUser = async (id) => {
  const doc = await db.collection(usersDB).doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError(`No user found with id: ${id}`);
  }

  return { id: doc.id, ...doc.data() };
};

// Get all users
const getAllUsers = async () => {
  const snapshot = await db.collection(usersDB).get();

  if (snapshot.empty) {
    logger.info("Get all users | No users found");
    return { users: [] };
  }

  return {
    users: snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
};

// Update a user
const updateUser = async (id, name, email, phone) => {
  try {
    await db.collection(usersDB).doc(id).update({
      name: name,
      email: email,
      phone: phone
    });
    return true;
  } catch (error) {
    logger.error(`Failed to update user: ${id}`, error);
    return false;
  }
};

// Delete a user
const deleteUser = async (id) => {
  try {
    const batch = db.batch();

    const docRef = db.collection(usersDB).doc(id);
    if (!(await docRef.get()).exists) {
      throw new NotFoundError("User not found");
    }

    // delete all containers of a user
    const containers = await ContainerService.getUserContainers(id, true);

    containers.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // delete all item relations of a user
    const items = await ItemService.getUserItems(id, true);

    items.forEach((doc) => {
      batch.delete(doc.ref);
    });

    batch.delete(docRef);
    await batch.commit();

    return true;
  } catch (error) {
    logger.error(`Failed to delete user: ${id}`, error);
    return false;
  }
};


module.exports = { dev };
