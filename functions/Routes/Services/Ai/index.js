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
    "This is a photo of a store purchase receipt. Extract the purchased " +
    "line items. For each item return its name, unit price as a number, " +
    "and quantity as a number. Ignore store details, dates, subtotals, " +
    "taxes, totals, discounts, and loyalty lines. If a quantity is not " +
    "shown, use 1.";

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
      quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
    }))
    .filter((item) => item.name);

  return { items };
};

module.exports = { checkAndIncrementUsage, parseReceipt };
