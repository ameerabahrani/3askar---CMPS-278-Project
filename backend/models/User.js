const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  email: { type: String },
  name: { type: String },
  picture: { type: String },
  storageUsed: {type: Number, default: 0,},
});

module.exports = mongoose.model("User", userSchema);




