// -------------------- IMPORTS --------------------
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const pool = require("./config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

// -------------------- APP SETUP --------------------
const app = express();
app.use(cors());
app.use(bodyParser.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// -------------------- MIDDLEWARE --------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// -------------------- AUTH ROUTES --------------------
app.post("/auth/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1,$2,$3) RETURNING user_id",
      [username, hashed, role]
    );
    res.json({ message: "User registered successfully", user_id: result.rows[0].user_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE username=$1", [username]);

    if (result.rows.length === 0)
      return res.status(400).json({ error: "Invalid username or password" });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid username or password" });

    const token = jwt.sign({ id: user.user_id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// -------------------- REPORTS ROUTES --------------------
app.get("/reports", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM reports ORDER BY report_id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot fetch reports" });
  }
});

app.post("/reports", authenticateToken, async (req, res) => {
  try {
    const {
      class_id,
      lecturer_id,
      week,
      lecture_date,
      topic_taught,
      learning_outcomes,
      actual_students_present,
      lecturer_recommendations,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO reports 
      (class_id, lecturer_id, week, lecture_date, topic_taught, learning_outcomes, actual_students_present, lecturer_recommendations)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING report_id`,
      [
        class_id,
        lecturer_id,
        week,
        lecture_date,
        topic_taught,
        learning_outcomes,
        actual_students_present,
        lecturer_recommendations,
      ]
    );

    res.json({ message: "Report submitted", report_id: result.rows[0].report_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot submit report" });
  }
});

// -------------------- RATINGS ROUTES --------------------
app.get("/ratings/:reportId", authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const result = await pool.query("SELECT * FROM ratings WHERE report_id=$1 ORDER BY rating_id DESC", [
      reportId,
    ]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot fetch ratings" });
  }
});

app.post("/ratings", authenticateToken, async (req, res) => {
  try {
    const { student_id, lecturer_id, course_id, report_id, rating, comments } = req.body;
    const result = await pool.query(
      `INSERT INTO ratings (student_id, lecturer_id, course_id, report_id, rating, comments)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING rating_id`,
      [student_id, lecturer_id, course_id, report_id, rating, comments]
    );
    res.json({ message: "Rating submitted", rating_id: result.rows[0].rating_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot submit rating" });
  }
});

// -------------------- DASHBOARD STATS --------------------
app.get("/stats", authenticateToken, async (req, res) => {
  try {
    const users = await pool.query("SELECT COUNT(*) FROM users");
    const reports = await pool.query("SELECT COUNT(*) FROM reports");
    const ratings = await pool.query("SELECT COUNT(*) FROM ratings");

    res.json({
      users: parseInt(users.rows[0].count),
      reports: parseInt(reports.rows[0].count),
      ratings: parseInt(ratings.rows[0].count),
      courses: 10, // placeholder
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

// -------------------- SERVE REACT FRONTEND --------------------
// Make sure "build/" is inside luct-backend after running "npm run build" in frontend
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
