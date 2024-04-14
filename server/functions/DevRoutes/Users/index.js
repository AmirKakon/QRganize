const { dev, logger, db } = require("../../setup");
const { authenticate } = require("../Auth");
const { checkRequiredParams } = require("../Utilities");

const baseDB = "users_dev";

// create a user
dev.post("/api/users/create", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["name", "email"], req.body);

    const itemRef = await db.collection(baseDB).add({
      name: req.body.name,
      email: req.body.email,
    });

    const doc = await itemRef.get();

    return res
      .status(200)
      .send({ status: "Success", msg: "User Saved", userId: doc.id });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ status: "Failed", msg: error });
  }
});

// get a single user using specific id
dev.get("/api/users/get/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const id = req.params.id;
    const itemRef = db.collection(baseDB).doc(id);
    const doc = await itemRef.get(); // gets doc
    const data = doc.data(); // the actual data of the item

    if (!data) {
      throw new Error(`No user found with id: ${id}`);
    }

    const user = {
      id: doc.id,
      ...data,
    };
    return res.status(200).send({ status: "Success", data: user });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ status: "Failed", msg: error });
  }
});

dev.get("/api/users/getAll", authenticate, async (req, res) => {
  try {
    const itemsRef = db.collection(baseDB);
    const snapshot = await itemsRef.get();

    if (snapshot.empty) {
      throw new Error("No users found");
    }

    const users = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    // Send the users as a response
    return res.status(200).send({
      status: "Success",
      data: users,
    });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ status: "Failed", msg: error.message });
  }
});

// update users
dev.put("/api/users/update/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    checkRequiredParams(["name", "email"], req.body);

    const reqDoc = db.collection(baseDB).doc(req.params.id);
    await reqDoc.update({
      name: req.body.name,
      email: req.body.email,
    });

    return res
      .status(200)
      .send({ status: "Success", msg: "User Updated" });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ status: "Failed", msg: error });
  }
});

// delete user
dev.delete("/api/users/delete/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);

    const reqDoc = db.collection(baseDB).doc(req.params.id);
    const doc = await reqDoc.get();

    if (!doc.exists) {
      throw new Error("User not found");
    }

    await reqDoc.delete();

    return res
      .status(200)
      .send({ status: "Success", msg: "User Deleted" });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ status: "Failed", msg: error });
  }
});

module.exports = { dev };
