const mongoose = require("mongoose");

//Helper function to create unique id
const generateUniqueId = (prefix = "") =>
  `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

// Sub-schemas for embedding

// Schema for file upload settings (max files, size, allowed types)
const FileSettingsSchema = new mongoose.Schema(
  {
    maxFiles: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxSizeMB: {
      type: Number,
      default: 5,
      min: 0,
    },
    allowedTypes: {
      // Array of allowed extensions (e.g, ['.pdf'])
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

// Schema for individual questions within a form page
const QuestionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      default: () => generateUniqueId("q"),
    },
    questionText: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "text",
        "shortAnswer",
        "longAnswer",
        "multipleChoice",
        "checkbox",
        "dropdown",
        "date",
        "linearScale",
        "rating",
        "fileUpload",
        "image",
        "video",
      ],
      required: true,
    }, // properties specific to certain question types
    options: {
      type: [mongoose.Schema.Types.Mixed], // Accept strings or { id, text }
      default: [],
    },
    mediaUrl: {
      // For 'image' or 'video' questions (if we host media)
      type: String,
      trim: true,
    },
    fileSettings: FileSettingsSchema, // For 'fileUpload' type
    placeholder: {
      // For text input types
      type: String,
      trim: true,
    },
    minRating: {
      // For 'rating' or 'linearScale'
      type: Number,
      min: 0,
      default: 1,
    },
    maxRating: {
      // For 'rating' or 'linearScale'
      type: Number,
      min: 1,
      default: 5,
    },
    labels: {
      // For 'linearScale' (e.g, ['Poor', 'Excellent'])
      type: [String],
      default: [],
    },
    condition: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: false }
);

// Schema for individual condition items within a ConditionalLogic block
const ConditionItemSchema = new mongoose.Schema(
  {
    questionId: {
      // References QuestionSchema.id within the same form
      type: String,
      required: true,
    }, // compared using an 'equals' operator. // empty is treated as a wildcard (any answer for this specific question).

    answerCriteria: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

// Schema for conditional logic (binary tree: true leads to one page, false to another)
const ConditionalLogicSchema = new mongoose.Schema(
  {
    // Array of individual conditions that must ALL be met for the 'true'
    conditions: [ConditionItemSchema],

    truePageId: {
      // References PageSchema.id within the same form
      type: String,
      required: true,
    },

    falsePageId: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Schema for sections within a page
const SectionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      default: () => generateUniqueId("sec"),
    },
    name: {
      type: String,
      trim: true,
    },
    backgroundColor: {
      type: String,
      default: "#F0F0F0",
    },
    questions: [QuestionSchema], // Array of questions of this section
  },
  { _id: false }
);

// Schema for individual pages within a form
const PageSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      default: () => generateUniqueId("page"),
    },
    name: {
      type: String,
      trim: true,
      default: "New Page",
    },
    backgroundColor: {
      type: String,
      default: "#FFFFFF",
    },
    sections: [SectionSchema],
    conditionalLogic: ConditionalLogicSchema,
    nextPageId: {
      type: [String], // Changed to array of strings
      default: [], // Default to empty array
    },
    previousPageId: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: false }
);

// --- Main Form Schema ---
const formSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Form title cannot be more than 200 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      // Link to the project this form belongs to
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    pages: [PageSchema], // Array of pages
    publishedLink: {
      type: String,
      trim: true,
      default: null,
    },
    accessSettings: {
      visibility: {
        // 'public' (View All) or 'private' (Selected Participants)
        type: String,
        enum: ["public", "private"],
        default: "public",
      }, // Users explicitly invited to view/edit/share this form
      sharedWith: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          accessLevel: {
            type: String,
            enum: ["view", "edit", "share"], // View, Edit, Share access
            required: true,
          },
          _id: false, // Don't create default _id for subdocuments
        },
      ],
    }, // Analytics fields (as seen in designs)
    totalViews: {
      type: Number,
      default: 0,
    },
    totalResponses: {
      type: Number,
      default: 0,
    },
    averageResponseTime: {
      // In milliseconds or seconds
      type: Number,
      default: 0,
    },
    dailyViews: [
      {
        date: {
          type: Date,
          required: true,
        },
        count: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Form", formSchema);
