const router = require("express").Router();

router.get("/profile", (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not logged in" });
  const nonSensitiveData = {firstName: req.user.firstName,lastName: req.user.lastName, picture: req.user.picture, email: req.user.email};
  res.json(nonSensitiveData);
});

module.exports = router;
