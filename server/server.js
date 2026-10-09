const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Authentication Routes
app.use("/api/auth", authRoutes);

// Test Backend
app.get("/", (req, res) => {
  res.send("CyberProtect AI Backend is Running");
});

// Test Database
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "PostgreSQL Connected Successfully",
      databaseTime: result.rows[0]
    });

  } catch (error) {
    console.error("Database Error:", error.message);

    res.status(500).json({
      message: "Database Connection Failed",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});