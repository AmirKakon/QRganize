

const { app, dev, functions } = require("./setup");

// app routes

// require("./Routes/CopyFromDev");

// dev routes
require("./DevRoutes/Auth");
require("./DevRoutes/Containers");
require("./DevRoutes/Items");
require("./DevRoutes/Users");

// Export the main app
exports.app = functions.https.onRequest(app);

// Export the dev version
exports.dev = functions.https.onRequest(dev);
