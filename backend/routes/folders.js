const express = require('express');
const Folder = require('../models/Folder');
const ensureAuth = require('../middleware/auth');
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");  // for generating publicId when missing


const router = express.Router();

const File = require("../models/File");
const archiver = require("archiver");


function isSameId(a, b) {
  if (!a || !b) return false;
  return a.toString() === b.toString();
}

// Can the user at least read this folder?
function canReadFolder(folder, userId) {
  if (!folder) return false;

  // Owner can always read
  if (isSameId(folder.owner, userId)) return true;

  // Shared with them (view or edit)
  return folder.sharedWith?.some(
    (entry) => isSameId(entry.user, userId)
  );
}

// Can the user modify this folder? (rename, move, delete, etc.)
function canWriteFolder(folder, userId) {
  if (!folder) return false;

  // Owner can always write
  if (isSameId(folder.owner, userId)) return true;

  // Shared with them AND canEdit = true
  return folder.sharedWith?.some(
    (entry) => isSameId(entry.user, userId) && entry.canEdit
  );
}

// Build a path string like "/Parent/Child"
async function buildPath(name, parentId) {
  if (!parentId) {
    // root
    return `/${name}`;
  }

  const parent = await Folder.findById(parentId);

  if (!parent) {
    throw new Error("Parent folder not found");
  }

  const parentPath = parent.path || `/${parent.name}`;
  return `${parentPath}/${name}`;
}

// helper accept either publicId or mongo id
async function findFolderByAnyId(id) {
  if (!id) return null;

  // Try publicId first
  let folder = await Folder.findOne({ publicId: id });
  if (folder) {
    return ensurePublicId(folder);   // make sure publicId exists & saved
  }

  // Fallback: if it looks like an ObjectId, try _id
  if (mongoose.Types.ObjectId.isValid(id)) {
    folder = await Folder.findById(id);
    return ensurePublicId(folder);   // also backfill publicId for old docs
  }

  return null;
}

// Collect a folder and ALL its descendants
async function walkFolderTree(rootFolderId) {
  const result = [];

  async function dfs(folderId) {
    const folder = await Folder.findById(folderId);
    if (!folder) return;

    result.push(folder);

    const children = await Folder.find({
      parentFolder: folder._id,
      isDeleted: false,
    });

    for (const child of children) {
      await dfs(child._id);
    }
  }

  await dfs(rootFolderId);
  return result;                // array of Folder docs (root + all descendants)
}


let gridfsBucket;
mongoose.connection.once("open", () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "files",
  });
  console.log("✅ GridFS Bucket initialized in folders route");
});

function ensureGridFSReady(res) {
  if (!gridfsBucket) {
    res.status(503).json({ message: "File storage not initialized" });
    return false;
  }
  return true;
}



// make sure a folder has a publicId; if missing, generate and save once
async function ensurePublicId(folder) {
  if (!folder) return null;
  if (!folder.publicId) {
    folder.publicId = uuidv4();
    await folder.save();
  }
  return folder;
}



// Simple test to see if folder routes are working
router.get("/test", (req, res) => {
  res.json({ message: "Folders route working" });
});


//Create a new folder

