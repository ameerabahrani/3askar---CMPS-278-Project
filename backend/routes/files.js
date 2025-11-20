// Helper to check GridFS readiness
function ensureGridFSReady(res) {
    if (!gridfsBucket) {
        res.status(503).json({ message: "GridFS Bucket not initialized" });
        return false;
    }
    return true;
}
const express = require('express');
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types; // to handle ObjectId conversion
const { Readable } = require("stream"); // to convert buffer to stream for GridFS
const { read } = require('fs');
const updateStorage = require('../utils/storage');
const File = require("../models/File");
const User = require("../models/User");
const Folder = require("../models/Folder");


const OWNER_FIELDS = "name email picture";
const SHARED_WITH_POPULATE = { path: "sharedWith.user", select: OWNER_FIELDS };

async function findFolderByAnyId(id) {
  if (!id) return null;

  // Try publicId first
  let folder = await Folder.findOne({ publicId: id });
  if (folder) return folder;

  // Fallback: try Mongo ObjectId
  if (mongoose.Types.ObjectId.isValid(id)) {
    folder = await Folder.findById(id);
  }

  return folder;
}


let gridfsBucket; 
// once mongoose connection is open, initialize GridFS bucket to make sure it's ready before handling requests
mongoose.connection.once("open", () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: "files",
    });
    console.log("âœ… GridFS Bucket initialized in files route");
});

// router.use((req, res, next) => { //for testing with Postman
//   req.user = { _id: new ObjectId("676f2ac5308f1a22222a1ce4") }; 
//   next();
// });


//______________________________________
//POST /files/upload 
//1. multer accepts a file from client (uploads it into memory)
//2. streams it into GridFS (gridfs splits the file into chunks and stores it in mongodb)
//3. updates user's storageUsed field 
//4. returns basic info so metadata can be created 
//______________________________________

router.post("/upload", upload.single("file"), async (req, res) => {

    if (!ensureGridFSReady(res)) return;
    try {
        if (!req.user){
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const { originalname, mimetype, size, buffer } = req.file;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.storageLimit && user.storageUsed + size > user.storageLimit) {
            return res.status(400).json({ message: "Storage limit exceeded" });
        }
        const readStream = Readable.from(buffer);
        const uploadStream = gridfsBucket.openUploadStream(originalname, {
            contentType: mimetype,
            metadata: {
                owner: new ObjectId(req.user._id),
                uploadedAt: new Date(),
            },
        });
        uploadStream.on("finish", async () => {
            try {
                const realId = uploadStream.id;
                console.log("UPLOAD FINISHED â€” REAL GRIDFS ID:", realId);
                const files = await gridfsBucket.find({ _id: realId }).toArray();
                const dbFile = files[0];
                if (!dbFile) {
                    console.log("GridFS lookup failed for ID:", realId);
                    return res.status(500).json({ message: "GridFS lookup failed" });
                }
                await updateStorage(req.user._id, dbFile.length, "add");
                res.status(201).json({
                    message: "File uploaded to GridFS",
                    fileId: dbFile._id,
                    filename: dbFile.filename,
                    length: dbFile.length,
                    contentType: dbFile.contentType,
                    extension: dbFile.filename.includes(".")
                        ? dbFile.filename.substring(dbFile.filename.lastIndexOf("."))
                        : "",
                });
            } catch (err) {
                console.error("Error in finish handler:", err);
                res.status(500).json({ message: "Error finalizing upload" });
            }
        });
        uploadStream.on("error", (err) => {
            console.error("Error uploading file to GridFS:", err);
            res.status(500).json({ message: "Upload failed"});
        });
        readStream.pipe(uploadStream);
    } catch (err) {
        console.error("Error in /files/upload:", err);
        res.status(500).json({ message: "Server error during file upload" });
    }
});

//______________________________________
// GET /files/:id/download
// 1. validate fileId
// 2. Look up file metadata in GridFS by fileId
// 3. Stream file back to client
// 4. Update lastAccessed in metadata
//______________________________________

