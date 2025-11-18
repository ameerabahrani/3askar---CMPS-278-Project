const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const folderSchema = new Schema({

    name: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      unique: true,
      index: true,
      default: () => uuidv4(),
    },

    owner: { //filter folders by owner when fetching
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    parentFolder: { //to support nested folders
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null, // null = in root
    },

    isDeleted: {  //use it for soft delete
      type: Boolean,
      default: false,
    },

    location: {
      type: String,
      enum: ["MY_DRIVE", "TRASH", "SHARED"],
      default: "MY_DRIVE",
    },
    
    isStarred: { //if true show in starred section
      type: Boolean,
      default: false,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    path: {
      type: String,
      default: "",
    },

    sharedWith: [
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    canEdit: {
      type: Boolean,
      default: false, // false = view only, true = can edit/delete
    },
  },
],

    
}, { timestamps: true }); //automatically adds createdAt and updatedAt fields

module.exports = mongoose.model("Folder", folderSchema);

