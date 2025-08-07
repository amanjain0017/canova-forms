const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a project name"],
      trim: true,
      maxlength: [100, "Project name cannot be more than 100 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    forms: [
      // Array of references to Form models
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Form",
      },
    ],
    // for analytics
    totalViews: {
      type: Number,
      default: 0,
    },
    averageViews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);
