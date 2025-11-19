const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const dotenv = require("dotenv");
const session = require("cookie-session");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// CORS: allow frontend dev server
app.use(
  cors({
    origin: "http://localhost:5173", // Vite default
    credentials: true,
  })
);


// Sessions
app.use(
  session({
    name: "session",
    keys: [process.env.SESSION_SECRET],
    //maxAge: 24 * 60 * 60 * 1000, // 1 day
    //^ no global maxAGE keep it as default cookie session so that without remmeberMe it ends when the browser is closed
  })
);

// Passport middleware

app.use((req, res, next) => {
  if (req.session && !req.session.regenerate) {
    req.session.regenerate = (cb) => cb();
  }
  if (req.session && !req.session.save) {
    req.session.save = (cb) => cb();
  }
  next();
});


app.use(passport.initialize());
app.use(passport.session());

// Passport config
require("./config/passport")(passport);


// MongoDB connection
mongoose
.connect(process.env.MONGODB_URI)
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch((err) => console.log("❌ MongoDB connection error:", err));


const ensureAuth = require('./middleware/auth');

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/user", ensureAuth ,require("./routes/user"));
app.use("/files", ensureAuth ,require("./routes/files"));
app.use("/folders", require("./routes/folders"));

app.get("/", (req, res) => res.send("Mini Drive Backend Running ✅"));

app.get("/debug/session", (req, res) => {
  res.json({
    session: req.session,
    user: req.user || null,
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