router.post("/", ensureAuth, async (req, res) => {
  try {
    const { name, parentFolder } = req.body;
    const userId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    let parentDoc = null;
    let parentId = null;

    // If nested folder → parentFolder is a publicId (or id)
    if (parentFolder) {
      parentDoc = await findFolderByAnyId(parentFolder);

      if (!parentDoc) {
        return res.status(404).json({ message: "Parent folder not found" });
      }

      if (!canWriteFolder(parentDoc, userId)) {
        return res
          .status(403)
          .json({ message: "You do not have permission to create in this folder" });
      }

      parentId = parentDoc._id;
    }

    const path = await buildPath(name.trim(), parentId);

    const folder = new Folder({
      name: name.trim(),
      owner: userId,
      parentFolder: parentId,
      path,
    });

    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/", ensureAuth, async (req, res) => {
  try {
    const { parentFolder } = req.query;
    const userId = req.user._id;

    const rawParent =
      parentFolder && parentFolder !== "null" ? parentFolder : null;

    // ROOT VIEW (My Drive)
    if (!rawParent) {
      const folders = await Folder.find({
        parentFolder: null,
        isDeleted: false,
        $or: [{ owner: userId }, { "sharedWith.user": userId }],
      }).sort({ name: 1 });

      // ensure all children have publicId before sending back
      

      return res.json(folders);
    }

    // NON-ROOT VIEW — parentFolder is publicId (or id)
    const parent = await findFolderByAnyId(rawParent);

    if (!parent) {
      return res.status(404).json({ message: "Parent folder not found" });
    }

    if (!canReadFolder(parent, userId)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view this folder" });
    }

    const children = await Folder.find({
      parentFolder: parent._id,
      isDeleted: false,
      $or: [{ owner: userId }, { "sharedWith.user": userId }],
    }).sort({ name: 1 });

    // ⬇️ if you added something with children before this line, REMOVE it.
    res.json(children);

  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ message: "Server error" });
  }
});



