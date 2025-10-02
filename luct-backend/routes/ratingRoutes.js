const express = require("express");
const router = express.Router();
const { getRatings, addRating } = require("../controllers/ratingController");
const authenticateToken = require("../middleware/authMiddleware");

router.get("/:report_id", authenticateToken, getRatings);
router.post("/", authenticateToken, addRating);

module.exports = router;
