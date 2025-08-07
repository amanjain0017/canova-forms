const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      default: null,
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      language: {
        type: String,
        default: "en",
      },
    },

    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    otp: String,
    otpExpire: Date,
    passwordResetProofToken: String,
    passwordResetProofTokenExpire: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  // hash OTP if new/modified and has a value
  if (this.isModified("otp") && this.otp !== undefined && this.otp !== null) {
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
  }
  // hash passwordResetProofToken if new/modified and has a value
  if (
    this.isModified("passwordResetProofToken") &&
    this.passwordResetProofToken !== undefined &&
    this.passwordResetProofToken !== null
  ) {
    const salt = await bcrypt.genSalt(10);
    this.passwordResetProofToken = await bcrypt.hash(
      this.passwordResetProofToken,
      salt
    );
  }
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.matchOtp = async function (enteredOtp) {
  if (!this.otp) return false;
  return await bcrypt.compare(enteredOtp, this.otp);
};

userSchema.methods.matchPasswordResetProofToken = async function (
  enteredToken
) {
  if (!this.passwordResetProofToken) return false;
  return await bcrypt.compare(enteredToken, this.passwordResetProofToken);
};

module.exports = mongoose.model("User", userSchema);
