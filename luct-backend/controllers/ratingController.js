const pool = require("../config/db");

async function getRatings(req, res) {
  try {
    const result = await pool.query("SELECT * FROM ratings ORDER BY rating_id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot fetch ratings" });
  }
}

async function addRating(req, res) {
  const { student_id, lecturer_id, course_id, rating, comments } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO ratings 
      (student_id, lecturer_id, course_id, rating, comments)
      VALUES ($1,$2,$3,$4,$5) RETURNING rating_id`,
      [student_id, lecturer_id, course_id, rating, comments]
    );
    res.json({ message: "Rating submitted", rating_id: result.rows[0].rating_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot submit rating" });
  }
}

module.exports = { getRatings, addRating };

