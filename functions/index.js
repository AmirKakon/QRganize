const { app, dev, functions } = require("./setup");

// app routes
require("./Routes/Controllers/Auth");
require("./Routes/Controllers/Containers");
require("./Routes/Controllers/Items");
require("./Routes/Controllers/Users");
require("./Routes/Controllers/Ai");

// require("./Routes/CopyFromDev");

// dev routes
require("./DevRoutes/Controllers/Auth");
require("./DevRoutes/Controllers/Containers");
require("./DevRoutes/Controllers/Items");
require("./DevRoutes/Controllers/Users");

// Export the main app. GEMINI_KEY is bound from Secret Manager and exposed as
// process.env.GEMINI_KEY at runtime (set it with `firebase functions:secrets:set
// GEMINI_KEY`); no .env file or CI secret needed.
exports.app = functions
  .runWith({ secrets: ["GEMINI_KEY"] })
  .https.onRequest(app);

// Export the dev version
exports.dev = functions.https.onRequest(dev);
