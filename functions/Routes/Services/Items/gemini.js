const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const MODEL_NAME = "gemini-pro-vision";
const API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const generationConfig = {
  temperature: 0.4,
  topK: 32,
  topP: 1,
  maxOutputTokens: 4096,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

async function scanReceipt(image) {
  const parts = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: image,
      },
    },
    {
      text: "Scan this receipt and return a JSON formatted list of all items, quantities, and prices. The format should be an array of objects, where each object has the following properties: name, quantity, and price. Do not include taxes, discounts, or totals. Only include the items purchased.",
    },
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  const text = response.text();
  return JSON.parse(text);
}

module.exports = {
  scanReceipt,
};
