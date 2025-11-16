const router = require("express").Router();
const passport = require("passport");

// Step 1 — Login with Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Step 2 — Google callback URL
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure",
    successRedirect: "http://localhost:5173", // front-end
  })
);

// Step 3 — Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("http://localhost:5173");
  });
});

router.get("/failure", (req, res) => res.send("Login failed"));

module.exports = router;


