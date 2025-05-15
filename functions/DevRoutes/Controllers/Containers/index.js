const { dev } = require("../../../setup");
const { authenticate } = require("../Auth");
const { checkRequiredParams } = require("../../Utilities");
const { handleError } = require("../../Utilities/error-handler");
const ContainerService = require("../../Services/Containers");
const ItemService = require("../../Services/Items");

// Create a container
dev.post("/api/containers/create", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["name", "image"], req.body);
    checkRequiredParams(["uuid"], req.headers);
    const container = await ContainerService.createContainer(
      req.body.name,
      req.body.image,
      req.headers["uuid"],
      req.body.id ?? null,
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
    checkRequiredParams(["name", "image", "userId"], req.body);
    const updated = await ContainerService.updateContainer(
      req.params.id,
      req.body.name,
      req.body.image,
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
        `Failed to remove item from container: ${req.params.containerId}`,
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
      const updated = await ContainerService.updateItemQuantity(
        req.params.containerId,
        req.body.itemId,
        req.body.quantity,
      );
      return updated ?
        res.status(200).send({ status: "Success", msg: "Item Updated" }) :
        res
          .status(400)
          .send({ status: "Failed", msg: "Item failed to update" });
    } catch (error) {
      return handleError(
        res,
        error,
        `Failed to update item quantity in container: ${req.params.containerId}`,
      );
    }
  },
);

// update quantity of items in container
dev.put(
  "/api/containers/updateItemQuantitiesBatch/:containerId",
  authenticate,
  async (req, res) => {
    try {
      checkRequiredParams(["containerId"], req.params);
      checkRequiredParams(["items"], req.body);
      const updated = await ContainerService.updateItemQuantitiesBatch(
        req.params.containerId,
        req.body.items,
      );
      return updated ?
        res.status(200).send({ status: "Success", msg: "Items Updated" }) :
        res
          .status(400)
          .send({ status: "Failed", msg: "Items failed to update" });
    } catch (error) {
      return handleError(
        res,
        error,
        `Failed to update item quantity in container: ${req.params.containerId}`,
      );
    }
  },
);

// get all items in a container
dev.get(
  "/api/containers/getItems/:containerId",
  authenticate,
  async (req, res) => {
    try {
      checkRequiredParams(["containerId"], req.params);
      const list = await ContainerService.getItemsByContainerId(
        req.params.containerId,
      );

      const itemIds = list.items.map((item) => item.itemId);
      const itemList = await ItemService.getBatchOfItems(itemIds);

      const mergedList = list.items.map((item) => {
        const fullData = itemList.data.find((fullItem) => fullItem.id === item.itemId);
        return {
          ...item,
          ...fullData,
        };
      });

      return res.status(200).send({ status: "Success", data: mergedList });
    } catch (error) {
      return handleError(
        res,
        error,
        `Failed to get items in container: ${req.params.containerId}`,
      );
    }
  },
);

// get all containers that an item is in
dev.get(
  "/api/containers/getContainers/:itemId",
  authenticate,
  async (req, res) => {
    try {
      checkRequiredParams(["itemId"], req.params);
      const list = await ContainerService.getContainersByItemId(
        req.params.itemId,
      );

      const containerIds = list.containers.map((container) => container.containerId);

      return res.status(200).send({ status: "Success", data: containerIds });
    } catch (error) {
      return handleError(
        res,
        error,
        `Failed to get containers for item: ${req.params.itemId}`,
      );
    }
  },
);

module.exports = { dev };
