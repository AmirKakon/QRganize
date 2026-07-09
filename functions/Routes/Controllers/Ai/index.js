const { app, logger } = require("../../../setup");
const { authenticate } = require("../Auth");
const { checkRequiredParams } = require("../../Utilities");
const { MissingArgumentError } = require("../../Contracts/Errors");
const AiService = require("../../Services/Ai");

// Parse a receipt photo into line items via Gemini vision.
app.post("/api/ai/parseReceipt", authenticate, async (req, res) => {
  try {
    checkRequiredParams(["image"], req.body);

    const userId = req.headers["uuid"];
    const allowed = await AiService.checkAndIncrementUsage(userId);
    if (!allowed) {
      return res.status(429).send({
        status: "Failed",
        msg: "Daily scan limit reached. Please try again tomorrow.",
      });
    }

    const result = await AiService.parseReceipt(req.body.image);

    return res.status(200).send({ status: "Success", data: result });
  } catch (error) {
    logger.error("Failed to parse receipt", error);
    const status = error instanceof MissingArgumentError ? 400 : 500;
    return res.status(status).send({
      status: "Failed",
      msg: error.message || "Failed to parse receipt",
    });
  }
});

module.exports = { app };
