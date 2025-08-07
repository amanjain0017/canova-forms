// config/cloudinary.js
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type based on file mimetype
    let resourceType = "auto";
    let folder = "form-media";

    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
      folder = "form-media/images";
    } else if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
      folder = "form-media/videos";
    }

    return {
      folder: folder,
      resource_type: resourceType,
      allowed_formats: [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "mp4",
        "avi",
        "mov",
        "webm",
      ],
      transformation: [
        // For images, add some optimization
        ...(resourceType === "image"
          ? [
              { width: 1200, height: 800, crop: "limit" },
              { quality: "auto:good" },
              { fetch_format: "auto" },
            ]
          : []),
        // For videos, add basic optimization
        ...(resourceType === "video"
          ? [
              { quality: "auto:good" },
              { width: 1280, height: 720, crop: "limit" },
            ]
          : []),
      ],
    };
  },
});

// File filter to only allow images and videos
const fileFilter = (req, file, cb) => {
  // Check if file is an image or video
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed!"), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Helper function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = "auto") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
};

// Helper function to extract public ID from Cloudinary URL
const extractPublicId = (cloudinaryUrl) => {
  if (!cloudinaryUrl) return null;

  // Extract public ID from Cloudinary URL
  const matches = cloudinaryUrl.match(/\/v\d+\/(.+)\.[^.]+$/);
  return matches ? matches[1] : null;
};

module.exports = {
  cloudinary,
  upload,
  deleteFromCloudinary,
  extractPublicId,
};
