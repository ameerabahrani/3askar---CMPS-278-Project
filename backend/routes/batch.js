const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const File = require("../models/File");
const Folder = require("../models/Folder");
const User = require("../models/User");
const updateStorage = require("../utils/storage");
const archiver = require("archiver");

// Helper to check if user owns the item or has permission
const isOwner = (item, userId) => item.owner.toString() === userId.toString();

// Initialize GridFS Bucket
let gridfsBucket;
mongoose.connection.once("open", () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "files",
  });
});

// POST /batch/trash
// Move items to trash or restore them
router.post("/trash", async (req, res) => {
  try {
    const { fileIds = [], folderIds = [], isDeleted } = req.body;
    const userId = req.user._id;

    if (typeof isDeleted !== "boolean") {
      return res.status(400).json({ message: "isDeleted must be a boolean" });
    }

    const location = isDeleted ? "TRASH" : "MY_DRIVE";

    // Update Files
    if (fileIds.length > 0) {
      await File.updateMany(
        { _id: { $in: fileIds }, owner: userId },
        { $set: { isDeleted, location } }
      );
    }

    // Update Folders
    if (folderIds.length > 0) {
      await Folder.updateMany(
        { _id: { $in: folderIds }, owner: userId },
        { $set: { isDeleted, location } }
      );
    }

    res.json({ message: `Items ${isDeleted ? "moved to trash" : "restored"}` });
  } catch (err) {
    console.error("Batch trash error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /batch/star
// Star or unstar items
router.post("/star", async (req, res) => {
  try {
    const { fileIds = [], folderIds = [], isStarred } = req.body;
    const userId = req.user._id;

    if (typeof isStarred !== "boolean") {
      return res.status(400).json({ message: "isStarred must be a boolean" });
    }

    // Update Files
    if (fileIds.length > 0) {
      await File.updateMany(
        { _id: { $in: fileIds }, owner: userId },
        { $set: { isStarred } }
      );
    }

    // Update Folders
    if (folderIds.length > 0) {
      await Folder.updateMany(
        { _id: { $in: folderIds }, owner: userId },
        { $set: { isStarred } }
      );
    }

    res.json({ message: `Items ${isStarred ? "starred" : "unstarred"}` });
  } catch (err) {
    console.error("Batch star error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /batch/delete
// Permanently delete items
router.post("/delete", async (req, res) => {
  try {
    const { fileIds = [], folderIds = [] } = req.body;
    const userId = req.user._id;

    // 1. Delete Files
    if (fileIds.length > 0) {
      const files = await File.find({ _id: { $in: fileIds }, owner: userId });

      for (const file of files) {
        try {
          // Remove from GridFS
          if (file.gridFsId) {
            // Check if file exists in GridFS before deleting
            const gridFiles = await gridfsBucket.find({ _id: file.gridFsId }).toArray();
            if (gridFiles.length > 0) {
              await gridfsBucket.delete(file.gridFsId);
              // Update storage
              await updateStorage(userId, gridFiles[0].length, "remove");
            }
          }
          // Remove metadata
          await File.deleteOne({ _id: file._id });
        } catch (e) {
          console.error(`Failed to delete file ${file._id}:`, e);
        }
      }
    }

    // 2. Delete Folders (Recursive)
    if (folderIds.length > 0) {
      const deleteFolderRecursively = async (folderId) => {
        // Find all children folders
        const childrenFolders = await Folder.find({ parentFolder: folderId, owner: userId });
        for (const child of childrenFolders) {
          await deleteFolderRecursively(child._id);
        }

        // Find all children files
        const childrenFiles = await File.find({ folderId: folderId, owner: userId });
        for (const file of childrenFiles) {
          try {
            if (file.gridFsId) {
              const gridFiles = await gridfsBucket.find({ _id: file.gridFsId }).toArray();
              if (gridFiles.length > 0) {
                await gridfsBucket.delete(file.gridFsId);
                await updateStorage(userId, gridFiles[0].length, "remove");
              }
            }
            await File.deleteOne({ _id: file._id });
          } catch (e) {
            console.error(`Failed to delete child file ${file._id}:`, e);
          }
        }

        // Delete the folder itself
        await Folder.deleteOne({ _id: folderId });
      };

      for (const folderId of folderIds) {
        // Verify ownership before deleting
        const folder = await Folder.findOne({ _id: folderId, owner: userId });
        if (folder) {
          await deleteFolderRecursively(folder._id);
        }
      }
    }

    res.json({ message: "Items permanently deleted" });
  } catch (err) {
    console.error("Batch delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /batch/move
// Move items to a new folder
router.post("/move", async (req, res) => {
  try {
    const { fileIds = [], folderIds = [], destinationFolderId } = req.body;
    const userId = req.user._id;

    let newParentId = null; // null -> root move
    let newPathPrefix = ""; // used for folder path updates

    if (destinationFolderId) {
      // Determine if this looks like a valid ObjectId before querying _id
      let destFolder = null;
      const isObjId = mongoose.Types.ObjectId.isValid(destinationFolderId);
      if (isObjId) {
        destFolder = await Folder.findById(destinationFolderId);
      }
      // If not found by _id (or not a valid ObjectId), attempt by publicId
      if (!destFolder) {
        destFolder = await Folder.findOne({ publicId: destinationFolderId });
      }
      if (!destFolder) {
        return res.status(404).json({ message: "Destination folder not found" });
      }
      newParentId = destFolder._id;
      newPathPrefix = destFolder.path || "";
    }

    // Update Files
    if (fileIds.length > 0) {
      await File.updateMany(
        { _id: { $in: fileIds }, owner: userId },
        {
          $set: {
            folderId: newParentId,
            path: []
          }
        }
      );
    }

    // Update Folders
    if (folderIds.length > 0) {
      for (const folderId of folderIds) {
        const folder = await Folder.findOne({ _id: folderId, owner: userId });
        if (!folder) continue;

        folder.parentFolder = newParentId;
        folder.path = newPathPrefix ? `${newPathPrefix}/${folder.name}` : `/${folder.name}`;

        await folder.save();
      }
    }

    res.json({ message: "Items moved" });
  } catch (err) {
    console.error("Batch move error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /batch/download
// Download multiple items as a zip
router.post("/download", async (req, res) => {
  if (!gridfsBucket) {
    return res.status(503).json({ message: "File storage not initialized" });
  }
  try {
    const { fileIds = [], folderIds = [] } = req.body;
    const userId = req.user._id;

    if (fileIds.length === 0 && folderIds.length === 0) {
      return res.status(400).json({ message: "No items selected" });
    }

    const items = [];

    if (fileIds.length > 0) {
      const files = await File.find({
        _id: { $in: fileIds },
        $or: [
          { owner: userId },
          { sharedWith: { $elemMatch: { user: userId } } }
        ]
      });
      for (const f of files) {
        if (f.gridFsId) {
          items.push({
            gridFsId: f.gridFsId,
            zipPath: f.filename || f.originalName || "file"
          });
        }
      }
    }

    if (folderIds.length > 0) {
      const folders = await Folder.find({
        _id: { $in: folderIds },
        $or: [
          { owner: userId },
          { sharedWith: { $elemMatch: { user: userId } } }
        ]
      });

      async function collectFolderContents(folderDoc, prefix) {
        const folderPath = prefix ? `${prefix}/${folderDoc.name}` : folderDoc.name;
        const files = await File.find({
          folderId: folderDoc._id,
          isDeleted: false,
          $or: [
            { owner: userId },
            { sharedWith: { $elemMatch: { user: userId } } }
          ]
        });
        for (const f of files) {
          if (f.gridFsId) {
            const baseName = f.filename || f.originalName || "file";
            items.push({
              gridFsId: f.gridFsId,
              zipPath: `${folderPath}/${baseName}`
            });
          }
        }
        const children = await Folder.find({
          parentFolder: folderDoc._id,
          isDeleted: false,
          $or: [
            { owner: userId },
            { sharedWith: { $elemMatch: { user: userId } } }
          ]
        });
        for (const child of children) {
          await collectFolderContents(child, folderPath);
        }
      }
      for (const folder of folders) {
        await collectFolderContents(folder, "");
      }
    }

    if (items.length === 0) {
      return res.status(404).json({ message: "No accessible files found" });
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      if (!res.headersSent) res.status(500).end();
    });
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=\"batch-download.zip\""
    });
    archive.pipe(res);
    for (const item of items) {
      const stream = gridfsBucket.openDownloadStream(item.gridFsId);
      archive.append(stream, { name: item.zipPath });
    }
    archive.finalize();
  } catch (err) {
    console.error("Batch download error:", err);
    if (!res.headersSent) res.status(500).json({ message: "Server error" });
  }
});

// POST /batch/share
// Share multiple items with a user
router.post("/share", async (req, res) => {
  try {
    const { fileIds = [], folderIds = [], userId, permission } = req.body;
    const ownerId = req.user._id;

    if (!userId || !permission) {
      return res.status(400).json({ message: "Missing userId or permission" });
    }

    if (!["read", "write"].includes(permission)) {
      return res.status(400).json({ message: "Invalid permission" });
    }

    // 1. Share Files
    if (fileIds.length > 0) {
      const files = await File.find({ _id: { $in: fileIds }, owner: ownerId });
      for (const file of files) {
        const existing = file.sharedWith.find(x => x.user.toString() === userId);
        if (existing) {
          existing.permission = permission;
        } else {
          file.sharedWith.push({ user: userId, permission });
        }
        await file.save();
      }
    }

    // 2. Share Folders
    if (folderIds.length > 0) {
      const folders = await Folder.find({ _id: { $in: folderIds }, owner: ownerId });
      for (const folder of folders) {
        const existing = folder.sharedWith.find(x => x.user.toString() === userId);
        if (existing) {
          existing.permission = permission;
        } else {
          folder.sharedWith.push({ user: userId, permission });
        }
        await folder.save();
      }
    }

    res.json({ message: "Items shared successfully" });

  } catch (err) {
    console.error("Batch share error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /batch/copy
// Copy multiple files (folders skipped for now)
router.post("/copy", async (req, res) => {
  try {
    const { fileIds = [], folderIds = [] } = req.body;
    const userId = req.user._id;

    if (!gridfsBucket) {
      return res.status(503).json({ message: "File storage not initialized" });
    }

    let copiedCount = 0;

    // 1. Copy Files
    if (fileIds.length > 0) {
      const files = await File.find({ _id: { $in: fileIds }, owner: userId });

      for (const original of files) {
        if (!original.gridFsId) continue;

        try {
          const [gridFile] = await gridfsBucket.find({ _id: original.gridFsId }).toArray();
          if (!gridFile) continue;

          const sizeBytes = gridFile.length ?? original.size ?? 0;
          const copyName = `Copy of ${original.filename || "Untitled"}`;

          const newGridFsId = await new Promise((resolve, reject) => {
            const timestamp = new Date();
            const uploadStream = gridfsBucket.openUploadStream(copyName, {
              contentType: original.type,
              metadata: {
                owner: new mongoose.Types.ObjectId(userId),
                copiedFrom: original.gridFsId,
                copiedAt: timestamp,
              },
            });
            const downloadStream = gridfsBucket.openDownloadStream(original.gridFsId);

            downloadStream.on("error", reject);
            uploadStream.on("error", reject);
            uploadStream.on("finish", () => resolve(uploadStream.id));

            downloadStream.pipe(uploadStream);
          });

          if (sizeBytes > 0) {
            await updateStorage(userId, sizeBytes, "add");
          }

          const fileCopy = new File({
            gridFsId: newGridFsId,
            filename: copyName,
            originalName: original.originalName || original.filename,
            owner: userId,
            size: original.size || sizeBytes,
            type: original.type,
            location: original.location || "My Drive",
            folderId: original.folderId,
            path: Array.isArray(original.path) ? [...original.path] : [],
            isStarred: false,
            isDeleted: false,
            description: original.description || "",
            sharedWith: [],
          });

          await fileCopy.save();
          copiedCount++;

        } catch (e) {
          console.error(`Failed to copy file ${original._id}:`, e);
        }
      }
    }

    // Folders are skipped for now as per plan

    res.json({
      message: `Copied ${copiedCount} files. Folders were skipped.`,
      copiedCount
    });

  } catch (err) {
    console.error("Batch copy error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
