const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: { type: String}, //NTS: removed required on googleid since i plan on having the schema be the same with google and local sign in and sign ups
  email: { type: String },
  passwordHash: {type: String}, //bcrypt thingy look it up later
  firstName: { type: String },
  lastName: {type: String},
  dob: {type: Date},
  picture: { type: String }
});

module.exports = mongoose.model("User", userSchema);




