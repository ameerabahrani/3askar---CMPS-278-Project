const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const dotenv = require("dotenv");
const session = require("cookie-session");
const cors = require("cors");
const crypto = require("crypto");

const LOG_HTTP = false;

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const summarizePayload = (payload) => {
  if (!payload) return null;
  try {
    if (typeof payload === "object") {
      return {
        keys: Object.keys(payload),
        preview: JSON.stringify(payload).slice(0, 200),
      };
    }
    return { value: `${payload}`.slice(0, 120) };
  } catch (err) {
    return { preview: "unserializable", error: err.message };
  }
};

const requestLogger = (req, res, next) => {
  const reqId =
    (crypto.randomUUID && crypto.randomUUID().split("-").pop()) ||
    Math.random().toString(16).slice(2);
  const started = process.hrtime.bigint();
  const startTime = new Date().toISOString();
  const base = { reqId, method: req.method, path: req.originalUrl };

  if (LOG_HTTP) {
    console.info("[http][start]", {
      ...base,
      startTime,
      ip: req.ip,
      query: req.query,
      body: summarizePayload(req.body),
    });
  }

  res.on("finish", () => {
    const durationMs =
      Number(process.hrtime.bigint() - started) / 1_000_000;
    if (LOG_HTTP) {
      console.info("[http][finish]", {
        ...base,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(1)),
        userId: req.user?._id,
        contentLength: res.get("Content-Length"),
      });
    }
  });

  res.on("close", () => {
    if (!res.writableEnded) {
      const durationMs =
        Number(process.hrtime.bigint() - started) / 1_000_000;
      if (LOG_HTTP) {
        console.warn("[http][aborted]", {
          ...base,
          durationMs: Number(durationMs.toFixed(1)),
        });
      }
    }
  });

  next();
};


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
app.use(requestLogger);

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
app.use("/user", ensureAuth, require("./routes/user"));
app.use("/files", ensureAuth, require("./routes/files"));
app.use("/folders", require("./routes/folders"));
app.use("/batch", ensureAuth, require("./routes/batch"));

app.get("/", (req, res) => res.send("Mini Drive Backend Running ✅"));

app.get("/debug/session", (req, res) => {
  res.json({
    session: req.session,
    user: req.user || null,
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
