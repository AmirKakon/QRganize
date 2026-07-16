const { app } = require("../../../setup");
const { authenticate } = require("../Auth");
const { checkRequiredParams } = require("../../Utilities");
const { handleError } = require("../../Utilities/error-handler");
const LotService = require("../../Services/Lots");

// Add stock (a lot) for an item. quantity defaults to 1; container/date optional.
app.post("/api/lots/add", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["itemId"], req.body);
    const lot = await LotService.addLot(
      req.body.itemId,
      req.body.containerId ?? null,
      req.body.quantity ?? 1,
      req.body.expirationDate ?? null,
    );
    return res.status(200).send({ status: "Success", data: lot });
  } catch (error) {
    return handleError(res, error, "Failed to add lot");
  }
});

// Update a lot (quantity / container / expirationDate). quantity<=0 deletes it.
app.put("/api/lots/update/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const result = await LotService.updateLot(req.params.id, req.body);
    return res.status(200).send({ status: "Success", data: result });
  } catch (error) {
    return handleError(res, error, `Failed to update lot: ${req.params.id}`);
  }
});

// Consume some quantity from a lot ("used it"). Removes the lot at zero.
app.post("/api/lots/use/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const result = await LotService.useLot(req.params.id, req.body.amount ?? 1);
    return res.status(200).send({ status: "Success", data: result });
  } catch (error) {
    return handleError(res, error, `Failed to use lot: ${req.params.id}`);
  }
});

// Discard a whole lot (spoiled / removed).
app.delete("/api/lots/delete/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    await LotService.deleteLot(req.params.id);
    return res.status(200).send({ status: "Success", msg: "Lot deleted" });
  } catch (error) {
    return handleError(res, error, `Failed to delete lot: ${req.params.id}`);
  }
});

// All lots for an item (its stock across containers and dates).
app.get("/api/lots/byItem/:itemId", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["itemId"], req.params);
    const lots = await LotService.getLotsByItem(req.params.itemId);
    return res.status(200).send({ status: "Success", data: lots });
  } catch (error) {
    return handleError(
      res,
      error,
      `Failed to get lots for item: ${req.params.itemId}`,
    );
  }
});

// All lots in a container.
app.get("/api/lots/byContainer/:containerId", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["containerId"], req.params);
    const lots = await LotService.getLotsByContainer(req.params.containerId);
    return res.status(200).send({ status: "Success", data: lots });
  } catch (error) {
    return handleError(
      res,
      error,
      `Failed to get lots for container: ${req.params.containerId}`,
    );
  }
});

module.exports = { app };