router.get("/:id/download", async (req, res) => {
    if (!ensureGridFSReady(res)) return;
    try {
        const fileId = req.params.id;
        let objectId;
        try {
            objectId = new ObjectId(fileId); //tries to convert to ObjectId, will throw error if invalid
        } catch (err) {
            return res.status(400).json({ message: "Invalid file ID format" });
        }

        const files = await gridfsBucket.find({ _id: objectId }).toArray();    
        if (!files || files.length === 0) {
            return res.status(404).json({ message: "File not found" });
        }
        const file = files[0]; // GridFS metadata

        // ðŸ”¹ Update lastAccessed in our File metadata collection
        if (req.user) {
            await File.updateOne(
                { gridFsId: objectId, owner: req.user._id },
                { $set: { lastAccessed: new Date() } }
            );
        }

        const readStream = gridfsBucket.openDownloadStream(objectId);
        res.set({
            "Content-Type": file.contentType,
            "Content-Disposition": `attachment; filename="${file.filename}"`,    
        });
        readStream.pipe(res); //stream the file back to client

        readStream.on("error", (err) => {
            console.error("Error streaming file back to client.", err); 
            res.status(500).json({ message: "Error reading file" });
        });

    } catch (err) {
        console.error("Error in /files/:id/download:", err);
        res.status(500).json({ message: "Server error during file download" });
    }
});

//_______________________________
// DELETE /files/:id
//1. validate field
//2. find file in gridfs
//3. subtract file.length from user.storageUsed
//4. delete file form gridfs and return message
//_______________________________

router.delete("/:id", async (req, res) =>{
    if (!ensureGridFSReady(res)) return;
    try{
        // req.user = { _id: new ObjectId() }; // TEMPORARY for Postman
        // console.log("âž¡ï¸ DELETE ROUTE REACHED");
        // console.log("fileId =", req.params.id);
        // console.log("req.user =", req.user);
        // console.log("gridfsBucket =", gridfsBucket);

        const fileId = req.params.id;
        let objectId; 
        try{
            // req.user = { _id: new ObjectId("676f2ac5308f1a22222a1ce4") }; //temp for postman
            objectId = new ObjectId(fileId);
        }catch(err){
            return res.status(400).json({ message: "Invalid file ID format" });
        }

        const files = await gridfsBucket.find({_id: objectId}).toArray(); 
        console.log("files =", files);
        
        if(!files || files.length === 0 ){
            return res.status(404).json({ message: "File not found" });
        }

        const file = files[0];  
        console.log("Deleting file length:", file.length);
        console.log("File _id:", file._id);


        await updateStorage(req.user._id, file.length, "remove");
        gridfsBucket.delete(objectId, (err) => {
            if(err){
                console.error("Error deleting file.");
                res.status(500).json({message: "File deletion error" });
             }else{
                 res.status(200).json({ message: "File deleted successfully."}); 
            }
        });
        

    }catch(err){
        console.error("Error in /files/:id", err);
        res.status(500).json({ message: "Server error during file deletion" });
    }
});

