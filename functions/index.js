

const { app, dev, functions } = require("./setup");

// app routes

// require("./Routes/CopyFromDev");

// dev routes
require("./DevRoutes/Controllers/Auth");
require("./DevRoutes/Controllers/Containers");
require("./DevRoutes/Controllers/Items");
require("./DevRoutes/Controllers/Users");

// Export the main app
exports.app = functions.https.onRequest(app);

// Export the dev version
exports.dev = functions.https.onRequest(dev);
