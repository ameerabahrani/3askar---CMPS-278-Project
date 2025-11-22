const mongoose = require("mongoose");
const File = require("../models/File");

/**
 * Utility script to find and optionally remove orphaned file metadata
 * (files that exist in the File collection but not in GridFS)
 * 
 * Usage: node utils/cleanupOrphanedFiles.js [--dry-run|--fix]
 */

async function cleanupOrphanedFiles(dryRun = true) {
    try {
        // Get GridFS bucket
        const gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: "files",
        });

        console.log("🔍 Searching for orphaned file metadata...\n");

        // Get all file metadata
        const allFiles = await File.find({});
        console.log(`Found ${allFiles.length} file metadata records in database`);

        const orphanedFiles = [];
        const validFiles = [];

        // Check each file to see if it exists in GridFS
        for (const fileMeta of allFiles) {
            try {
                const gridFiles = await gridfsBucket.find({ _id: fileMeta.gridFsId }).toArray();
                
                if (!gridFiles || gridFiles.length === 0) {
                    orphanedFiles.push(fileMeta);
                    console.log(`❌ ORPHANED: ${fileMeta.filename} (ID: ${fileMeta._id}, GridFS ID: ${fileMeta.gridFsId})`);
                } else {
                    validFiles.push(fileMeta);
                }
            } catch (err) {
                console.error(`Error checking file ${fileMeta._id}:`, err.message);
                orphanedFiles.push(fileMeta);
            }
        }

        console.log(`\n📊 Results:`);
        console.log(`   ✅ Valid files: ${validFiles.length}`);
        console.log(`   ❌ Orphaned files: ${orphanedFiles.length}`);

        if (orphanedFiles.length > 0) {
            console.log(`\n🗑️  Orphaned files:`);
            orphanedFiles.forEach(f => {
                console.log(`   - ${f.filename} (Owner: ${f.owner}, Size: ${f.size} bytes)`);
            });

            if (!dryRun) {
                console.log(`\n🧹 Removing orphaned metadata...`);
                const orphanedIds = orphanedFiles.map(f => f._id);
                const result = await File.deleteMany({ _id: { $in: orphanedIds } });
                console.log(`✅ Removed ${result.deletedCount} orphaned file records`);
            } else {
                console.log(`\n⚠️  DRY RUN mode - no changes made`);
                console.log(`   Run with --fix flag to remove orphaned files`);
            }
        } else {
            console.log(`\n✅ No orphaned files found!`);
        }

        return { validFiles, orphanedFiles };

    } catch (err) {
        console.error("❌ Error during cleanup:", err);
        throw err;
    }
}

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const dryRun = !args.includes("--fix");

    if (args.includes("--help") || args.includes("-h")) {
        console.log(`
Usage: node utils/cleanupOrphanedFiles.js [OPTIONS]

Options:
  --dry-run    Show orphaned files without removing them (default)
  --fix        Actually remove orphaned file metadata
  --help, -h   Show this help message

Examples:
  node utils/cleanupOrphanedFiles.js           # Dry run
  node utils/cleanupOrphanedFiles.js --dry-run # Dry run (explicit)
  node utils/cleanupOrphanedFiles.js --fix     # Remove orphaned files
        `);
        process.exit(0);
    }

    require("../config/db"); // Connect to database

    mongoose.connection.once("open", async () => {
        console.log("✅ Connected to MongoDB\n");
        
        try {
            await cleanupOrphanedFiles(dryRun);
            console.log("\n✅ Cleanup complete");
            process.exit(0);
        } catch (err) {
            console.error("\n❌ Cleanup failed:", err);
            process.exit(1);
        }
    });

    mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });
}

module.exports = cleanupOrphanedFiles;
