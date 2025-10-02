const express = require("express");
const router = express.Router();
const { getReports, addReport } = require("../controllers/reportController");
const authenticateToken = require("../middleware/authMiddleware");

router.get("/", authenticateToken, getReports);
router.post("/", authenticateToken, addReport);

module.exports = router;
