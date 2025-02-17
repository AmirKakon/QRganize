const { dev, db } = require("../../setup");
const { authenticate } = require("../Auth");
const {
  checkRequiredParams,
  NotFoundError,
  handleErrors,
} = require("../Utilities");

const containersDB = "containers_dev";

// Create a container
dev.post("/api/containers/create", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["name", "items", "owner"], req.body);
    const itemRef = await db.collection(containersDB).add(req.body);
    return res.status(200).send({
      status: "Success",
      msg: "Container Saved",
      containerId: itemRef.id,
    });
  } catch (error) {
    return handleErrors(res, error, `Failed to create container: ${req.body}`);
  }
});

// Get a single container
dev.get("/api/containers/get/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const doc = await db.collection(containersDB).doc(req.params.id).get();
    if (!doc.exists) {
      throw new NotFoundError(`No container found with id: ${req.params.id}`);
    }
    return res
      .status(200)
      .send({ status: "Success", data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    return handleErrors(
      res,
      error,
      `Failed to get container: ${req.params.id}`,
    );
  }
});

// Get all containers
dev.get("/api/containers/getAll", authenticate, async (req, res) => {
  try {
    const snapshot = await db.collection(containersDB).get();
    if (snapshot.empty) throw new NotFoundError("No containers found");
    return res.status(200).send({
      status: "Success",
      data: snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    });
  } catch (error) {
    return handleErrors(res, error, `Failed to get all containers`);
  }
});

// Update a container
dev.put("/api/containers/update/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    checkRequiredParams(["name", "items", "owner"], req.body);
    await db.collection(containersDB).doc(req.params.id).update(req.body);
    return res
      .status(200)
      .send({ status: "Success", msg: "Container Updated" });
  } catch (error) {
    return handleErrors(
      res,
      error,
      `Failed to update container: ${req.params.id}`,
    );
  }
});

// Delete a container
dev.delete("/api/containers/delete/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const docRef = db.collection(containersDB).doc(req.params.id);
    if (!(await docRef.get()).exists) {
      throw new NotFoundError("Container not found");
    }
    await docRef.delete();
    return res
      .status(200)
      .send({ status: "Success", msg: "Container Deleted" });
  } catch (error) {
    return handleErrors(
      res,
      error,
      `Failed to delete container: ${req.params.id}`,
    );
  }
});

module.exports = { dev };
