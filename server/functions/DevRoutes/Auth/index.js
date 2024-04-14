const { dev, logger, admin, functions, db } = require("../../setup");
const jwt = require("jsonwebtoken");
const dayjs = require("dayjs");
const util = require("util");
const jwtVerify = util.promisify(jwt.verify);
const { checkRequiredParams } = require("../Utilities");

const baseDB = "refresh-tokens_dev";

const jwtKey = functions.config().serviceaccount_privateid_jwt.key;
const jwtKeyExpire = functions.config().serviceaccount_privateid_jwt.expire;
const jwtRefresh = functions.config().serviceaccount_clientid_jwt.refresh;
const jwtRefreshExpire = functions.config().serviceaccount_clientid_jwt.expire;

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new Error("Missing token in authorization header");
    }

    const user = await jwtVerify(token, jwtKey);
    req.user = user;
    next();
  } catch (error) {
    logger.error(error);
    res.status(400).send({ status: "Failed", error: error.message });
  }
};

const addRefreshToken = async (refreshToken, userId) => {
  if (!userId) {
    throw new Error("Invalid user ID");
  }

  if (!refreshToken) {
    throw new Error("Invalid refresh token");
  }

  await db
    .collection(baseDB)
    .doc(userId)
    .set({
      token: refreshToken,
      timestamp: admin.firestore.Timestamp.fromDate(dayjs().toDate()),
    });

  return { status: "Success", msg: "Token Added" };
};

const deleteRefreshToken = async (userId) => {
  if (!userId) {
    throw new Error("Invalid user ID");
  }

  const doc = db.collection(baseDB).doc(userId);
  const docSnapshot = await doc.get();

  if (!docSnapshot.exists) {
    throw new Error("Refresh token does not exist");
  }

  await doc.delete();

  return { status: "Success", msg: "Token Deleted" };
};

const generateTokens = async (user, refresh) => {
  if (
    !user ||
    !user.id ||
    !user.name ||
    user.name !== "test"
  ) {
    throw new Error("Invalid user");
  }

  const accessToken = jwt.sign(user, jwtKey, { expiresIn: jwtKeyExpire });
  if (!refresh) return accessToken;

  const refreshToken = jwt.sign(user, jwtRefresh, {
    expiresIn: jwtRefreshExpire,
  });

  const response = await addRefreshToken(refreshToken, user.id);
  if (response.status === "Failed") {
    throw new Error(response.msg);
  }

  return { accessToken, refreshToken };
};

dev.post("/api/auth/login", async (req, res) => {
  try {
    checkRequiredParams(["username", "id"], req.body);

    const username = req.body.username;
    const id = req.body.id;

    const user = { name: username, id: id };
    const { accessToken, refreshToken } = await generateTokens(user, true);

    res.status(200).send({
      status: "Success",
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    logger.error(error);
    res.status(400).send({ status: "Failed", message: error.message });
  }
});

dev.delete("/api/auth/logout", async (req, res) => {
  try {
    checkRequiredParams(["id"], req.body);

    const id = req.body.id;

    const response = await deleteRefreshToken(id);
    if (response.status === "Failed") {
      throw new Error(response.msg);
    }

    res.status(200).send({ status: "Success", message: "Logged Out" });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ status: "Failed", message: error.message });
  }
});

dev.post("/api/auth/refresh", async (req, res) => {
  try {
    checkRequiredParams(["token"], req.body);

    const refreshToken = req.body.token;

    const payload = jwt.decode(refreshToken);
    const { id } = payload;

    const tokenRef = db.collection(baseDB).doc(id);
    const doc = await tokenRef.get(); // gets doc
    const data = doc.data(); // the actual data of the doc

    if (!data || data.token !== refreshToken) {
      throw new Error(`No refresh token found with id: ${id}`);
    }

    jwt.verify(refreshToken, jwtRefresh, async (err, user) => {
      if (err) {
        throw err;
      }
      const accessToken = await generateTokens(
        { name: user.name, id: user.id },
        false,
      );
      res.status(200).send({ status: "Success", accessToken: accessToken });
    });
  } catch (error) {
    logger.error(error);
    res.status(400).send({ status: "Failed", message: error.message });
  }
});

module.exports = { authenticate, dev };