//____________
// saveMetadata : API endpoint that frontend will call after file bytes are uploaded to gridFs
// 1. validate required fields
// 2. check gridfs file exists
// 3. create file metadata document
// 4. save in mongodb
// 5. respond
//____________
router.post("/saveMetadata", async (req, res) => {
    if (!ensureGridFSReady(res)) return;
    try {
        console.log("âž¡ï¸ /files/saveMetadata route reached"); //debugging
        // req.user  ={_id: new ObjectId() }; // TEMPORARY for Postman

        if (!req.user){
            return res.status(401).json({ message: "Not authenticated" });
        }

        const {
            gridFsId,
            originalName,
            filename,
            size,
            type,
            folderId,
            location,
            path,
            isStarred,
            isDeleted,
            description,
            sharedWith
        } = req.body;

        //1. validate required fields
        if(!gridFsId || !originalName || !filename || !size){
            return res.status(400).json({ message: "Missing required fields" });
        }

        //2. check gridfs file exists
        const objectId = new ObjectId(gridFsId); 
        const files = await gridfsBucket.find({_id: objectId}).toArray();
        if(!files || files.length === 0 ){
            return res.status(404).json({ message: "File not found in GridFS" });

        }

        // resolve folderId (can be publicId or _id coming from frontend)
        let folderObjectId = null;
        if (folderId) {
        const folderDoc = await findFolderByAnyId(folderId);
        if (!folderDoc) {
            return res.status(400).json({ message: "Invalid folderId" });
        }
        folderObjectId = folderDoc._id;
        }


        //3. create file metadata document
        const newFile = new File({
            gridFsId: objectId,
            originalName,
            filename,
            owner: req.user._id, // temporary user
            size,
            type,
            folderId: folderObjectId,
            location: location || "My Drive",
            path: path || [],
            isStarred: isStarred || false,
            isDeleted: isDeleted || false,
            description: description || "",
            sharedWith: sharedWith || []
        });

        // Step 4: Save in MongoDB
        const savedFile = await newFile.save();
        const populatedFile = await savedFile.populate([
            { path: "owner", select: OWNER_FIELDS },
            SHARED_WITH_POPULATE,
        ]);
        
        // Step 5: Respond
        res.status(201).json({
            message: "Metadata saved",
            file: populatedFile
        });
        
    }catch(err){
        console.error("Error in saveMetadata:", err);
        res.status(500).json({ message: "Server error during metadata save" });
    }
});

//______________________________________
// GET /files
// Return all file metadata for the logged-in user
// - only isDeleted: false
// - sorted by uploadDate (newest first)
//______________________________________

router.get("/", async (req, res) => {
    if (!ensureGridFSReady(res)) return;
    try {
        // TEMPORARY for Postman testing ONLY:
        // req.user = { _id: "691902cc88eb97e1105cb548" }; // <- replace with a REAL user _id from your users collection

        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const files = await File.find({
            owner: req.user._id,
            isDeleted: false,
        })
        .populate("owner", OWNER_FIELDS)
        .populate(SHARED_WITH_POPULATE)
        .sort({ uploadDate: -1 }); // newest first (descending)

        res.json(files);
    } catch (err) {
        console.error("Error in GET /files:", err);
        res.status(500).json({ message: "Server error fetching files" });
    }
});

