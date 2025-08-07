const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Helper function to generate JWT token (for login/signup)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Email is already registered" });
    }
    res.status(500).json({ success: false, message: "Server error" });
    console.error(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/signin
// @access  Public
exports.signin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please enter both email and password",
    });
  }

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
    console.error(error);
  }
};

// @desc    STEP 1: Request OTP for Password Reset
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide an email address" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // Security best practice: send 200 OK even if user not found to prevent email enumeration attacks
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, an OTP has been sent.",
      });
    }

    // 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp; // hashed by pre-save hook
    user.otpExpire = Date.now() + 5 * 60 * 1000; // 5 min
    user.passwordResetProofToken = undefined;
    user.passwordResetProofTokenExpire = undefined;

    await user.save({ validateBeforeSave: false }); // bypass schema validation

    const message = `
            <h1>CanovaForm Password Reset OTP</h1><br><br>
            <p>Your One-Time Password (OTP) for password reset is:</p>
            <h2>${otp}</h2>
            <p>This OTP is valid for 5 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        `;

    try {
      await sendEmail({
        email: user.email,
        subject: "CanovaForm: Your Password Reset OTP",
        message,
      });

      res.status(200).json({
        success: true,
        message: "OTP sent to your email successfully.",
      });
    } catch (emailError) {
      // clear the OTP from the user object in DB if sending email fails
      user.otp = undefined;
      user.otpExpire = undefined;
      await user.save({ validateBeforeSave: false });
      console.error("Email could not be sent:", emailError);
      return res.status(500).json({
        success: false,
        message: "Email could not be sent. Please try again later.",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
    console.error(error);
  }
};

// @desc    STEP 2: Verify OTP for Password Reset
// @route   POST /api/auth/verifyotp
// @access  Public
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide email and OTP" });
  }

  try {
    const user = await User.findOne({ email }).select("+otp");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or OTP" });
    }

    // Check if OTP has expired
    if (!user.otp || user.otpExpire < Date.now()) {
      user.otp = undefined;
      user.otpExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({
        success: false,
        message: "OTP has expired or is invalid. Please request a new one.",
      });
    }

    // Compare OTP with hashed OTP
    const isOtpMatch = await user.matchOtp(otp);

    if (!isOtpMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP. Please try again." });
    }

    // OTP is valid and not expired. Generate password reset proof token
    const passwordResetProofToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetProofToken = passwordResetProofToken;
    user.passwordResetProofTokenExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now set your new password.",
      email: user.email,
      passwordResetProofToken: passwordResetProofToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
    console.error(error);
  }
};

// @desc    STEP 3: Reset User Password (after OTP verification and proof token received)
// @route   PUT /api/auth/resetpassword
// @access  Public
exports.resetPassword = async (req, res) => {
  const { email, newPassword, passwordResetProofToken } = req.body;

  if (!email || !newPassword || !passwordResetProofToken) {
    return res.status(400).json({
      success: false,
      message:
        "Please provide email, new password, and the verification token.",
    });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 8 characters long.",
    });
  }

  try {
    const user = await User.findOne({ email }).select(
      "+otp +otpExpire +passwordResetProofToken +passwordResetProofTokenExpire"
    );

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request: User not found." });
    }

    if (
      !user.passwordResetProofToken ||
      user.passwordResetProofTokenExpire < Date.now()
    ) {
      user.passwordResetProofToken = undefined;
      user.passwordResetProofTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(403).json({
        success: false,
        message:
          "Password reset session expired or invalid. Please restart the process.",
      });
    }

    const isProofTokenMatch = await user.matchPasswordResetProofToken(
      passwordResetProofToken
    );

    if (!isProofTokenMatch) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid verification token." });
    }

    // Proof token is valid
    user.password = newPassword;

    user.otp = undefined;
    user.otpExpire = undefined;
    user.passwordResetProofToken = undefined;
    user.passwordResetProofTokenExpire = undefined;

    await user.save(); // Save the user with new hashed password

    // Log the user in immediately after resetting password
    res.status(200).json({
      success: true,
      message: "Password reset successfully. You are now logged in.",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
    console.error(error);
  }
};

// New Profile & Settings Controllers
/*
 * @desc    Get authenticated user profile
 * @route   GET /api/auth/profile
 * @access  Private
 * @returns {Object} user - Authenticated user's profile data
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -otp -otpExpire -passwordResetProofToken -passwordResetProofTokenExpire"
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        location: user.location,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching profile" });
  }
};

/*
 * @desc    Update authenticated user profile details (name, phone, location)
 * @route   PUT /api/auth/profile
 * @access  Private
 * @returns {Object} user - Updated user profile data
 */
exports.updateUserProfile = async (req, res) => {
  const { name, phoneNumber, location } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber; // Allow null to clear
    if (location !== undefined) user.location = location; // Allow null to clear

    await user.save(); // This will trigger schema validation for phoneNumber etc.

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        location: user.location,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error updating profile" });
  }
};

/*
 * @desc    Update authenticated user preferences (theme, language)
 * @route   PUT /api/auth/preferences
 * @access  Private
 * @returns {Object} user - Updated user preferences
 */
exports.updateUserPreferences = async (req, res) => {
  const { theme, language } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Update preferences if provided
    if (theme) user.preferences.theme = theme;
    if (language) user.preferences.language = language;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        location: user.location,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error updating preferences" });
  }
};

/*
 * @desc    Log out user / clear cookie (if using HTTP-only cookies)
 * @route   POST /api/auth/logout
 * @access  Private
 * @returns {Object} message - Success message
 */
exports.logout = async (req, res) => {
  try {
    // If using HTTP-only cookies, clear the token cookie
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error during logout" });
  }
};

// @desc    Check if a user exists by email
// @route   GET /api/users/check-email?email=<email>
// @access  Private (or Public, depending on your app's security model)
exports.checkUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (user) {
      res
        .status(200)
        .json({
          success: true,
          exists: true,
          userId: user._id,
          email: user.email,
        });
    } else {
      res
        .status(200)
        .json({ success: true, exists: false, message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error checking user email" });
  }
};
