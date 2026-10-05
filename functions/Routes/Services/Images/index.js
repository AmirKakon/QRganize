const { randomUUID } = require("crypto");
const { db, logger } = require("../../../setup");
// firebase-admin/storage is required lazily inside getBucket (it pulls in the
// heavy @google-cloud/storage client; see Utilities for why that matters).

const backupsDB = "imageBackups";
const dataUrlPattern = /^data:(image\/[\w.+-]+);base64,([\s\S]*)$/;
const oneYearSeconds = 365 * 24 * 60 * 60;

const getBucket = () => {
  const { getStorage } = require("firebase-admin/storage");
  const config = JSON.parse(process.env.FIREBASE_CONFIG || "{}");
  const name =
    config.storageBucket || `${process.env.GCLOUD_PROJECT}.firebasestorage.app`;
  return getStorage().bucket(name);
};

// An image held inline in the document (data-URL or raw base64) rather than
// as a link. Inline images bloat every list response, so we move them out.
const isInlineImage = (image) =>
  typeof image === "string" && image.length > 0 && !/^https?:\/\//i.test(image);

// Upload an inline image to Cloud Storage and return its public download URL.
// Links and empty values pass through untouched, so callers can run every
// incoming image through this without checking first.
const storeImage = async (folder, id, image) => {
  if (!isInlineImage(image)) {
    return image ?? null;
  }

  const match = dataUrlPattern.exec(image);
  // Raw base64 (no data: prefix) is rendered as PNG by the client today.
  const contentType = match ? match[1] : "image/png";
  const data = Buffer.from(match ? match[2] : image, "base64");
  const extension = contentType.split("/")[1].replace("jpeg", "jpg").replace("+xml", "");
  // Timestamped path: a replaced photo gets a new URL, so the long browser
  // cache below never serves a stale image.
  const path = `${folder}/${id}-${Date.now()}.${extension}`;
  const token = randomUUID();

  const bucket = getBucket();
  await bucket.file(path).save(data, {
    resumable: false,
    contentType,
    metadata: {
      cacheControl: `public, max-age=${oneYearSeconds}, immutable`,
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  return (
    `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
    `${encodeURIComponent(path)}?alt=media&token=${token}`
  );
};

// One-time move of inline images in a collection to Cloud Storage. The
// original is copied to `imageBackups` first so it can be restored. Idempotent:
// documents that already hold a link are skipped, so it is safe to re-run.
const migrateCollection = async (collection, folder) => {
  const snapshot = await db.collection(collection).get();
  const pending = snapshot.docs.filter((doc) => isInlineImage(doc.data().image));
  const result = { collection, migrated: 0, failed: [] };

  const migrateDoc = async (doc) => {
    try {
      const image = doc.data().image;
      await db
        .collection(backupsDB)
        .doc(`${collection}_${doc.id}`)
        .set({ collection, id: doc.id, image, backedUpAt: new Date().toISOString() });
      const url = await storeImage(folder, doc.id, image);
      await doc.ref.update({ image: url });
      result.migrated += 1;
    } catch (error) {
      logger.error(`Failed to migrate image for ${collection}/${doc.id}`, error);
      result.failed.push(doc.id);
    }
  };

  // Small batches keep the run well inside the function timeout without
  // hammering Storage with every upload at once.
  const batchSize = 8;
  for (let i = 0; i < pending.length; i += batchSize) {
    await Promise.all(pending.slice(i, i + batchSize).map(migrateDoc));
  }

  return result;
};

module.exports = { storeImage, migrateCollection };
