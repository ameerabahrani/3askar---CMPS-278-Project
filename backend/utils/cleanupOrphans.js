// Orphan scan script: lists File metadata whose GridFS bytes are missing.
// Usage: node utils/cleanupOrphans.js
// Exits with code 0 if none, 2 if orphans found, 1 on error.

require("dotenv").config();
const mongoose = require("mongoose");
const File = require("../models/File");

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error("Missing MONGODB_URI in environment (.env)");
  process.exit(1);
}

async function scanOrphans() {
  await mongoose.connect(MONGO_URI);
  const gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "files" });

  console.log("🔍 Scanning for orphaned file metadata...\n");
  const all = await File.find({}, { filename: 1, gridFsId: 1, owner: 1, size: 1 });
  const orphaned = [];

  for (const meta of all) {
    try {
      const rows = await gridfsBucket.find({ _id: meta.gridFsId }).toArray();
      if (!rows || rows.length === 0) {
        orphaned.push(meta);
        console.log(`❌ ORPHANED: ${meta.filename}`);
        console.log(`   Metadata ID: ${meta._id}`);
        console.log(`   GridFS ID: ${meta.gridFsId}`);
        console.log(`   Owner: ${meta.owner}`);
        console.log(`   Size: ${meta.size} bytes\n`);
      }
    } catch (err) {
      orphaned.push(meta);
      console.log(`❌ ORPHANED (error reading GridFS): ${meta.filename}`);
    }
  }

  console.log("\n📊 Summary");
  console.log(`   Total metadata: ${all.length}`);
  console.log(`   Valid: ${all.length - orphaned.length}`);
  console.log(`   Orphaned: ${orphaned.length}\n`);

  if (orphaned.length) {
    console.log("Run: npm run orphan:fix  (or node utils/removeOrphans.js) to delete orphaned metadata.\n");
    process.exitCode = 2; // signal orphans found
  } else {
    console.log("✅ No orphaned metadata found.\n");
  }
  await mongoose.connection.close();
}

scanOrphans().catch(err => {
  console.error("❌ Scan failed:", err.message);
  process.exit(1);
});

module.exports = scanOrphans;