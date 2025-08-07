const Form = require("../models/formModel");
const Project = require("../models/projectModel");
const User = require("../models/userModel");
const Response = require("../models/responseModel");
const {
  deleteFromCloudinary,
  extractPublicId,
} = require("../config/cloudinary/cloudinaryConfig");

// Helper function to check if a user has access to a form
const checkFormAccess = (form, userId, requiredAccessLevel = "view") => {
  // Owner always has all access
  if (form.owner.toString() === userId.toString()) {
    return true;
  }

  // If form is public, anyone can view
  if (
    form.accessSettings.visibility === "public" &&
    requiredAccessLevel === "view"
  ) {
    return true;
  }

  // Check if user is explicitly shared with
  const sharedEntry = form.accessSettings.sharedWith.find(
    (entry) => entry.userId.toString() === userId.toString()
  );

  if (sharedEntry) {
    const accessLevels = { view: 1, share: 2, edit: 3 };
    return (
      accessLevels[sharedEntry.accessLevel] >= accessLevels[requiredAccessLevel]
    );
  }

  return false; // No access
};

//Helper function to create unique id
const generateUniqueId = (prefix = "") =>
  `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

// Helper function to collect media URLs from form pages
const collectMediaUrls = (pages) => {
  const mediaUrls = new Set();

  pages.forEach((page) => {
    page.sections?.forEach((section) => {
      section.questions?.forEach((question) => {
        if (
          (question.type === "image" || question.type === "video") &&
          question.mediaUrl &&
          typeof question.mediaUrl === "string" &&
          question.mediaUrl.includes("cloudinary.com")
        ) {
          mediaUrls.add(question.mediaUrl);
        }
      });
    });
  });

  return Array.from(mediaUrls);
};

// Async cleanup function - runs in background
const cleanupUnusedMediaAsync = async (oldPages, newPages) => {
  // Run cleanup in background without blocking the response
  setImmediate(async () => {
    try {
      await cleanupUnusedMedia(oldPages, newPages);
    } catch (error) {
      console.error("Background media cleanup failed:", error);
    }
  });
};

// Helper function to find and delete unused media
const cleanupUnusedMedia = async (oldPages, newPages) => {
  const oldMediaUrls = new Set(collectMediaUrls(oldPages));
  const newMediaUrls = new Set(collectMediaUrls(newPages));

  // Find URLs that are no longer used
  const urlsToDelete = [...oldMediaUrls].filter(
    (url) => !newMediaUrls.has(url)
  );

  // Delete unused media from Cloudinary
  for (const url of urlsToDelete) {
    try {
      const publicId = extractPublicId(url);
      if (publicId) {
        const resourceType = url.includes("/video/") ? "video" : "image";
        await deleteFromCloudinary(publicId, resourceType);
        console.log(`Deleted unused media: ${publicId}`);
      }
    } catch (error) {
      console.error(`Error deleting media ${url}:`, error);
    }
  }
};

/*
 * @desc    Create a new form within a project
 * @route   POST /api/forms
 * @access  Private (owner of the project)
 * @returns {Object} form - The created form object
 */
exports.createForm = async (req, res) => {
  const { title, projectId } = req.body;
  const owner = req.user._id;

  if (!title || !projectId) {
    return res.status(400).json({
      success: false,
      message: "Please provide a form title and project ID",
    });
  }

  try {
    // Verify that the project exists and belongs to the owner
    const project = await Project.findById(projectId);
    if (!project || project.owner.toString() !== owner.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to create a form in this project",
      });
    }

    // Create a default first page for the new form
    const defaultPageId = generateUniqueId("page");
    const defaultSectionId = generateUniqueId("sec");

    const form = await Form.create({
      title,
      owner,
      projectId,
      pages: [
        {
          id: defaultPageId,
          name: "Page 01",
          backgroundColor: "#FFFFFF",
          sections: [
            {
              id: defaultSectionId,
              name: "Default Section",
              backgroundColor: "#F0F0F0",
              questions: [], // Start with no questions
            },
          ],
        },
      ],
    });

    // Add the new form's ID to the project's forms array
    project.forms.push(form._id);
    await project.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: "Form created successfully",
      form,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate key error, likely email exists",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error creating form" });
  }
};

/*
 * @desc    Get a single form by ID
 * @route   GET /api/forms/:id
 * @access  Private (owner or shared user) / Public (if published and visibility is public)
 * @returns {Object} form - The requested form object
 */
exports.getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);

    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    res.status(200).json({
      success: true,
      form,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid form ID" });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error fetching form" });
  }
};

/*
 * @desc    Update a form by ID (SIMPLIFIED - NO BASE64 PROCESSING)
 * @route   PUT /api/forms/:id
 * @access  Private (owner or user with edit access)
 * @returns {Object} form - The updated form object
 */
exports.updateForm = async (req, res) => {
  const { title, pages, accessSettings, status } = req.body;

  try {
    let form = await Form.findById(req.params.id);

    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    // Store old pages for cleanup
    const oldPages = form.pages || [];

    // Content change detection logic
    const wasPublished = form.status === "published";
    const contentChanged =
      pages && JSON.stringify(oldPages) !== JSON.stringify(pages);

    if (wasPublished && contentChanged) {
      // Run response deletion asynchronously
      setImmediate(async () => {
        try {
          const deleteResult = await Response.deleteMany({ formId: form._id });
          console.log(
            `Deleted ${deleteResult.deletedCount} responses for form ${form._id} due to content change.`
          );
        } catch (error) {
          console.error("Background response deletion failed:", error);
        }
      });

      // Reset analytics counters immediately
      form.totalResponses = 0;
      form.averageResponseTime = 0;
      form.status = "draft";
    }

    // Update fields - pages are expected to already have Cloudinary URLs
    if (title !== undefined) form.title = title;
    if (pages) {
      form.pages = pages;

      // Run cleanup asynchronously for unused media (don't wait for it)
      if (oldPages.length > 0) {
        cleanupUnusedMediaAsync(oldPages, pages);
      }
    }
    if (accessSettings) form.accessSettings = accessSettings;
    if (status !== undefined) form.status = status;

    // Save the form
    form = await form.save({ validateBeforeSave: true });

    res.status(200).json({
      success: true,
      message:
        "Form updated successfully" +
        (wasPublished && contentChanged
          ? " (Previous responses deleted due to content change)."
          : ""),
      form,
    });
  } catch (error) {
    console.error("Form update error:", error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid form ID" });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error updating form" });
  }
};

/*
 * @desc    Delete a form by ID
 * @route   DELETE /api/forms/:id
 * @access  Private (owner only)
 * @returns {Object} message - Confirmation message
 */
exports.deleteForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);

    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    // Only the owner can delete a form
    if (form.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this form",
      });
    }

    // Delete all media associated with this form before deleting the form
    await cleanupUnusedMedia(form.pages, []);

    // Remove the form ID from its associated project's forms array
    const project = await Project.findById(form.projectId);
    if (project) {
      project.forms = project.forms.filter(
        (formId) => formId.toString() !== form._id.toString()
      );
      await project.save({ validateBeforeSave: false });
    }

    // Delete all associated responses for this form
    await Response.deleteMany({ formId: form._id });
    console.log(
      `Deleted all responses for form ${form._id} during form deletion.`
    );

    await form.deleteOne();

    res.status(200).json({
      success: true,
      message:
        "Form deleted successfully (and associated responses and media).",
    });
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid form ID" });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error deleting form" });
  }
};

/*
 * @desc    Get forms by project ID
 * @route   GET /api/forms/project/:projectId
 * @access  Private (project owner)
 * @returns {Array} forms - Array of forms in the project
 */
exports.getFormsByProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const owner = req.user._id;

    // Verify project existence and user's ownership/access to the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // For now, only project owner can see forms in a project.
    // Extend this later for shared project access.
    if (project.owner.toString() !== owner.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view forms in this project",
      });
    }

    const forms = await Form.find({ projectId: projectId, owner: owner }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: forms.length,
      forms,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid project ID" });
    }
    res.status(500).json({
      success: false,
      message: "Server error fetching forms for project",
    });
  }
};

/*
 * @desc    Publish a form
 * @route   PUT /api/forms/:id/publish
 * @access  Private (owner only)
 * @returns {Object} form - The published form object
 */
exports.publishForm = async (req, res) => {
  try {
    let form = await Form.findById(req.params.id);

    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    // Only the owner can publish a form
    if (form.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to publish this form",
      });
    }

    form.status = "published";
    form.publishedLink = `${process.env.FRONTEND_URL}/forms/public/${form._id}`;

    form = await form.save();

    res.status(200).json({
      success: true,
      message: "Form published successfully",
      form,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid form ID" });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error publishing form" });
  }
};

/*
 * @desc    Share a form with another user
 * @route   PUT /api/forms/:id/share
 * @access  Private (owner only)
 * @returns {Object} form - The form with updated sharing settings
 */
exports.shareForm = async (req, res) => {
  const { email, accessLevel } = req.body;

  if (!email || !accessLevel) {
    return res.status(400).json({
      success: false,
      message: "Please provide recipient email and access level",
    });
  }
  if (!["view", "edit", "share"].includes(accessLevel)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid access level provided" });
  }

  try {
    let form = await Form.findById(req.params.id);

    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    if (form.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the form owner can manage sharing permissions.",
      });
    }

    const userToShareWith = await User.findOne({ email });
    if (!userToShareWith) {
      return res
        .status(404)
        .json({ success: false, message: "User with that email not found" });
    }

    if (userToShareWith._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot share a form with yourself" });
    }

    if (userToShareWith._id.toString() === form.owner.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot share a form with its owner",
      });
    }

    const existingShareIndex = form.accessSettings.sharedWith.findIndex(
      (entry) => entry.userId.toString() === userToShareWith._id.toString()
    );

    if (existingShareIndex > -1) {
      form.accessSettings.sharedWith[existingShareIndex].accessLevel =
        accessLevel;
    } else {
      form.accessSettings.sharedWith.push({
        userId: userToShareWith._id,
        accessLevel: accessLevel,
      });
    }

    form = await form.save();

    res.status(200).json({
      success: true,
      message: `Form shared with ${email} with ${accessLevel} access.`,
      form,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid form ID" });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error sharing form" });
  }
};

/*
 * @desc    Get shared forms for the authenticated user
 * @route   GET /api/forms/shared
 * @access  Private
 * @returns {Array} forms - Array of forms shared with the user
 */
exports.getSharedForms = async (req, res) => {
  try {
    const userId = req.user._id;

    const forms = await Form.find({
      "accessSettings.sharedWith.userId": userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: forms.length,
      forms,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching shared forms" });
  }
};

/*
 * @desc    Get a specific form for public viewing (no authentication required)
 * @route   GET /api/forms/public/:id
 * @access  Public
 * @returns {Object} form - The form object if it's publicly accessible
 */
// controllers/formController.js (inside exports.getPublicFormById)

exports.getPublicFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);

    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found." });
    }

    if (
      form.status === "published" &&
      form.accessSettings?.visibility === "public"
    ) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of the day

      // Find if there's an entry for today
      let todayViewEntry = form.dailyViews.find(
        (entry) => entry.date.getTime() === today.getTime()
      );

      if (todayViewEntry) {
        todayViewEntry.count += 1; // Increment count for today
      } else {
        // Add a new entry for today
        form.dailyViews.push({ date: today, count: 1 });
      }

      form.totalViews += 1; // Keep incrementing totalViews
      await form.save({ validateBeforeSave: false });

      const publicFormDetails = {
        _id: form._id,
        title: form.title,
        pages: form.pages,
      };

      return res.status(200).json({ success: true, form: publicFormDetails });
    } else {
      return res.status(403).json({
        success: false,
        message: "This form is not publicly accessible or is not published.",
      });
    }
  } catch (error) {
    console.error("Error fetching public form:", error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid form ID format." });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error fetching public form." });
  }
};
