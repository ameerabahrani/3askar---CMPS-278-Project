require("dotenv").config();
const mongoose = require("mongoose");
const File = require("./models/File");

async function removeOrphanedFiles() {
    console.log("Connecting to MongoDB...");
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    console.log("✅ Connected to MongoDB\n");
    console.log("🔍 Finding orphaned file metadata...\n");

    // Get GridFS bucket
    const gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: "files",
    });

    // Get all file metadata
    const allFiles = await File.find({});
    const orphanedFiles = [];

    // Check each file
    for (const fileMeta of allFiles) {
        try {
            const gridFiles = await gridfsBucket.find({ _id: fileMeta.gridFsId }).toArray();
            
            if (!gridFiles || gridFiles.length === 0) {
                orphanedFiles.push(fileMeta);
            }
        } catch (err) {
            orphanedFiles.push(fileMeta);
        }
    }

    console.log(`Found ${orphanedFiles.length} orphaned files\n`);

    if (orphanedFiles.length === 0) {
        console.log("✅ Nothing to remove!\n");
        mongoose.connection.close();
        return;
    }

    // Show what will be removed
    console.log("🗑️  Will remove:");
    orphanedFiles.forEach(f => {
        console.log(`   - ${f.filename} (ID: ${f._id})`);
    });

    console.log("\n🧹 Removing orphaned metadata...");
    
    const orphanedIds = orphanedFiles.map(f => f._id);
    const result = await File.deleteMany({ _id: { $in: orphanedIds } });
    
    console.log(`✅ Removed ${result.deletedCount} orphaned file records\n`);

    mongoose.connection.close();
}

removeOrphanedFiles()
    .then(() => {
        console.log("✅ Cleanup complete");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error:", err.message);
        console.error(err);
        process.exit(1);
    });
