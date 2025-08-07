const express = require("express");
const router = express.Router();
const {
  createForm,
  getFormById,
  getPublicFormById,
  updateForm,
  deleteForm,
  getFormsByProject,
  publishForm,
  shareForm,
  getSharedForms,
} = require("../controllers/formController");

const { protect } = require("../middleware/authMiddleware");

// PUBLIC route for fetching a form (no 'protect' middleware)
router.get("/public/:id", getPublicFormById);

// routes will be protected by authentication
router.use(protect);

// protected routes
router.get("/shared", getSharedForms);
router.post("/", createForm);
router.get("/:id", getFormById);
router.put("/:id", updateForm);
router.delete("/:id", deleteForm);
router.get("/project/:projectId", getFormsByProject);
router.put("/:id/publish", publishForm);
router.post("/:id/share", shareForm);

module.exports = router;
