const { app } = require("../../../setup");
const { authenticate } = require("../Auth");
const { checkRequiredParams } = require("../../Utilities");
const { handleError } = require("../../Utilities/error-handler");
const UsersService = require("../../Services/Users");

// Create a user
app.post("/api/users/create", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["name", "email", "phone"], req.body);
    const user = await UsersService.createUser( req.body.name, req.body.email, req.body.phone);

    return res
      .status(200)
      .send({ status: "Success", msg: "User Saved", user: user });
  } catch (error) {
    return handleError(res, error, `Failed to create user: ${req.body}`);
  }
});

// Get a single user
app.get("/api/users/get/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);

    const user = await UsersService.getUser(req.params.id);

    return res
      .status(200)
      .send({ status: "Success", data: user });
  } catch (error) {
    return handleError(res, error, `Failed to get user: ${req.params.id}`);
  }
});

// Get all users
app.get("/api/users/getAll", authenticate, async (req, res) => {
  try {
    const users = await UsersService.getAllUsers();

    return res.status(200).send({
      status: "Success",
      data: users,
    });
  } catch (error) {
    return handleError(res, error, `Failed to get all users`);
  }
});

// Update a user
app.put("/api/users/update/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    checkRequiredParams(["name", "email", "phone"], req.body);
    const updated = await UsersService.updateUser(
      req.params.id,
      req.body.name,
      req.body.email,
      req.body.phone,
    );

    return updated ?
      res.status(200).send({ status: "Success", msg: "User Updated" }) :
      res
        .status(400)
        .send({ status: "Failed", msg: "User failed to updated" });
  } catch (error) {
    return handleError(res, error, `Failed to update user: ${req.params.id}`);
  }
});

// Delete a user
app.delete("/api/users/delete/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);

    const deleted = await UsersService.deleteUser(req.params.id);

    return deleted ?
      res.status(200).send({ status: "Success", msg: "User Deleted" }) :
      res
        .status(400)
        .send({ status: "Failed", msg: "User failed to delete" });
  } catch (error) {
    return handleError(res, error, `Failed to delete user: ${req.params.id}`);
  }
});

module.exports = { app };
