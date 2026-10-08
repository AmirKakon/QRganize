const { db, functions, logger } = require("../../../setup");
const { MissingArgumentError } = require("../../Contracts/Errors");
// axios is required lazily inside parseReceipt (see Utilities for why).

const usageDB = "aiUsage";
const geminiBaseUrl =
  "https://generativelanguage.googleapis.com/v1beta/models";
// Default to Pro for better OCR on tough/garbled receipts. Override without a
// deploy via functions config: `firebase functions:config:set gemini.model=...`
const defaultModel = "gemini-2.5-pro";
// Retried once if the primary model errors (e.g. Pro rate-limit) so a scan
// never hard-fails. Skipped when the primary already is this model.
const fallbackModel = "gemini-2.5-flash";
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
          englishName: { type: "STRING" },
          price: { type: "NUMBER" },
          quantity: { type: "NUMBER" },
          barcode: { type: "STRING" },
          shelfLifeDays: { type: "INTEGER", nullable: true },
        },
        required: ["name", "price", "quantity"],
      },
    },
  },
  required: ["items"],
};

// Receipt text as printed: no Hebrew vowel marks (niqqud) or other combining
// marks, which the model sometimes adds and which would never match the plain
// text saved as an item's alternate name.
const stripMarks = (value) =>
  String(value || "").normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC").trim();

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
// The schema for one scan: tags are limited to the user's existing tags (an
// enum), so suggestions can't invent new ones.
const schemaFor = (tags) => {
  if (!tags.length) return receiptSchema;
  const schema = JSON.parse(JSON.stringify(receiptSchema));
  schema.properties.items.items.properties.tags = {
    type: "ARRAY",
    items: { type: "STRING", enum: tags },
  };
  return schema;
};

const parseReceipt = async (image, tags = []) => {
  const vocabulary = [...new Set([].concat(tags || [])
    .map((t) => String(t).trim().toLowerCase())
    .filter((t) => t && t.length <= 40))].slice(0, 100);
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
    "purchased product line items. For name, copy the product name exactly " +
    "as printed, in its original language, without the quantity, weight, " +
    "unit price or total from that line, and without adding vowel marks.\n\n" +
    "Also give each line an englishName: a short, natural English name " +
    "for the product, the way someone would write it on a shopping list. " +
    "Translate Hebrew, expand receipt abbreviations, and drop store codes " +
    "and pack weights unless they tell two products apart (e.g. " +
    "\"Cucumbers\", \"Danone PRO yogurt\", \"Whole spelt flour\"). If the " +
    "name is already English, clean it up the same way.\n\n" +
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
    "barcode when no code is visible for that line.\n\n" +
    "shelfLifeDays: how many days the product typically stays good after " +
    "purchase, stored the usual way (fridge for perishables). Omit it for " +
    "shelf-stable products such as pasta, cans, snacks, drinks and household " +
    "goods." +
    (vocabulary.length ?
      "\n\ntags: pick the 1 or 2 tags from the allowed list that fit the " +
      "product best (e.g. chicken thighs -> chicken, meat). Use none if nothing fits." :
      "");

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
      responseSchema: schemaFor(vocabulary),
    },
  };

  const axios = require("axios");
  const runModel = async (m) => {
    const url = `${geminiBaseUrl}/${m}:generateContent?key=${apiKey}`;
    const response = await axios.post(url, body, {
      headers: { "Content-Type": "application/json" },
    });
    return (
      response.data &&
      response.data.candidates &&
      response.data.candidates[0] &&
      response.data.candidates[0].content.parts[0].text
    );
  };

  let text;
  try {
    text = await runModel(model);
  } catch (error) {
    const status = error.response && error.response.status;
    logger.warn(`Gemini model ${model} failed (${status || error.message}).`);
    // Don't hard-fail a scan on a Pro rate-limit/error — retry once on flash.
    if (model !== fallbackModel) {
      logger.info(`Retrying receipt parse on ${fallbackModel}.`);
      text = await runModel(fallbackModel);
    } else {
      throw error;
    }
  }

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
      name: stripMarks(item.name),
      englishName: String(item.englishName || "").trim(),
      price: Number(item.price) || 0,
      // Inventory counts are whole numbers; round up any fractional weight
      // the model may still return, with a floor of 1.
      quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
      // Digits only; used to match against existing items (keyed by barcode).
      barcode: String(item.barcode || "").replace(/\D/g, ""),
      // The fallback model may not honour the enum, so filter again.
      tags: [].concat(item.tags || [])
        .map((t) => String(t).toLowerCase())
        .filter((t, i, all) => vocabulary.includes(t) && all.indexOf(t) === i)
        .slice(0, 2),
      shelfLifeDays: Number.isInteger(item.shelfLifeDays) &&
        item.shelfLifeDays >= 1 && item.shelfLifeDays <= 730 ?
        item.shelfLifeDays :
        null,
    }))
    .filter((item) => item.name);

  return { items };
};

module.exports = { checkAndIncrementUsage, parseReceipt };
