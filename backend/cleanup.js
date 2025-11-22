require("dotenv").config();
const mongoose = require("mongoose");
const File = require("./models/File");

async function findOrphanedFiles() {
    console.log("Connecting to MongoDB...");
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    console.log("✅ Connected to MongoDB\n");
    console.log("🔍 Searching for orphaned file metadata...\n");

    // Get GridFS bucket
    const gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: "files",
    });

    // Get all file metadata
    const allFiles = await File.find({});
    console.log(`Found ${allFiles.length} file metadata records in database\n`);

    const orphanedFiles = [];
    const validFiles = [];

    // Check each file
    for (const fileMeta of allFiles) {
        try {
            const gridFiles = await gridfsBucket.find({ _id: fileMeta.gridFsId }).toArray();
            
            if (!gridFiles || gridFiles.length === 0) {
                orphanedFiles.push(fileMeta);
                console.log(`❌ ORPHANED: ${fileMeta.filename}`);
                console.log(`   ID: ${fileMeta._id}`);
                console.log(`   GridFS ID: ${fileMeta.gridFsId}`);
                console.log(`   Owner: ${fileMeta.owner}`);
                console.log(`   Size: ${fileMeta.size} bytes\n`);
            } else {
                validFiles.push(fileMeta);
            }
        } catch (err) {
            console.error(`❌ Error checking file ${fileMeta._id}:`, err.message);
            orphanedFiles.push(fileMeta);
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Valid files: ${validFiles.length}`);
    console.log(`   ❌ Orphaned files: ${orphanedFiles.length}\n`);

    if (orphanedFiles.length > 0) {
        console.log(`⚠️  To remove orphaned files, run:`);
        console.log(`   node removeOrphaned.js\n`);
    } else {
        console.log(`✅ No orphaned files found!\n`);
    }

    mongoose.connection.close();
    return orphanedFiles;
}

findOrphanedFiles()
    .then(() => {
        console.log("✅ Scan complete");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error:", err.message);
        console.error(err);
        process.exit(1);
    });
