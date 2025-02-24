const { dev, db } = require("../../../setup");
const { authenticate } = require("../Auth");
const { checkRequiredParams } = require("../Utilities");
const { NotFoundError, handleError } = require("../Utilities/error-handler");

const usersDB = "users_dev";

// Create a user
dev.post("/api/users/create", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["name", "email"], req.body);
    const userRef = await db.collection(usersDB).add(req.body);
    return res
      .status(200)
      .send({ status: "Success", msg: "User Saved", userId: userRef.id });
  } catch (error) {
    return handleError(res, error, `Failed to create user: ${req.body}`);
  }
});

// Get a single user
dev.get("/api/users/get/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const doc = await db.collection(usersDB).doc(req.params.id).get();
    if (!doc.exists) {
      throw new NotFoundError(`No user found with id: ${req.params.id}`);
    }
    return res
      .status(200)
      .send({ status: "Success", data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    return handleError(res, error, `Failed to get user: ${req.params.id}`);
  }
});

// Get all users
dev.get("/api/users/getAll", authenticate, async (req, res) => {
  try {
    const snapshot = await db.collection(usersDB).get();
    if (snapshot.empty) throw new NotFoundError("No users found");
    return res.status(200).send({
      status: "Success",
      data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    });
  } catch (error) {
    return handleError(res, error, `Failed to get all users`);
  }
});

// Update a user
dev.put("/api/users/update/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    checkRequiredParams(["name", "email"], req.body);
    await db.collection(usersDB).doc(req.params.id).update(req.body);
    return res.status(200).send({ status: "Success", msg: "User Updated" });
  } catch (error) {
    return handleError(res, error, `Failed to update user: ${req.params.id}`);
  }
});

// Delete a user
dev.delete("/api/users/delete/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const docRef = db.collection(usersDB).doc(req.params.id);
    if (!(await docRef.get()).exists) throw new NotFoundError("User not found");
    await docRef.delete();
    return res.status(200).send({ status: "Success", msg: "User Deleted" });
  } catch (error) {
    return handleError(res, error, `Failed to delete user: ${req.params.id}`);
  }
});

module.exports = { dev };
