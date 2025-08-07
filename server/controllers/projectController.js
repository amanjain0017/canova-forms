const Project = require("../models/projectModel");
const User = require("../models/userModel");
const Form = require("../models/formModel");
const Response = require("../models/responseModel");

/*
 * desc    Create a new project
 * route   POST /api/projects
 * access  Private
 * returns {Object} project - The created project object
 */
exports.createProject = async (req, res) => {
  const { name } = req.body;
  const owner = req.user._id;

  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide a project name" });
  }

  try {
    const project = await Project.create({
      name,
      owner,
    });

    // Find the user and add the new project's ID to their projects array
    const user = await User.findById(owner);
    if (user) {
      user.projects.push(project._id);
      await user.save({ validateBeforeSave: false }); // Bypass validation as we're just updating an array
    }

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
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
      .json({ success: false, message: "Server error creating project" });
  }
};

/*
 * desc    Get all projects for the authenticated user
 * route   GET /api/projects/myprojects
 * access  Private
 * returns {Array} projects - Array of projects owned by the user
 */
exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching projects" });
  }
};

/*
 * desc    Get a single project by ID
 * route   GET /api/projects/:id
 * access  Private (only owner can access, or shared users with view access - sharing logic to be added)
 * returns {Object} project - The requested project object
 */
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Ensure only the owner can view this project for now.
    // Sharing logic will extend this to include users with view access.
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this project",
      });
    }

    // Increment totalViews for the project
    project.totalViews += 1;
    await project.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid project ID" });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error fetching project" });
  }
};

/*
 * desc    Update a project by ID
 * route   PUT /api/projects/:id
 * access  Private (only owner can update)
 * returns {Object} project - The updated project object
 */
exports.updateProject = async (req, res) => {
  const { name } = req.body;

  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Ensure only the owner can update this project
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }

    project.name = name || project.name;

    project = await project.save();

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid project ID" });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error updating project" });
  }
};

/*
 * desc    Delete a project by ID
 * route   DELETE /api/projects/:id
 * access  Private (only owner can delete)
 * returns {Object} message - Confirmation message
 */
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Ensure only the owner can delete this project
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this project",
      });
    }

    // Remove the project ID from the user's projects array
    const user = await User.findById(req.user._id);
    if (user) {
      user.projects = user.projects.filter(
        (projId) => projId.toString() !== project._id.toString()
      );
      await user.save({ validateBeforeSave: false });
    }

    // Delete all forms within this project and their responses.
    const formsToDelete = await Form.find({ projectId: project._id });
    for (const form of formsToDelete) {
      await Response.deleteMany({ formId: form._id }); // Delete responses for each form
      await form.deleteOne(); // Delete the form itself
    }
    console.log(
      `Deleted ${formsToDelete.length} forms and their responses for project ${project._id}.`
    );

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: "Project deleted successfully (and associated forms/responses).",
    });
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid project ID" });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error deleting project" });
  }
};

/*
 * desc    Get recent work (projects and forms) for the authenticated user
 * route   GET /api/projects/recent
 * returns {Array} recentWorks - Array of the 5 most recently updated projects or forms
 */
exports.getRecentWorks = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = 5; // We want the latest 5 records

    const recentProjects = await Project.find({ owner: userId })
      .sort({ updatedAt: -1 })
      .lean();

    const recentForms = await Form.find({ owner: userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    const combinedWorks = [
      ...recentProjects.map((p) => ({ ...p, type: "project" })),
      ...recentForms.map((f) => ({ ...f, type: "form" })),
    ];

    combinedWorks.sort((a, b) => b.updatedAt - a.updatedAt);

    const recentWorks = combinedWorks.slice(0, limit);

    res.status(200).json({
      success: true,
      count: recentWorks.length,
      recentWorks,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching recent works" });
  }
};
