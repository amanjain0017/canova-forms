const mongoose = require("mongoose");

// Sub-schema for individual answers within a response
const AnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    questionType: {
      type: String,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed, // Mixed type for flexibility
      // required: true, // Not always required if fileUrls is present
    },
    fileUrls: {
      // Array of URLs for uploaded files (for 'fileUpload', 'image', 'video' question types)
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const responseSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },
    // If the responder is an authenticated user
    responderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Null if the response is anonymous
    },

    answers: [AnswerSchema], // Array of answers to the form's questions

    // For analytics: how long it took the user to complete the form
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Response", responseSchema);
