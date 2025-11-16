const mongoose = require("mongoose"); 
const FileSchema = new mongoose.Schema({
    gridFsId: { type: mongoose.Schema.Types.ObjectId, required: true,},
    filename: {type: String, required: true},
    originalName: { type: String, required: true},
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true,},
    size: { type: Number, required: true },
    type: { type: String },
    location: {type: String, default: "My Drive"},
    folderId:{ type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null}, 
    path: { type: [String], default: [] }, //TODO: after ahmed finishes folder navigation
    isStarred: {type: Boolean, default: false}, 
    isDeleted: {type: Boolean, default: false}, 
    description: { type: String, default: "" }, 
    sharedWith: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            permission: { type: String, enum: ["read", "write"], default: "read" }
        }
    ],
    uploadDate: { type: Date, default: Date.now, required: true },
    lastAccessed: { type: Date, default: Date.now, required: true }
});

module.exports = mongoose.model("File", FileSchema);

