const Form = require("../models/formModel");
const Response = require("../models/responseModel");

// Helper function to check form access for submission (public or private)
const checkFormSubmissionAccess = async (form, req) => {
  // If form is public, anyone can submit
  if (form.accessSettings.visibility === "public") {
    return true;
  }

  // If form is private, only authenticated users who are shared with can submit
  if (req.user) {
    // Check if user is authenticated (from protect middleware, if applied)
    const sharedEntry = form.accessSettings.sharedWith.find(
      (entry) => entry.userId.toString() === req.user._id.toString()
    );
    // For submission, 'view' access is generally sufficient, but you might want to restrict to 'edit' or 'share' if only collaborators can submit.
    // Assuming 'view' access is enough to fill out a private form.
    if (
      sharedEntry &&
      ["view", "edit", "share"].includes(sharedEntry.accessLevel)
    ) {
      return true;
    }
  }

  return false; // No access
};

// Helper function to check form access for viewing responses (owner only)
const checkResponseViewAccess = (form, userId) => {
  // Owner always has access
  if (form.owner.toString() === userId.toString()) {
    return true;
  }

  return false; // No access for anyone else
};

/*
 * @desc    Submit a form response
 * @route   POST /api/responses/:formId
 * @access  Public (if form is public) or Private (if form is private and user is invited)
 * @returns {Object} response - The created response object
 */
exports.submitFormResponse = async (req, res) => {
  const formId = req.params.formId;
  const { answers, timeTakenSeconds } = req.body; // Expecting an array of answers

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide answers for the form" });
  }

  try {
    const form = await Form.findById(formId);
    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    // Check if the form is published
    if (form.status !== "published") {
      return res.status(403).json({
        success: false,
        message: "This form is not published and cannot receive responses.",
      });
    }

    // Check submission access
    const hasAccess = await checkFormSubmissionAccess(form, req); // Pass req to check for req.user
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to submit a response to this form.",
      });
    }

    // Determine responder ID (if authenticated)
    const responderId = req.user ? req.user._id : null;

    // Process answers - no file processing needed, just store as received
    const processedAnswers = answers.map((answer) => {
      return {
        questionId: answer.questionId,
        questionType: answer.questionType,
        value: answer.value,
        fileUrls: answer.fileUrls || [], // Store the blob URLs or file URLs as received
      };
    });

    // Create the response
    const response = await Response.create({
      formId,
      responderId,
      answers: processedAnswers,
      timeTakenSeconds: timeTakenSeconds || 0,
    });

    // Update form analytics: totalResponses, totalViews (if not already incremented by form view)
    form.totalResponses += 1;
    // You might want to increment totalViews here if this is the first interaction,
    // or handle it in getFormById if that's considered a "view".
    await form.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: "Form response submitted successfully",
      response,
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
      .json({ success: false, message: "Server error submitting response" });
  }
};

/*
 * @desc    Get all responses for a specific form
 * @route   GET /api/responses/form/:formId
 * @access  Private (only form owner or users with edit/view access to form analytics)
 * @returns {Array} responses - Array of responses for the form
 */
exports.getFormResponses = async (req, res) => {
  try {
    const formId = req.params.formId;

    const form = await Form.findById(formId);
    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    // Check if the user has access to view responses for this form
    if (!checkResponseViewAccess(form, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view responses for this form",
      });
    }

    const responses = await Response.find({ formId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: responses.length,
      responses,
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
      .json({ success: false, message: "Server error fetching responses" });
  }
};

/*
 * @desc    Get a single response by ID
 * @route   GET /api/responses/:id
 * @access  Private (only form owner or users with edit/view access to form analytics)
 * @returns {Object} response - The requested response object
 */
exports.getResponseById = async (req, res) => {
  try {
    const response = await Response.findById(req.params.id);

    if (!response) {
      return res
        .status(404)
        .json({ success: false, message: "Response not found" });
    }

    const form = await Form.findById(response.formId);
    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Associated form not found" });
    }

    // Check if the user has access to view this specific response via its form
    if (!checkResponseViewAccess(form, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this response",
      });
    }

    res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid response ID" });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error fetching response" });
  }
};
