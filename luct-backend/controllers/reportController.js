const pool = require("../config/db");

async function getReports(req, res) {
  try {
    const result = await pool.query("SELECT * FROM reports ORDER BY report_id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot fetch reports" });
  }
}

async function addReport(req, res) {
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

  try {
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
}

module.exports = { getReports, addReport };
