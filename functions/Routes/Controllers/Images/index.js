const { app } = require("../../../setup");
const { authenticate } = require("../Auth");
const { handleError } = require("../../Utilities/error-handler");
const ImageService = require("../../Services/Images");

// One-time: move inline (base64) item + container images to Cloud Storage so
// list responses stop carrying megabytes of photos. Idempotent; originals are
// kept in `imageBackups`. Remove this route once the migration is verified.
app.post("/api/images/migrate", authenticate, async (req, res) => {
  try {
    const items = await ImageService.migrateCollection("items", "items");
    const containers = await ImageService.migrateCollection("containers", "containers");
    return res.status(200).send({ status: "Success", data: { items, containers } });
  } catch (error) {
    return handleError(res, error, "Failed to migrate images");
  }
});