// Update a folder (rename, move, trash, etc.)
router.patch("/:id", ensureAuth, async (req, res) => {
  try {
    const folderId = req.params.id;
    const userId = req.user._id;

    const {
      name,              // rename
      parentFolder,      // move to another folder
      isDeleted,         // trash or restore
      isStarred,         // star / unstar
      description,       // update description
      location           // update location (MY_DRIVE/TRASH/SHARED)
    } = req.body;
    
    const folder = await findFolderByAnyId(folderId); //fetch from db
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (!canWriteFolder(folder, userId)) {
      return res.status(403).json({ message: "You do not have permission to modify this folder" });
    }

    //apply changes

    // Rename folder
    if (typeof name === "string" && name.trim()) {
      folder.name = name.trim();
    }

    // Move folder (change parentFolder)
    if (typeof parentFolder !== "undefined") {
      if (parentFolder) {
        // parentFolder now comes as publicId (or Mongo _id) → resolve to actual ObjectId
        const newParent = await findFolderByAnyId(parentFolder);

        if (!newParent) { // ⬅️ added
          return res.status(404).json({ message: "New parent folder not found" });
        }

        // Only allow moving into folders the user can write to 
        if (!canWriteFolder(newParent, userId)) {
          return res
            .status(403)
            .json({ message: "You do not have permission to move to this folder" });
        }

        // Store the REAL parent ObjectId in DB, never the publicId
        folder.parentFolder = newParent._id;
      } else {
        // Empty string / null → move to root ("My Drive")
        folder.parentFolder = null;  // null = root
      }
    }


    // Trash / restore
    if (typeof isDeleted === "boolean") {
      folder.isDeleted = isDeleted;
      folder.location = isDeleted ? "TRASH" : "MY_DRIVE";
    }

    // Star / unstar
    if (typeof isStarred === "boolean") {
      folder.isStarred = isStarred;
    }

    // Update description
    if (typeof description === "string") {
      folder.description = description.trim();
    }

    // Update location directly (optional)
    if (typeof location === "string") {
      folder.location = location;
    }

    //Patch: every field is optional so we check them one by one

    //rebuild path if changed
    const needsPathUpdate = (typeof name === "string" && name.trim()) || (typeof parentFolder !== "undefined");
    if (needsPathUpdate) {
      folder.path = await buildPath(folder.name, folder.parentFolder);
    }

    await folder.save();
    res.json(folder);



  } catch (error) {
    console.error("Error updating folder:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Get all starred folders (for "Starred" view)
router.get("/starred", ensureAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const starredFolders = await Folder.find({
      isDeleted: false,
      isStarred: true,
      $or: [                      // owner or shared with
        { owner: userId },
        { "sharedWith.user": userId }
      ]
    }).sort({ name: 1 });

    res.json(starredFolders);
  } catch (error) {
    console.error("Error fetching starred folders:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// "Shared with me" view – folders shared *to* the current user
router.get("/shared", ensureAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const sharedFolders = await Folder.find({
      isDeleted: false,
      "sharedWith.user": userId,
      owner: { $ne: userId }   // exclude my own folders
    }).sort({ name: 1 });

    res.json(sharedFolders);
  } catch (error) {
    console.error("Error fetching shared folders:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Get all trashed folders (for "Trash" view)
router.get("/trash", ensureAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const trashedFolders = await Folder.find({
      isDeleted: true,
      $or: [
        { owner: userId },
        { "sharedWith.user": userId }
      ]
    }).sort({ updatedAt: -1 });

    res.json(trashedFolders);
  } catch (error) {
    console.error("Error fetching trashed folders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get recent folders (for "Recent" view)
router.get("/recent", ensureAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit, 10) || 20; // ?limit=10 optional

    const recentFolders = await Folder.find({
      isDeleted: false,
      $or: [
        { owner: userId },
        { "sharedWith.user": userId }
      ]
    })
      .sort({ updatedAt: -1 }) // newest first
      .limit(limit);

    res.json(recentFolders);
  } catch (error) {
    console.error("Error fetching recent folders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Search folders by name (for search bar)
router.get("/search", ensureAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({ message: "Search query (q) is required" });
    }

    const regex = new RegExp(q.trim(), "i"); // "i" = case-insensitive

    const results = await Folder.find({
      isDeleted: false,
      name: regex,
      $or: [
        { owner: userId },
        { "sharedWith.user": userId }
      ]
    }).sort({ name: 1 });

    res.json(results);
  } catch (error) {
    console.error("Error searching folders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Breadcrumb for a folder
router.get("/:id/breadcrumb", ensureAuth, async (req, res) => {
  try {
    
    const folderId = req.params.id;   // from URL /folders/:id/breadcrumb
    const userId = req.user._id;      // set by ensureAuth

        //oad the current folder
    let folder = await findFolderByAnyId(folderId);

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Make sure user is allowed to view this folder
    if (!canReadFolder(folder, userId)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view this folder" });
    }

        const chain = [];

    // Climb up: current folder → parent → grandparent → ...
    let current = folder;

    while (current) {
      // push current folder into chain
      chain.push({
        _id: current._id,
        publicId: current.publicId,
        name: current.name,
      });

      // if no parent → we've reached the top of our tree
      if (!current.parentFolder) break;

      // load parent folder
      current = await Folder.findById(current.parentFolder);

      // if parent is missing (deleted from DB), just stop to avoid crash
      if (!current) break;
    }

    // Add conceptual root: "My Drive"
    chain.push({
      _id: null,
      name: "My Drive",
    });

    //Reverse so it becomes: My Drive → ... → Current
    chain.reverse();

    // Send to frontend
    res.json(chain);




  } catch (error) {
    console.error("Error building breadcrumb:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Deep copy a folder and all its subfolders + files
router.post("/:id/copy", ensureAuth, async (req, res) => {
  try {
    const folderId = req.params.id;
    const userId = req.user._id;
    const { parentFolder, name } = req.body || {};

    const original = await findFolderByAnyId(folderId);
    if (!original) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Must at least be able to read the folder to copy it
    if (!canReadFolder(original, userId)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to copy this folder" });
    }

    // Decide where to paste the copy
    let targetParent = null;

    if (typeof parentFolder !== "undefined") {
      if (parentFolder) {
        const targetParentDoc = await findFolderByAnyId(parentFolder);
        if (!targetParentDoc) {
          return res
            .status(404)
            .json({ message: "Target parent folder not found" });
        }
        targetParent = targetParentDoc._id;
      } else {
        targetParent = null; // explicit root
      }
    } else {
      // same parent as original
      targetParent = original.parentFolder || null;
    }

    // Name for the root copied folder
    const rootCopyName =
      name && name.trim() ? name.trim() : `${original.name} (copy)`;

    // Helper: recursively copy a folder, its files, and its subfolders
    async function copyFolderTree(sourceFolder, newParentId, options = {}) {
      const { isRoot = false, overrideName = null } = options;

      const folderName = isRoot
        ? overrideName || `${sourceFolder.name} (copy)`
        : sourceFolder.name;

      const path = await buildPath(folderName, newParentId);

      const copiedFolder = new Folder({
        name: folderName,
        owner: userId, // copy belongs to current user
        parentFolder: newParentId,
        isDeleted: false,
        location: "MY_DRIVE",
        isStarred: false,
        description: sourceFolder.description,
        path,
        sharedWith: [], // copies start private
      });

      await copiedFolder.save();

      // 1) Copy all files directly inside this folder
      const filesInSource = await File.find({
        folderId: sourceFolder._id,
        isDeleted: false,
      });

      for (const file of filesInSource) {
        const fileCopy = new File({
          gridFsId: file.gridFsId,              // reuse stored bytes
          filename: file.filename,
          originalName: file.originalName,
          owner: userId,
          size: file.size,
          type: file.type,
          location: "My Drive",                 // consistent with your file model
          folderId: copiedFolder._id,
          path: Array.isArray(file.path) ? [...file.path] : [],
          isStarred: false,
          isDeleted: false,
          description: file.description || "",
          sharedWith: [],                       // new copy is private
          uploadDate: new Date(),
          lastAccessed: new Date(),
        });

        await fileCopy.save();
      }

      // 2) Recursively copy child folders
      const children = await Folder.find({
        parentFolder: sourceFolder._id,
        isDeleted: false,
      });

      for (const child of children) {
        await copyFolderTree(child, copiedFolder._id, { isRoot: false });
      }

      return copiedFolder;
    }

    // Start deep copy from root
    const rootCopy = await copyFolderTree(original, targetParent, {
      isRoot: true,
      overrideName: rootCopyName,
    });

    res.status(201).json(rootCopy);
  } catch (error) {
    console.error("Error copying folder tree:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/:id", ensureAuth, async (req, res) => {
  try {
    const folder = await findFolderByAnyId(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Must have permission to read this folder
    if (!canReadFolder(folder, req.user._id)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view this folder" });
    }

    res.json(folder);
  } catch (error) {
    console.error("Error fetching folder by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Download a whole folder (and its subfolders) as a ZIP
router.get("/:id/download", ensureAuth, async (req, res) => {
  if (!ensureGridFSReady(res)) return;

  try {
    const userId = req.user._id;
    const folder = await findFolderByAnyId(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (!canReadFolder(folder, userId)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to download this folder" });
    }

    // Collect all files in the folder tree
    const items = [];

    async function collectFolderContents(folderDoc, prefix) {
      const folderPath = prefix ? `${prefix}/${folderDoc.name}` : folderDoc.name;

      const files = await File.find({
        owner: userId,
        isDeleted: false,
        folderId: folderDoc._id,
      });

      for (const f of files) {
        const baseName = f.filename || f.originalName || "file";
        items.push({
          gridFsId: f.gridFsId,
          zipPath: `${folderPath}/${baseName}`,
        });
      }

      const children = await Folder.find({
        parentFolder: folderDoc._id,
        isDeleted: false,
      });

      for (const child of children) {
        await collectFolderContents(child, folderPath);
      }
    }

    await collectFolderContents(folder, "");

    if (items.length === 0) {
      return res
        .status(400)
        .json({ message: "This folder has no files to download" });
    }

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      console.error("Archive error:", err);
      if (!res.headersSent) {
        res.status(500).end();
      }
    });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${folder.name}.zip"`,
    });

    archive.pipe(res);

    for (const item of items) {
      const stream = gridfsBucket.openDownloadStream(item.gridFsId);
      archive.append(stream, { name: item.zipPath });
    }

    archive.finalize();
  } catch (error) {
    console.error("Error downloading folder:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error while downloading folder" });
    }
  }
});


// --- FOLDER SHARING ROUTES --------------------------------------

// Walk a folder tree and apply callbacks to each folder + file
async function walkFolderTree(rootFolderId, visitFolder, visitFile) {
  const queue = [rootFolderId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const folder = await Folder.findById(currentId);
    if (!folder) continue;

    if (visitFolder) {
      await visitFolder(folder);
    }

    // All files directly inside this folder
    if (visitFile) {
      const files = await File.find({
        folderId: folder._id,
        isDeleted: false,
      });

      for (const f of files) {
        await visitFile(f);
      }
    }

    // Enqueue child folders
    const children = await Folder.find({
      parentFolder: folder._id,
      isDeleted: false,
    });

    for (const child of children) {
      queue.push(child._id);
    }
  }
}

// PATCH /folders/:id/share
// Share a folder (and everything inside it) with a user
router.patch("/:id/share", ensureAuth, async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { userId, canEdit } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const folder = await findFolderByAnyId(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Only someone who can write to the folder can share it
    if (!canWriteFolder(folder, ownerId)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to share this folder" });
    }

    const targetUserId = userId.toString();
    const canEditBool = !!canEdit;

    await walkFolderTree(
      folder._id,
      async (f) => {
        const existing = (f.sharedWith || []).find(
          (entry) => entry.user.toString() === targetUserId
        );

        if (existing) {
          existing.canEdit = canEditBool;
        } else {
          f.sharedWith.push({
            user: targetUserId,
            canEdit: canEditBool,
          });
        }

        await f.save();
      },
      async (file) => {
        // For files, map canEdit → "read" | "write"
        const perm = canEditBool ? "write" : "read";
        const existing = (file.sharedWith || []).find(
          (entry) => entry.user.toString() === targetUserId
        );

        if (existing) {
          existing.permission = perm;
        } else {
          file.sharedWith.push({
            user: targetUserId,
            permission: perm,
          });
        }

        await file.save();
      }
    );

    const updatedRoot = await Folder.findById(folder._id);
    res.json({ message: "Folder shared", folder: updatedRoot });
  } catch (err) {
    console.error("Error in PATCH /folders/:id/share:", err);
    res.status(500).json({ message: "Error sharing folder" });
  }
});

// PATCH /folders/:id/unshare
// Remove a user from sharedWith for this folder and all its contents
router.patch("/:id/unshare", ensureAuth, async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const folder = await findFolderByAnyId(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (!canWriteFolder(folder, ownerId)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to modify sharing" });
    }

    const targetUserId = userId.toString();

    await walkFolderTree(
      folder._id,
      async (f) => {
        f.sharedWith = (f.sharedWith || []).filter(
          (entry) => entry.user.toString() !== targetUserId
        );
        await f.save();
      },
      async (file) => {
        file.sharedWith = (file.sharedWith || []).filter(
          (entry) => entry.user.toString() !== targetUserId
        );
        await file.save();
      }
    );

    const updatedRoot = await Folder.findById(folder._id);
    res.json({ message: "User unshared from folder", folder: updatedRoot });
  } catch (err) {
    console.error("Error in PATCH /folders/:id/unshare:", err);
    res.status(500).json({ message: "Error unsharing folder" });
  }
});

// PATCH /folders/:id/permission
// Change canEdit for a user on this folder + everything inside
router.patch("/:id/permission", ensureAuth, async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { userId, canEdit } = req.body;

    if (!userId || typeof canEdit === "undefined") {
      return res
        .status(400)
        .json({ message: "userId and canEdit are required" });
    }

    const folder = await findFolderByAnyId(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (!canWriteFolder(folder, ownerId)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to modify sharing" });
    }

    const targetUserId = userId.toString();
    const canEditBool = !!canEdit;

    await walkFolderTree(
      folder._id,
      async (f) => {
        const entry = (f.sharedWith || []).find(
          (e) => e.user.toString() === targetUserId
        );
        if (entry) {
          entry.canEdit = canEditBool;
          await f.save();
        }
      },
      async (file) => {
        const perm = canEditBool ? "write" : "read";
        const entry = (file.sharedWith || []).find(
          (e) => e.user.toString() === targetUserId
        );
        if (entry) {
          entry.permission = perm;
          await file.save();
        }
      }
    );

    const updatedRoot = await Folder.findById(folder._id);
    res.json({ message: "Folder permissions updated", folder: updatedRoot });
  } catch (err) {
    console.error("Error in PATCH /folders/:id/permission:", err);
    res.status(500).json({ message: "Error updating folder permission" });
  }
});



module.exports = router;