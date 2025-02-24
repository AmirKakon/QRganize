const { dev } = require("../../../setup");
const { authenticate } = require("../Auth");
const { checkRequiredParams } = require("../../Utilities");
const { handleError } = require("../../Utilities/error-handler");
const ContainerService = require("../../Services/Containers");

// Create a container
dev.post("/api/containers/create", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["name", "userId"], req.body);
    const container = await ContainerService.createContainer(
      req.body.name,
      req.body.userId,
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
dev.get("/api/containers/get/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const container = await ContainerService.getContainer(req.params.id);

    return res.status(200).send({ status: "Success", data: container });
  } catch (error) {
    return handleError(res, error, `Failed to get container: ${req.params.id}`);
  }
});

// Get all containers
dev.get("/api/containers/getAll", authenticate, async (req, res) => {
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
dev.put("/api/containers/update/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    checkRequiredParams(["name", "userId"], req.body);
    const updated = await ContainerService.updateContainer(
      req.params.id,
      req.body.name,
      req.body.userId,
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
dev.delete("/api/containers/delete/:id", authenticate, async (req, res) => {
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

// add an item to a container
dev.post(
  "/api/containers/addItems/:containerId",
  authenticate,
  async (req, res) => {
    try {
      checkRequiredParams(["containerId"], req.params);
      checkRequiredParams(["itemId", "quantity"], req.body);

      const item = await ContainerService.addItemToContainer(
        req.params.containerId,
        req.body.itemId,
        req.body.quantity,
      );

      return res.status(200).send({ status: "Success", data: item });
    } catch (error) {
      return handleError(
        res,
        error,
        `Failed to add item to container: ${req.params.id}`,
      );
    }
  },
);

// remove an item from a container
dev.delete(
  "/api/containers/removeItems/:containerId/:itemId",
  authenticate,
  async (req, res) => {
    try {
      checkRequiredParams(["containerId", "itemId"], req.params);

      const removed = await ContainerService.removeItemFromContainer(
        req.params.containerId,
        req.params.itemId,
      );

      return removed ?
        res
          .status(200)
          .send({ status: "Success", msg: "Item remove successfully" }) :
        res
          .status(400)
          .send({ status: "Failed", msg: "Item failed to remove" });
    } catch (error) {
      return handleError(
        res,
        error,
        `Failed to add item to container: ${req.params.id}`,
      );
    }
  },
);

// update quantity of item in container
dev.put(
  "/api/containers/updateItemQuantity/:containerId",
  authenticate,
  async (req, res) => {
    try {
      checkRequiredParams(["containerId"], req.params);
      checkRequiredParams(["itemId", "quantity"], req.body);
      const updated = await ContainerService.updateItemQuantity(req.body);
      return updated ?
        res.status(200).send({ status: "Success", msg: "Item Updated" }) :
        res
          .status(400)
          .send({ status: "Failed", msg: "Item failed to update" });
    } catch (error) {
      return handleError(
        res,
        error,
        `Failed to update item quantity in container: ${req.body.containerId}`,
      );
    }
  },
);

// get all items in a container
dev.get(
  "/api/containers/getItemsByContainerId/:containerId",
  authenticate,
  async (req, res) => {
    try {
      checkRequiredParams(["containerId"], req.params);
      const items = await ContainerService.getItemsByContainerId(
        req.params.containerId,
      );

      return res.status(200).send({ status: "Success", data: items });
    } catch (error) {
      return handleError(
        res,
        error,
        `Failed to get items in container: ${req.params.containerId}`,
      );
    }
  },
);

module.exports = { dev };
