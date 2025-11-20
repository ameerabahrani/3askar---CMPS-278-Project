const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: { type: String}, //NTS: removed required on googleid since i plan on having the schema be the same with google and local sign in and sign ups
  email: { type: String },
  passwordHash: {type: String}, //bcrypt hashing
  firstName: { type: String },
  lastName: {type: String},
  name: { type: String },
  dob: {type: Date},
  picture: { type: String },
  storageUsed: {type: Number, default: 0,}, // later used by calling updateStorage(userId, file.length, "add" or "remove")
  storageLimit: {
    type: Number,
    default: 500 * 1024 * 1024, // 500MB default quota
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

module.exports = mongoose.model("User", userSchema);
