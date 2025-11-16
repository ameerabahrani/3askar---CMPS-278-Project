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



let gridfsBucket; 
// once mongoose connection is open, initialize GridFS bucket to make sure it's ready before handling requests
mongoose.connection.once("open", () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: "files",
    });
    console.log("✅ GridFS Bucket initialized in files route");
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

    try {
        // TEMPORARY: fake user for Postman testing
        // req.user = { _id: new ObjectId() };
        // console.log("req.user =", req.user);
        // console.log("req.file =", req.file);
        // console.log("req.user =", req.user);
        // console.log("gridfsBucket =", gridfsBucket);

        // if (!req.user){
        //     return res.status(401).json({ message: "Not authenticated" });
        // }

        if (!req.file) { //multer places the file in req.file, if no file was uploaded, return error
            return res.status(400).json({ message: "No file uploaded" });
        }
        ///destructure the fields from req.file
        // Extract file info from multer, comes from multer's memory storage
        // originalname: original file name, mimetype: file type, buffer: file data, size: file size in bytes, 
        const { originalname, mimetype, size, buffer } = req.file;
        if (!gridfsBucket) {
            return res.status(500).json({ message: "GridFS Bucket not initialized" });//if GridFS bucket is not initialized, return error
        }

        const readStream = Readable.from(buffer); // gridfs expects a stream, convert buffer to readable stream

        //create an upload stream to GridFS
        //orginalname is the filename stored in GridFS
        //grid fs automatically splits the file into chunks and stores them in file.chunks and stores metadata in file.files
        const uploadStream = gridfsBucket.openUploadStream(originalname, {
            contentType: mimetype,
            metadata: {
                owner: new ObjectId(req.user._id),
                uploadedAt: new Date(),
            },
        });

        //upload finished successfully
        //GridFS emits 'finish' event when upload into mongoDB is complete
        //"file" is the actual mongoDB file document created in the file.files
        //contains file._id, file.length, file.contentType, file.metadata
 

        uploadStream.on("finish", async () => {
            try {
             
                const realId = uploadStream.id;
                console.log("UPLOAD FINISHED — REAL GRIDFS ID:", realId);

                // Fetch file from GridFS
                const files = await gridfsBucket.find({ _id: realId }).toArray();
                const dbFile = files[0];

                if (!dbFile) {
                    console.log("GridFS lookup failed for ID:", realId);
                    return res.status(500).json({ message: "GridFS lookup failed" });
                }

                // Update storage usage
                await updateStorage(req.user._id, dbFile.length, "add");

                // Respond with correct ID
                res.status(201).json({
                    message: "File uploaded to GridFS",
                    fileId: dbFile._id,   // THIS IS NOW THE TRUE ID
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


        //if error occurs during upload, respond with error
        uploadStream.on("error", (err) => { 
            console.error("Error uploading file to GridFS:", err);
            res.status(500).json({ message: "Upload failed"});
        });

        //send the inmemory file into the database as a stream
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

        // 🔹 Update lastAccessed in our File metadata collection
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
    try{
        // req.user = { _id: new ObjectId() }; // TEMPORARY for Postman
        // console.log("➡️ DELETE ROUTE REACHED");
        // console.log("fileId =", req.params.id);
        // console.log("req.user =", req.user);
        // console.log("gridfsBucket =", gridfsBucket);

        const fileId = req.params.id;
        let objectId; 
        try{
            req.user = { _id: new ObjectId("676f2ac5308f1a22222a1ce4") }; //temp for postman

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
    try {
        console.log("➡️ /files/saveMetadata route reached");
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

        //3. create file metadata document
        const newFile = new File({
            gridFsId: objectId,
            originalName,
            filename,
            owner: req.user._id, // temporary user
            size,
            type,
            folderId: folderId || null,
            location: location || "My Drive",
            path: path || [],
            isStarred: isStarred || false,
            isDeleted: isDeleted || false,
            description: description || "",
            sharedWith: sharedWith || []
        });

        // Step 4: Save in MongoDB
        const savedFile = await newFile.save();
        
        // Step 5: Respond
        res.status(201).json({
            message: "Metadata saved",
            file: savedFile
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
    try {
        // TEMPORARY for Postman testing ONLY:
        // req.user = { _id: "691902cc88eb97e1105cb548" }; // <- replace with a REAL user _id from your users collection

        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const files = await File.find({
            owner: req.user._id,
            isDeleted: false,
        }).sort({ uploadDate: -1 }); // newest first

        res.json(files);
    } catch (err) {
        console.error("Error in GET /files:", err);
        res.status(500).json({ message: "Server error fetching files" });
    }
});

// PATCH /files/:id/rename
router.patch("/:id/rename", async (req, res) => {
    try {
        const { newName } = req.body;

        if (!req.user) return res.status(401).json({ message: "Not authenticated" });
        if (!newName) return res.status(400).json({ message: "Missing newName" });

        const updated = await File.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            { $set: { filename: newName } },
            { new: true }
        );

        if (!updated) return res.status(404).json({ message: "File not found" });

        res.json({ message: "File renamed", file: updated });

    } catch (err) {
        console.error("PATCH /rename error:", err);
        res.status(500).json({ message: "Server error" });
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
        );

        if (!updated) return res.status(404).json({ message: "File not found" });

        res.json({ message: "Star status updated", file: updated });

    } catch (err) {
        console.error("PATCH /star error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


// PATCH /files/:id/trash
router.patch("/:id/trash", async (req, res) => {
    try {
        const { isDeleted } = req.body;

        if (!req.user) return res.status(401).json({ message: "Not authenticated" });

        const updated = await File.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            { $set: { isDeleted: !!isDeleted } },
            { new: true }
        );

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
        );

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
    try {
        const files = await File.find({
            owner: req.user._id,
            isDeleted: false,
            folderId: null
        }).sort({ filename: 1 });

        res.json(files);
    } catch (err) {
        console.error("Error getting My Drive files:", err);
        res.status(500).json({ message: "Error fetching files" });
    }
});

//Get folder contents
router.get("/list/folder/:folderId", async (req, res) => {
    try {
        const files = await File.find({
            owner: req.user._id,
            isDeleted: false,
            folderId: req.params.folderId
        });

        res.json(files);
    } catch (err) {
        console.error("Error getting folder files:", err);
        res.status(500).json({ message: "Error fetching files" });
    }
});

//Get starred files
router.get("/list/starred", async (req, res) => {
    try {
        const files = await File.find({
            owner: req.user._id,
            isDeleted: false,
            isStarred: true
        });

        res.json(files);
    } catch (err) {
        console.error("Error getting starred files:", err);
        res.status(500).json({ message: "Error fetching files" });
    }
});

//get trash files
router.get("/list/trash", async (req, res) => {
    try {
        const files = await File.find({
            owner: req.user._id,
            isDeleted: true
        });

        res.json(files);
    } catch (err) {
        console.error("Error getting trash:", err);
        res.status(500).json({ message: "Error fetching trash" });
    }
});

//Get recent files
router.get("/list/recent", async (req, res) => {
    try {
        const files = await File.find({
            owner: req.user._id,
            isDeleted: false
        })
        .sort({ lastAccessed: -1 })
        .limit(20);

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
        if (!["read", "write"].includes(permission))
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
        res.json({ message: "File shared", file });

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

        res.json({ message: "User unshared", file });

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

        res.json({ message: "Permission updated", file });

    } catch (err) {
        console.error("PATCH /permission error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /files/shared
// Returns files shared *with* the logged-in user
router.get("/shared", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const files = await File.find({
            "sharedWith.user": req.user._id,
            isDeleted: false
        });

        res.json(files);

    } catch (err) {
        console.error("Error in GET /files/shared:", err);
        res.status(500).json({ message: "Server error fetching shared files" });
    }
});


module.exports = router;

    
