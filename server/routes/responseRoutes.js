const express = require("express");
const router = express.Router();
const {
  submitFormResponse,
  getFormResponses,
  getResponseById,
} = require("../controllers/responseController");

const { protect } = require("../middleware/authMiddleware");

// @desc    Submit a form response (can be public/unauthenticated)
// @route   POST /api/responses/:formId
// @access  Public (if form is public) or Private (if form is private and user is invited)
router.post("/:formId", submitFormResponse);

// @desc    Get all responses for a specific form
// @route   GET /api/responses/form/:formId
// @access  Private (only form owner or users with edit/view access to form analytics)
router.get("/form/:formId", protect, getFormResponses);

// @desc    Get a single response by ID
// @route   GET /api/responses/:id
// @access  Private (only form owner or users with edit/view access to form analytics)
router.get("/:id", protect, getResponseById);

module.exports = router;