// PATCH /files/:id/rename
router.patch("/:id/rename", async (req, res) => {
    if (!ensureGridFSReady(res)) return;
    try {
        const { newName } = req.body;

        if (!req.user) return res.status(401).json({ message: "Not authenticated" });
        if (!newName) return res.status(400).json({ message: "Missing newName" });

        const updated = await File.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            { $set: { filename: newName } },
            { new: true }
        )
        .populate("owner", OWNER_FIELDS)
        .populate(SHARED_WITH_POPULATE);

        if (!updated) return res.status(404).json({ message: "File not found" });

        res.json({ message: "File renamed", file: updated });

    } catch (err) {
        console.error("PATCH /rename error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /files/:id/copy
router.post("/:id/copy", async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Not authenticated" });
        if (!gridfsBucket) return res.status(500).json({ message: "File storage not initialized" });

        const original = await File.findOne({ // find original file, ensure owner owns file anf that file exists
            _id: req.params.id,
            owner: req.user._id,
        });
        if (!original) return res.status(404).json({ message: "File not found" });

        const { newName } = req.body || {};
        const trimmed = typeof newName === "string" ? newName.trim() : "";
        const copyName = trimmed || `Copy of ${original.filename || "Untitled"}`; // determine copy name

        const [gridFile] = await gridfsBucket.find({ _id: original.gridFsId }).toArray(); //read original file metadata from gridfs 
        if (!gridFile) {
            return res.status(404).json({ message: "Original file data missing" });
        }
        const sizeBytes = gridFile.length ?? original.size ?? 0;

        const newGridFsId = await new Promise((resolve, reject) => { //stream copy file inside mongodb
            const timestamp = new Date();
            const uploadStream = gridfsBucket.openUploadStream(copyName, {
                contentType: original.type,
                metadata: {
                    owner: new ObjectId(req.user._id),
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
            await updateStorage(req.user._id, sizeBytes, "add"); //update storage
        }

        const fileCopy = new File({
            gridFsId: newGridFsId,
            filename: copyName,
            originalName: original.originalName || original.filename,
            owner: req.user._id,
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

        const savedCopy = await fileCopy.save();
        const populatedCopy = await savedCopy.populate([
            { path: "owner", select: OWNER_FIELDS },
            SHARED_WITH_POPULATE,
        ]); 

        res.status(201).json({ message: "File copied", file: populatedCopy });

    } catch (err) {
        console.error("POST /copy error:", err);
        res.status(500).json({ message: "Server error duplicating file" });
    }
});


// PATCH /files/:id/star
router.patch("/:id/star", async (req, res) => {
    try {
        const { isStarred } = req.body;

        if (!req.user) return res.status(401).json({ message: "Not authenticated" });

        const updated = await File.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            { $set: { isStarred: !!isStarred } },
            { new: true }
        )
        .populate("owner", OWNER_FIELDS)
        .populate(SHARED_WITH_POPULATE);

        if (!updated) return res.status(404).json({ message: "File not found" });

        res.json({ message: "Star status updated", file: updated });

    } catch (err) {
        console.error("PATCH /star error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


// PATCH /files/:id/trash
router.patch("/:id/trash", async (req, res) => { // put path to bin
    try {
        const { isDeleted } = req.body;

        if (!req.user) return res.status(401).json({ message: "Not authenticated" });

        const updated = await File.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            { $set: { isDeleted: !!isDeleted } },
            { new: true }
        )
        .populate("owner", OWNER_FIELDS)
        .populate(SHARED_WITH_POPULATE);

        if (!updated) return res.status(404).json({ message: "File not found" });

        res.json({ message: "Trash status updated", file: updated });

    } catch (err) {
        console.error("PATCH /trash error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


// PATCH /files/:id/move
router.patch("/:id/move", async (req, res) => {
    try {
        const { folderId, path } = req.body;

        if (!req.user) return res.status(401).json({ message: "Not authenticated" });

        const updated = await File.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            {
                $set: {
                    folderId: folderId || null,
                    path: Array.isArray(path) ? path : []
                }
            },
            { new: true }
        )
        .populate("owner", OWNER_FIELDS)
        .populate(SHARED_WITH_POPULATE);

        if (!updated) return res.status(404).json({ message: "File not found" });

        res.json({ message: "File moved", file: updated });

    } catch (err) {
        console.error("PATCH /move error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


//______________________________________
// DELETE /files/:id/permanent
// Completely deletes metadata + GridFS bytes
//______________________________________

router.delete("/:id/permanent", async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authenticated" });

        const fileId = req.params.id;

        // 1. Find metadata
        const metadata = await File.findOne({
            _id: fileId,
            owner: req.user._id
        });

        if (!metadata)
            return res.status(404).json({ message: "File metadata not found" });

        const gridId = metadata.gridFsId;

        // 2. Get length from GridFS
        const files = await gridfsBucket.find({ _id: gridId }).toArray();
        if (!files || !files.length)
            return res.status(404).json({ message: "GridFS file not found" });

        const gridFile = files[0];

        // 3. Remove storage usage
        await updateStorage(req.user._id, gridFile.length, "remove");

        // 4. Delete GridFS bytes
        await gridfsBucket.delete(gridId);

        // 5. Delete metadata
        await File.deleteOne({ _id: fileId });

        res.json({ message: "File permanently deleted" });

    } catch (err) {
        console.error("Error in DELETE /files/:id/permanent:", err);
        res.status(500).json({ message: "Server error deleting file permanently" });
    }
});
 
//LIST FILES 

//get My Drive files (folderId = null and not deleted)
router.get("/list/mydrive", async (req, res) => {
    if (!ensureGridFSReady(res)) return;
    try {
        const files = await File.find({
            owner: req.user._id,
            isDeleted: false,
            folderId: null
        })
        .populate("owner", OWNER_FIELDS)
        .populate(SHARED_WITH_POPULATE)
        .sort({ filename: 1 });

        res.json(files);
    } catch (err) {
        console.error("Error getting My Drive files:", err);
        res.status(500).json({ message: "Error fetching files" });
    }
});

//Get folder contents
router.get("/list/folder/:folderId", async (req, res) => {
  if (!ensureGridFSReady(res)) return;
  try {
    const { folderId } = req.params;

    let folderObjectId = null;

    if (mongoose.Types.ObjectId.isValid(folderId)) {
      folderObjectId = new ObjectId(folderId);
    } else {
      const folderDoc = await Folder.findOne({ publicId: folderId });
      if (!folderDoc) {
        return res.status(404).json({ message: "Folder not found" });
      }
      folderObjectId = folderDoc._id;
    }

    const files = await File.find({
      owner: req.user._id,
      isDeleted: false,
      folderId: folderObjectId,
    })
      
        .populate("owner", OWNER_FIELDS)
        .populate(SHARED_WITH_POPULATE)
      .sort({ filename: 1 });

    res.json(files);
  } catch (err) {
    console.error("Error getting folder files:", err);
    res.status(500).json({ message: "Error fetching files" });
  }
});


//Get starred files
router.get("/list/starred", async (req, res) => {
    if (!ensureGridFSReady(res)) return;
    try {
        const files = await File.find({
            owner: req.user._id,
            isDeleted: false,
            isStarred: true
        })
        .populate("owner", OWNER_FIELDS)
        .populate(SHARED_WITH_POPULATE);

        res.json(files);
    } catch (err) {
        console.error("Error getting starred files:", err);
        res.status(500).json({ message: "Error fetching files" });
    }
});

//get trash files
router.get("/list/trash", async (req, res) => {
    if (!ensureGridFSReady(res)) return;
    try {
        const files = await File.find({
            owner: req.user._id,
            isDeleted: true
        })
        .populate("owner", OWNER_FIELDS)
        .populate(SHARED_WITH_POPULATE);

        res.json(files);
    } catch (err) {
        console.error("Error getting trash:", err);
        res.status(500).json({ message: "Error fetching trash" });
    }
});

//Get recent files
router.get("/list/recent", async (req, res) => { 
    if (!ensureGridFSReady(res)) return;
    try {
        const files = await File.find({
            owner: req.user._id,
            isDeleted: false
        })
        .populate("owner", OWNER_FIELDS)
        .populate(SHARED_WITH_POPULATE)
        .sort({ lastAccessed: -1 })
        .limit(20); //check if its for all 

        res.json(files);
    } catch (err) {
        console.error("Error getting recent files:", err);
        res.status(500).json({ message: "Error fetching recent files" });
    }
});

// PATCH /files/:id/share
router.patch("/:id/share", async (req, res) => {
    try {
        const { userId, permission } = req.body;

        if (!req.user) return res.status(401).json({ message: "Not authenticated" });
        if (!userId || !permission) return res.status(400).json({ message: "Missing fields" });
        if (!["read", "write"].includes(permission)) //TODO IF YOU CHANGE OT BOOLEAN
            return res.status(400).json({ message: "Invalid permission" });

        const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
        if (!file) return res.status(404).json({ message: "File not found" });

        const existing = file.sharedWith.find(x => x.user.toString() === userId);

        if (existing) {
            existing.permission = permission;
        } else {
            file.sharedWith.push({ user: userId, permission });
        }

        await file.save();
        const populated = await file.populate([
            { path: "owner", select: OWNER_FIELDS },
            SHARED_WITH_POPULATE,
        ]);
        res.json({ message: "File shared", file: populated });

    } catch (err) {
        console.error("PATCH /share error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// PATCH /files/:id/unshare
router.patch("/:id/unshare", async (req, res) => {
    try {
        const { userId } = req.body;

        if (!req.user) return res.status(401).json({ message: "Not authenticated" });
        if (!userId) return res.status(400).json({ message: "Missing userId" });

        const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
        if (!file) return res.status(404).json({ message: "File not found" });

        file.sharedWith = file.sharedWith.filter(x => x.user.toString() !== userId);
        await file.save();
        const populated = await file.populate([
            { path: "owner", select: OWNER_FIELDS },
            SHARED_WITH_POPULATE,
        ]);

        res.json({ message: "User unshared", file: populated });

    } catch (err) {
        console.error("PATCH /unshare error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


// PATCH /files/:id/permission
router.patch("/:id/permission", async (req, res) => {
    try {
        const { userId, permission } = req.body;

        if (!req.user) return res.status(401).json({ message: "Not authenticated" });
        if (!["read", "write"].includes(permission))
            return res.status(400).json({ message: "Invalid permission" });

        const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
        if (!file) return res.status(404).json({ message: "File not found" });

        const target = file.sharedWith.find(x => x.user.toString() === userId);
        if (!target) return res.status(404).json({ message: "User not in share list" });

        target.permission = permission;
        await file.save();
        const populated = await file.populate([
            { path: "owner", select: OWNER_FIELDS },
            SHARED_WITH_POPULATE,
        ]);

        res.json({ message: "Permission updated", file: populated });

    } catch (err) {
        console.error("PATCH /permission error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /files/shared
// Returns files shared *with* the logged-in user
router.get("/shared", async (req, res) => {
    if (!ensureGridFSReady(res)) return;
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const files = await File.find({
            "sharedWith.user": req.user._id,
            isDeleted: false
        })
        .populate("owner", OWNER_FIELDS)
        .populate(SHARED_WITH_POPULATE);

        res.json(files);

    } catch (err) {
        console.error("Error in GET /files/shared:", err);
        res.status(500).json({ message: "Server error fetching shared files" });
    }
});

// PATCH /files/:id/description
router.patch("/:id/description", async (req, res) => {
    try {
        const { description } = req.body;

        if (!req.user) 
            return res.status(401).json({ message: "Not authenticated" });

        if (typeof description !== "string")
            return res.status(400).json({ message: "Invalid description" });

        const updated = await File.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            { $set: { description: description.trim() } },
            { new: true }
        ).populate("owner", OWNER_FIELDS)
         .populate("sharedWith.user", "name email picture");

        if (!updated)
            return res.status(404).json({ message: "File not found" });

        res.json({ message: "Description updated", file: updated });

    } catch (err) {
        console.error("PATCH /description error:", err);
        res.status(500).json({ message: "Server error updating description" });
    }
});

// GET /files/search
// Full search with basic + advanced filters
router.get("/search", async (req, res) => {
    if (!ensureGridFSReady(res)) return;

    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const {
            q,
            type,
            owner,
            ownerId,
            location,
            starred,
            inBin,
            dateModified,
            afterDate,
            beforeDate,
            includesWords,
            itemName,
        } = req.query;

        const andConditions = [];
        const toObjectId = (value) => {
            try {
                return new ObjectId(value);
            } catch {
                return null;
            }
        };

        // Visibility: only files the user can access:
        //  - owned by user
        //  - OR shared with user
        andConditions.push({
            $or: [{ owner: req.user._id }, { "sharedWith.user": req.user._id }],
        });

        // In Bin / not in Bin
        if (inBin === "true") {
            andConditions.push({ isDeleted: true });
        } else {
            // Default: only non-deleted (unless user explicitly searches bin)
            andConditions.push({ isDeleted: false });
        }

        // Location (Anywhere / My Drive / Shared with me)
        if (location === "mydrive") {
            andConditions.push({
                owner: req.user._id,
                location: /my drive/i,
            });
        } else if (location === "shared") {
            andConditions.push({
                "sharedWith.user": req.user._id,
            });
        } // "anywhere" – no extra condition beyond visibility + isDeleted

        // Owner filter (anyone / me / notMe / person)
        if (owner === "me") {
            andConditions.push({ owner: req.user._id });
        } else if (owner === "notMe") {
            // still restricted by visibility, but exclude files owned by me
            andConditions.push({ owner: { $ne: req.user._id } });
        } else if (owner === "person" && ownerId) {
            const specificOwner = toObjectId(ownerId) || ownerId;
            andConditions.push({ owner: specificOwner });
        }

        // Starred
        if (starred === "true") {
            andConditions.push({ isStarred: true });
        }

        // Helper: type condition based on simplified types
        const buildTypeCondition = (t) => {
            if (!t || t === "any") return null;

            const pdfRegex = /pdf/i;
            const imageExt = /\.(png|jpe?g|gif|bmp|webp)$/i;
            const videoExt = /\.(mp4|mov|avi|mkv|webm)$/i;
            const docExt = /\.(docx?|txt|rtf)$/i;

            switch (t) {
                case "pdf":
                    return {
                        $or: [{ type: pdfRegex }, { filename: /\.pdf$/i }, { originalName: /\.pdf$/i }],
                    };
                case "images":
                    return {
                        $or: [
                            { type: /^image\//i },
                            { filename: imageExt },
                            { originalName: imageExt },
                        ],
                    };
                case "videos":
                    return {
                        $or: [
                            { type: /^video\//i },
                            { filename: videoExt },
                            { originalName: videoExt },
                        ],
                    };
                case "docs":
                    return {
                        $or: [
                            { filename: docExt },
                            { originalName: docExt },
                            { type: /wordprocessing/i },
                        ],
                    };
                case "folders":
                    return { type: /folder/i };
                default:
                    return null;
            }
        };

        const typeCondition = buildTypeCondition(type);
        if (typeCondition) andConditions.push(typeCondition);

        // Basic query "q": search in name + description
        if (q && q.trim()) {
            const regex = new RegExp(q.trim(), "i");
            andConditions.push({
                $or: [
                    { filename: regex },
                    { originalName: regex },
                    { description: regex },
                ],
            });
        }

        // Item name: refine name explicitly
        if (itemName && itemName.trim()) {
            const regexName = new RegExp(itemName.trim(), "i");
            andConditions.push({
                $or: [{ filename: regexName }, { originalName: regexName }],
            });
        }

        // Includes words: use description as "content"
        if (includesWords && includesWords.trim()) {
            const regexContent = new RegExp(includesWords.trim(), "i");
            andConditions.push({ description: regexContent });
        }

        // Date modified / upload date filter
        const dateField = "uploadDate"; // treating uploadDate as modified date for now
        let start = null;
        let end = null;
        const today = new Date();

        const parseDateOnly = (str) => {
            const d = new Date(str);
            if (Number.isNaN(d.getTime())) return null;
            // Force to start of the day
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        };

        if (dateModified && dateModified !== "anytime") {
            if (dateModified === "today") {
                start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                end = new Date(start);
                end.setDate(end.getDate() + 1);
            } else if (dateModified === "yesterday") {
                end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                start = new Date(end);
                start.setDate(start.getDate() - 1);
            } else if (dateModified === "last7Days") {
                end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
                start = new Date(end);
                start.setDate(start.getDate() - 7);
            } else if (dateModified === "last30Days") {
                end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
                start = new Date(end);
                start.setDate(start.getDate() - 30);
            } else if (dateModified === "last90Days") {
                end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
                start = new Date(end);
                start.setDate(start.getDate() - 90);
            } else if (dateModified === "custom") {
                const after = afterDate ? parseDateOnly(afterDate) : null;
                const before = beforeDate ? parseDateOnly(beforeDate) : null;

                if (after) start = after;
                if (before) {
                    end = new Date(before.getFullYear(), before.getMonth(), before.getDate() + 1);
                }
            }

            if (start || end) {
                const dateQuery = {};
                if (start) dateQuery.$gte = start;
                if (end) dateQuery.$lte = end;
                andConditions.push({ [dateField]: dateQuery });
            }
        }

        const mongoQuery = andConditions.length ? { $and: andConditions } : {};

        const results = await File.find(mongoQuery)
            .populate("owner", OWNER_FIELDS)
            .populate("sharedWith.user", "firstName lastName email")
            .sort({ uploadDate: -1 });

        res.json(results);
    } catch (err) {
        console.error("Error in GET /files/search:", err);
        res.status(500).json({ message: "Server error during file search" });
    }
});

module.exports = router;

    

