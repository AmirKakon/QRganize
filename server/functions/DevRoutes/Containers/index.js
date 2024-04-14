const { dev, logger, db } = require("../../setup");
const { authenticate } = require("../Auth");
const { checkRequiredParams } = require("../Utilities");

const baseDB = "containers_dev";

// create a container
dev.post("/api/containers/create", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["name", "items", "owner"], req.body);

    const itemRef = await db.collection(baseDB).add({
      name: req.body.name,
      items: req.body.items,
      owner: req.body.owner,
    });

    const doc = await itemRef.get();

    return res
      .status(200)
      .send({ status: "Success", msg: "Container Saved", containerId: doc.id });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ status: "Failed", msg: error });
  }
});

// get a single container using specific id
dev.get("/api/containers/get/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const id = req.params.id;
    const itemRef = db.collection(baseDB).doc(id);
    const doc = await itemRef.get(); // gets doc
    const data = doc.data(); // the actual data of the item

    if (!data) {
      throw new Error(`No container found with id: ${id}`);
    }

    const container = {
      id: doc.id,
      ...data,
    };
    return res.status(200).send({ status: "Success", data: container });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ status: "Failed", msg: error });
  }
});

dev.get("/api/containers/getAll", authenticate, async (req, res) => {
  try {
    const itemsRef = db.collection(baseDB);
    const snapshot = await itemsRef.get();

    if (snapshot.empty) {
      throw new Error("No containers found");
    }

    const containers = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // .sort((a, b) => a.id.localeCompare(b.id));

    // Send the containers as a response
    return res.status(200).send({
      status: "Success",
      data: containers,
    });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ status: "Failed", msg: error.message });
  }
});

// update containers
dev.put("/api/containers/update/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    checkRequiredParams(["name", "items", "owner"], req.body);

    const reqDoc = db.collection(baseDB).doc(req.params.id);
    await reqDoc.update({
      name: req.body.name,
      items: req.body.items,
      owner: req.body.owner,
    });

    return res
      .status(200)
      .send({ status: "Success", msg: "Container Updated" });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ status: "Failed", msg: error });
  }
});

// delete container
dev.delete("/api/containers/delete/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);

    const reqDoc = db.collection(baseDB).doc(req.params.id);
    const doc = await reqDoc.get();

    if (!doc.exists) {
      throw new Error("Container not found");
    }

    await reqDoc.delete();

    return res
      .status(200)
      .send({ status: "Success", msg: "Container Deleted" });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ status: "Failed", msg: error });
  }
});

module.exports = { dev };
