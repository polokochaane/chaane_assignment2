const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function register(req, res) {
  const { username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1,$2,$3) RETURNING user_id",
      [username, hashedPassword, role]
    );
    res.json({ message: "User registered", user_id: result.rows[0].user_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
}

async function login(req, res) {
  const { username, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE username=$1", [username]);
    if (result.rows.length === 0)
      return res.status(400).json({ error: "Invalid username or password" });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid username or password" });

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
}

module.exports = { register, login };
