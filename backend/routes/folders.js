const express = require('express');
const Folder = require('../models/Folder');
const ensureAuth = require('../middleware/auth');

const router = express.Router();

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


// Simple test to see if folder routes are working
router.get("/test", (req, res) => {
  res.json({ message: "Folders route working" });
});


//Create a new folder

router.post("/", ensureAuth, async (req, res) => {
  try {
    const { name, parentFolder } = req.body;
    const userId = req.user._id;          // clearer name
    const parentId = parentFolder || null; // so we use the same variable everywhere


    // validate
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    let parentDoc = null;

    // If nested folder → check write permission on parent
    if (parentId) {
      parentDoc = await Folder.findById(parentId);

      if (!parentDoc) {
        return res.status(404).json({ message: "Parent folder not found" });
      }

      if (!canWriteFolder(parentDoc, userId)) {
        return res
          .status(403)
          .json({ message: "You do not have permission to create in this folder" });
      }
    }

    const path = await buildPath(name.trim(), parentId);

      const folder = new Folder({
        name: name.trim(),
        owner: userId,
        parentFolder: parentId,
        path,
      });

    //return created folder to frontend
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

    const parentId =
      parentFolder && parentFolder !== "null" ? parentFolder : null;

    // ROOT VIEW (My Drive)
    if (!parentId) {
      const folders = await Folder.find({
        parentFolder: null,
        isDeleted: false,
        $or: [
          { owner: userId },
          { "sharedWith.user": userId }
        ]
      }).sort({ name: 1 });

      return res.json(folders);
    }

    // NON-ROOT VIEW — check permission for parent folder
    const parent = await Folder.findById(parentId);

    if (!parent) {
      return res.status(404).json({ message: "Parent folder not found" });
    }

    if (!canReadFolder(parent, userId)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view this folder" });
    }

    // List children the user can see (owned or shared)
    const children = await Folder.find({
      parentFolder: parentId,
      isDeleted: false,
      $or: [
        { owner: userId },
        { "sharedWith.user": userId }
      ]
    }).sort({ name: 1 });

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
    
    const folder = await Folder.findById(folderId); //fetch from db
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
      folder.parentFolder = parentFolder || null;  // null = root
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


// Get a single folder by ID (for info panel, renaming dialogs, checking permissions on single folder ) hala2 its not needed but later it will be so I did it now
router.get("/:id", ensureAuth, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);

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


// Breadcrumb for a folder
router.get("/:id/breadcrumb", ensureAuth, async (req, res) => {
  try {
    
    const folderId = req.params.id;   // from URL /folders/:id/breadcrumb
    const userId = req.user._id;      // set by ensureAuth

        //oad the current folder
    let folder = await Folder.findById(folderId);

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

// Deep copy a folder and all its subfolders
router.post("/:id/copy", ensureAuth, async (req, res) => {
  try {
    const folderId = req.params.id;
    const userId = req.user._id;
    const { parentFolder, name } = req.body || {};

    const original = await Folder.findById(folderId);
    if (!original) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Must at least be able to read the folder to copy it
    if (!canReadFolder(original, userId)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to copy this folder" });
    }

    // Decide where to paste the copy:
    // - If parentFolder is provided in body → use that (or null for root)
    // - Else → use original.parentFolder (copy next to original)
    const targetParent =
      typeof parentFolder !== "undefined"
        ? parentFolder || null
        : original.parentFolder || null;

    // Name of the root copied folder
    const rootCopyName =
      name && name.trim() ? name.trim() : `${original.name} (copy)`;

    // Helper: recursively copy a folder and its subfolders
    async function copyFolderTree(sourceFolder, newParentId, options = {}) {
      const {
        isRoot = false,
        overrideName = null,
      } = options;

      // Decide the name for this particular copied folder
      const folderName = isRoot
        ? overrideName || `${sourceFolder.name} (copy)`
        : sourceFolder.name;

      // Build path for the copied folder (using the new parent)
      const path = await buildPath(folderName, newParentId);

      const copiedFolder = new Folder({
        name: folderName,
        owner: userId,                      // copy belongs to current user
        parentFolder: newParentId,
        isDeleted: false,
        location: "MY_DRIVE",
        isStarred: false,                   // usually copies are not starred
        description: sourceFolder.description,
        path,
        sharedWith: [],                     // copies start as private
      });

      await copiedFolder.save();

      // TODO: when you have a File model:
      // - find all files with parentFolder = sourceFolder._id
      // - create new files pointing to copiedFolder._id
      // For now we only copy the folder hierarchy.

      // Find direct child folders of this source folder
      const children = await Folder.find({
        parentFolder: sourceFolder._id,
        isDeleted: false, // usually don't copy trashed children
      });

      // Recursively copy each child under the new copied folder
      for (const child of children) {
        await copyFolderTree(child, copiedFolder._id, {
          isRoot: false,
        });
      }

      return copiedFolder;
    }

    // Start the deep copy from the original folder as the "root"
    const rootCopy = await copyFolderTree(original, targetParent, {
      isRoot: true,
      overrideName: rootCopyName,
    });

    // Return the root copied folder (front-end can reload its view after)
    res.status(201).json(rootCopy);
  } catch (error) {
    console.error("Error copying folder tree:", error);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;