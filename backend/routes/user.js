const router = require("express").Router();
const User = require("../models/User");


router.get("/profile", (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not logged in" });
  const nonSensitiveData = {firstName: req.user.firstName,lastName: req.user.lastName, picture: req.user.picture, email: req.user.email};
  res.json(nonSensitiveData);
});

// GET /user/find?email=x@y.com
router.get("/find", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ message: "Missing email" });

    const user = await User.findOne({ email }).select("_id name email picture");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error("Error in /user/find:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
