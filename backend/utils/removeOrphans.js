// Orphan removal script: deletes metadata entries whose GridFS bytes are gone.
// Usage: node utils/removeOrphans.js
// Exits 0 on success (even if none removed), 1 on error.

require("dotenv").config();
const mongoose = require("mongoose");
const File = require("../models/File");

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error("Missing MONGODB_URI in environment (.env)");
  process.exit(1);
}

async function removeOrphans() {
  await mongoose.connect(MONGO_URI);
  const gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "files" });

  console.log("🧹 Removing orphaned file metadata...\n");
  const all = await File.find({}, { filename: 1, gridFsId: 1 });
  const toDelete = [];

  for (const meta of all) {
    try {
      const rows = await gridfsBucket.find({ _id: meta.gridFsId }).toArray();
      if (!rows || rows.length === 0) {
        toDelete.push(meta._id);
        console.log(`   - ${meta.filename} (${meta._id})`);
      }
    } catch {
      toDelete.push(meta._id);
      console.log(`   - ${meta.filename} (${meta._id}) [error reading GridFS]`);
    }
  }

  if (!toDelete.length) {
    console.log("✅ No orphaned metadata to delete.\n");
    await mongoose.connection.close();
    return;
  }

  const res = await File.deleteMany({ _id: { $in: toDelete } });
  console.log(`\n✅ Deleted ${res.deletedCount} orphaned metadata record(s).\n`);
  await mongoose.connection.close();
}

removeOrphans().catch(err => {
  console.error("❌ Removal failed:", err.message);
  process.exit(1);
});

module.exports = removeOrphans;