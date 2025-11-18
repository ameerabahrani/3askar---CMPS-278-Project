const mongoose = require("mongoose"); 
const FileSchema = new mongoose.Schema({
    //mongoose.schema.Types.ObjectId means the field stores a MongoDB ObjectId value, its used to reference documents in other collections
    gridFsId: { type: mongoose.Schema.Types.ObjectId, required: true,}, //link to files.files_id
    filename: {type: String, required: true}, // whats displayed in the UI
    originalName: { type: String, required: true}, // original uploaded name
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true,}, 
    size: { type: Number, required: true }, //in bytes
    type: { type: String, required: true }, // mimetype: .pdf, .docx, .png, etc
    location: {type: String, default: "My Drive"},  
    folderId:{ type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null}, // null means root directory  ("My Drive")
    path: { type: [String], default: [] }, 
    isStarred: {type: Boolean, default: false}, 
    isDeleted: {type: Boolean, default: false}, 
    description: { type: String, default: "" }, 
    sharedWith: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            permission: { type: String, enum: ["read", "write"], default: "read" } //check if its better to have enum or boolean flag
        }
    ],
    uploadDate: { type: Date, default: Date.now, required: true },
    lastAccessed: { type: Date, default: Date.now, required: true }
});

module.exports = mongoose.model("File", FileSchema);

