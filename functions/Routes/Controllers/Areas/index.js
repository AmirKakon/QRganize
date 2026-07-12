const { app } = require("../../../setup");
const { authenticate } = require("../Auth");
const { checkRequiredParams } = require("../../Utilities");
const { handleError } = require("../../Utilities/error-handler");
const AreaService = require("../../Services/Areas");

// Create an area
app.post("/api/areas/create", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["name"], req.body);
    const area = await AreaService.createArea(req.body.name, req.body.id ?? null);
    return res.status(200).send({ status: "Success", data: area });
  } catch (error) {
    return handleError(res, error, "Failed to create area");
  }
});

// Get all areas
app.get("/api/areas/getAll", authenticate, async (req, res) => {
  try {
    const areas = await AreaService.getAllAreas();
    return res.status(200).send({ status: "Success", data: areas });
  } catch (error) {
    return handleError(res, error, "Failed to get areas");
  }
});

// Get a single area
app.get("/api/areas/get/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const area = await AreaService.getArea(req.params.id);
    return res.status(200).send({ status: "Success", data: area });
  } catch (error) {
    return handleError(res, error, `Failed to get area: ${req.params.id}`);
  }
});

// Rename an area
app.put("/api/areas/update/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    checkRequiredParams(["name"], req.body);
    const updated = await AreaService.updateArea(req.params.id, req.body.name);
    return updated ?
      res.status(200).send({ status: "Success", msg: "Area updated" }) :
      res.status(400).send({ status: "Failed", msg: "Area failed to update" });
  } catch (error) {
    return handleError(res, error, `Failed to update area: ${req.params.id}`);
  }
});

// Delete an area (containers are unassigned, not deleted)
app.delete("/api/areas/delete/:id", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["id"], req.params);
    const result = await AreaService.deleteArea(req.params.id);
    return res.status(200).send({ status: "Success", data: result });
  } catch (error) {
    return handleError(res, error, `Failed to delete area: ${req.params.id}`);
  }
});

module.exports = { app };
