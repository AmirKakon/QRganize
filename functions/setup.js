const functions = require("firebase-functions/v1");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const express = require("express");
const cors = require("cors");

const logger = functions.logger;

initializeApp();

const app = express();
const dev = express();

// Apply the express.json middleware
app.use(express.json());
dev.use(express.json());

// Apply the CORS middleware to both app and dev
app.use(cors({ origin: true }));
dev.use(cors({ origin: true }));

const db = getFirestore();

module.exports = { app, dev, functions, logger, db, Timestamp };
