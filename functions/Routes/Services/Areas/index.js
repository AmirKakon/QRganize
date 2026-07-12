const { db, logger } = require("../../../setup");
const { NotFoundError } = require("../../Contracts/Errors");
const ContainerService = require("../Containers");

const areasDB = "areas";

// An area groups containers by physical location (kitchen, pantry, garage…).

const createArea = async (name, id = null) => {
  let ref = null;
  if (id) {
    await db.collection(areasDB).doc(String(id)).set({ name });
    ref = db.collection(areasDB).doc(String(id));
  } else {
    ref = await db.collection(areasDB).add({ name });
  }
  return { areaId: ref.id };
};

const getArea = async (id) => {
  const doc = await db.collection(areasDB).doc(id).get();
  if (!doc.exists) {
    throw new NotFoundError(`No area found with id: ${id}`);
  }
  return { id: doc.id, ...doc.data() };
};

const getAllAreas = async () => {
  const snapshot = await db.collection(areasDB).get();
  return {
    areas: snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || "")),
  };
};

const updateArea = async (id, name) => {
  try {
    await db.collection(areasDB).doc(id).update({ name });
    return true;
  } catch (error) {
    logger.error(`Failed to update area: ${id}`, error);
    return false;
  }
};

// Delete an area. Containers in it are unassigned (never deleted).
const deleteArea = async (id) => {
  const ref = db.collection(areasDB).doc(id);
  if (!(await ref.get()).exists) {
    throw new NotFoundError("Area not found");
  }
  const unassigned = await ContainerService.clearAreaFromContainers(id);
  await ref.delete();
  return { deleted: true, unassignedContainers: unassigned };
};

module.exports = {
  createArea,
  getArea,
  getAllAreas,
  updateArea,
  deleteArea,
};
