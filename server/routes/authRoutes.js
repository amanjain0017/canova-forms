const express = require("express");
const router = express.Router();
const {
  signup,
  signin,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  updateUserPreferences,
  logout,
  checkUserByEmail,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// @desc    Register a new user
// @route   POST /api/auth/signup
router.post("/signup", signup);

// @desc    Authenticate user & get token
// @route   POST /api/auth/signin
router.post("/signin", signin);

// --- Password Reset Flow Routes ---

// @desc    STEP 1: Request OTP for Password Reset
// @route   POST /api/auth/forgotpassword
router.post("/forgotpassword", forgotPassword);

// @desc    STEP 2: Verify OTP for Password Reset
// @route   POST /api/auth/verifyotp
router.post("/verifyotp", verifyOtp);

// @desc    STEP 3: Reset User Password (after OTP verification)
// @route   PUT /api/auth/resetpassword
router.put("/resetpassword", resetPassword);

// --- User Profile & Settings Routes ---

// @desc    Get authenticated user profile
// @route   GET /api/auth/profile
// @access  Private
router.get("/profile", protect, getUserProfile);

// @desc    Update authenticated user profile details (name, phone, location)
// @route   PUT /api/auth/profile
// @access  Private
router.put("/profile", protect, updateUserProfile);

// @desc    Update authenticated user preferences (theme, language)
// @route   PUT /api/auth/preferences
// @access  Private
router.put("/preferences", protect, updateUserPreferences);

// @desc    Log out user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post("/logout", protect, logout);

router.get("/check-email", protect, checkUserByEmail);

module.exports = router;
