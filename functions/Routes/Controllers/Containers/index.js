const { app } = require("../../../setup");
const { authenticate } = require("../Auth");
const { checkRequiredParams } = require("../../Utilities");
const { handleError } = require("../../Utilities/error-handler");
const ContainerService = require("../../Services/Containers");

// Create a container
app.post("/api/containers/create", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["name", "image"], req.body);
    checkRequiredParams(["uuid"], req.headers);
    const container = await ContainerService.createContainer(
      req.body.name,
      req.body.image,
      req.headers["uuid"],
      req.body.id ?? null,
      req.body.areaId ?? null,
    );

    return res.status(200).send({
      status: "Success",
      msg: "Container Saved",
      container: container,
    });
  } catch (error) {
    return handleError(res, error, `Failed to create container: ${req.body}`);
  }
});

// Get a single container
app.get("/api/containers/get/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const container = await ContainerService.getContainer(req.params.id);

    return res.status(200).send({ status: "Success", data: container });
  } catch (error) {
    return handleError(res, error, `Failed to get container: ${req.params.id}`);
  }
});

// Get all containers
app.get("/api/containers/getAll", authenticate, async (req, res) => {
  try {
    const containers = await ContainerService.getAllContainers();

    return res.status(200).send({
      status: "Success",
      data: containers,
    });
  } catch (error) {
    return handleError(res, error, `Failed to get all containers`);
  }
});

// Update a container
app.put("/api/containers/update/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    checkRequiredParams(["name", "image", "userId"], req.body);
    const updated = await ContainerService.updateContainer(
      req.params.id,
      req.body.name,
      req.body.image,
      req.body.userId,
      req.body.areaId ?? null,
    );
    return updated ?
      res.status(200).send({ status: "Success", msg: "Container Updated" }) :
      res
        .status(400)
        .send({ status: "Failed", msg: "Container failed to updated" });
  } catch (error) {
    return handleError(
      res,
      error,
      `Failed to update container: ${req.params.id}`,
    );
  }
});

// Delete a container
app.delete("/api/containers/delete/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const deleted = await ContainerService.deleteContainer(req.params.id);
    return deleted ?
      res.status(200).send({ status: "Success", msg: "Container Deleted" }) :
      res
        .status(400)
        .send({ status: "Failed", msg: "Container failed to delete" });
  } catch (error) {
    return handleError(
      res,
      error,
      `Failed to delete container: ${req.params.id}`,
    );
  }
});

module.exports = { app };
