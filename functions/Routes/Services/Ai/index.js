const axios = require("axios");
const { db, functions, logger } = require("../../../setup");
const { MissingArgumentError } = require("../../Contracts/Errors");

const usageDB = "aiUsage";
const geminiBaseUrl =
  "https://generativelanguage.googleapis.com/v1beta/models";
const defaultModel = "gemini-2.5-flash";
const dailyLimit = 25;

// Gemini structured-output schema (OpenAPI subset — types are uppercase enums).
const receiptSchema = {
  type: "OBJECT",
  properties: {
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          price: { type: "NUMBER" },
          quantity: { type: "NUMBER" },
          barcode: { type: "STRING" },
        },
        required: ["name", "price", "quantity"],
      },
    },
  },
  required: ["items"],
};

// Split a data URL ("data:image/jpeg;base64,...") into mime type + raw base64.
const parseImageData = (image) => {
  const match = /^data:(.+);base64,(.*)$/.exec(image);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: "image/jpeg", data: image };
};

// Lightweight abuse guard: cap AI calls per user per day, tracked in Firestore.
const checkAndIncrementUsage = async (userId) => {
  if (!userId) {
    throw new MissingArgumentError("Missing parameter: uuid");
  }

  const date = new Date().toISOString().slice(0, 10);
  const ref = db.collection(usageDB).doc(`${userId}_${date}`);

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const count = doc.exists ? doc.data().count || 0 : 0;
    if (count >= dailyLimit) {
      return false;
    }
    tx.set(ref, { userId, date, count: count + 1 }, { merge: true });
    return true;
  });
};

// Send the receipt image to Gemini and return normalized line items.
const parseReceipt = async (image) => {
  // Read config defensively (same pattern as the rest of the app) so module
  // load never crashes when the runtime config is absent (e.g. CI analysis).
  const geminiCfg = functions.config().gemini || {};
  const apiKey = geminiCfg.key;
  const model = geminiCfg.model || defaultModel;

  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const { mimeType, data } = parseImageData(image);

  const prompt =
    "This is a photo of a store purchase receipt. Extract only the " +
    "purchased product line items. Keep each product name in its " +
    "original language.\n\n" +
    "Pricing and quantity rules:\n" +
    "- If an item is sold per unit (a discrete count), set price to the " +
    "per-unit price and quantity to the number of units purchased.\n" +
    "- If an item is sold by weight or volume (the receipt shows a " +
    "per-kilogram or per-liter price times a fractional amount), set " +
    "price to the total amount actually paid for that line and set " +
    "quantity to 1. Never return fractional quantities.\n\n" +
    "Ignore everything that is not a product you would stock: store " +
    "details, dates, cashier lines, subtotals, taxes, totals, discounts, " +
    "loyalty/points lines, shopping bags, bag fees, and bottle or " +
    "container deposits. If a quantity cannot be determined, use 1.\n\n" +
    "If a product barcode or item code is printed on the line (usually a " +
    "long run of digits), return it as barcode using digits only. Omit " +
    "barcode when no code is visible for that line.";

  const url = `${geminiBaseUrl}/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mimeType, data } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: receiptSchema,
    },
  };

  const response = await axios.post(url, body, {
    headers: { "Content-Type": "application/json" },
  });

  const text =
    response.data &&
    response.data.candidates &&
    response.data.candidates[0] &&
    response.data.candidates[0].content.parts[0].text;

  if (!text) {
    logger.error("Gemini returned no content");
    return { items: [] };
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    logger.error("Failed to parse Gemini response as JSON");
    return { items: [] };
  }

  const items = (parsed.items || [])
    .map((item) => ({
      name: String(item.name || "").trim(),
      price: Number(item.price) || 0,
      // Inventory counts are whole numbers; round up any fractional weight
      // the model may still return, with a floor of 1.
      quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
      // Digits only; used to match against existing items (keyed by barcode).
      barcode: String(item.barcode || "").replace(/\D/g, ""),
    }))
    .filter((item) => item.name);

  return { items };
};

module.exports = { checkAndIncrementUsage, parseReceipt };
