const express = require("express");
const router = express.Router();
const {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getRecentWorks,
} = require("../controllers/projectController");

const { protect } = require("../middleware/authMiddleware");

router.route("/recent").get(protect, getRecentWorks);
router.get("/myprojects", protect, getMyProjects);
router.post("/", protect, createProject);
router.get("/:id", protect, getProjectById);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);

module.exports = router;
