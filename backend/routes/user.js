const router = require("express").Router();
const User = require("../models/User");

const LOG_USER_ROUTE = false;
const log = (event, detail = {}) => {
  if (!LOG_USER_ROUTE) return;
  console.info(`[userRoute][${new Date().toISOString()}] ${event}`, detail);
};


router.get("/profile", (req, res) => {
  log("GET /profile", { userId: req.user?._id, hasUser: !!req.user });
  if (!req.user) return res.status(401).json({ message: "Not logged in" });
  const nonSensitiveData = {
    _id: req.user._id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    picture: req.user.picture,
    email: req.user.email,
    storageLimit: req.user.storageLimit ?? 0,
    storageUsed: req.user.storageUsed ?? 0,
  };
  log("GET /profile response", {
    userId: req.user._id,
    storageLimit: nonSensitiveData.storageLimit,
    storageUsed: nonSensitiveData.storageUsed,
  });
  res.json(nonSensitiveData);
});

// GET /user/find?email=x@y.com
router.get("/find", async (req, res) => {
  try {
    const email = req.query.email;
  log("GET /find", { email });
  if (!email) return res.status(400).json({ message: "Missing email" });

    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    }).select("_id name email picture");

    if (!user) return res.status(404).json({ message: "User not found" });

    log("GET /find success", { email, userId: user._id });
    res.json({ user });
  } catch (err) {
    console.error("Error in /user/find:", err);
    log("GET /find error", { message: err.message, stack: err.stack });
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
