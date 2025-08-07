// utils/cloudinaryUpload.js
class CloudinaryUploader {
  constructor(cloudName, uploadPreset) {
    this.cloudName = cloudName;
    this.uploadPreset = uploadPreset;
    this.baseUrl = `https://api.cloudinary.com/v1_1/${cloudName}`;
  }

  /**
   * Upload a file directly to Cloudinary
   * @param {File} file - The file to upload
   * @param {Object} options - Upload options
   * @returns {Promise<string>} - The secure URL of the uploaded file
   */
  async uploadFile(file, options = {}) {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", this.uploadPreset);

    // Determine resource type
    const resourceType = file.type.startsWith("video/") ? "video" : "image";

    // Organize into folder
    const folder =
      resourceType === "video" ? "form-media/videos" : "form-media/images";
    formData.append("folder", folder);

    // Add any additional options
    Object.keys(options).forEach((key) => {
      formData.append(key, options[key]);
    });

    try {
      const response = await fetch(`${this.baseUrl}/${resourceType}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Cloudinary upload failed: ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  }

  /**
   * Upload multiple files with concurrency control
   * @param {File[]} files - Array of files to upload
   * @param {number} concurrency - Maximum concurrent uploads
   * @returns {Promise<{success: string[], failed: {file: File, error: Error}[]}>}
   */
  async uploadMultipleFiles(files, concurrency = 3) {
    const results = { success: [], failed: [] };

    // Process files in batches
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);

      const batchPromises = batch.map(async (file) => {
        try {
          const url = await this.uploadFile(file);
          return { file, url, success: true };
        } catch (error) {
          return { file, error, success: false };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result) => {
        if (result.status === "fulfilled") {
          if (result.value.success) {
            results.success.push({
              file: result.value.file,
              url: result.value.url,
            });
          } else {
            results.failed.push({
              file: result.value.file,
              error: result.value.error,
            });
          }
        } else {
          // This shouldn't happen with our current setup, but just in case
          results.failed.push({
            file: null,
            error: new Error("Promise rejected unexpectedly"),
          });
        }
      });
    }

    return results;
  }

  /**
   * Delete a file from Cloudinary
   * @param {string} publicId - The public ID of the file to delete
   * @param {string} resourceType - 'image' or 'video'
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(publicId, resourceType = "image") {
    // Note: Deletion requires authentication and is typically done server-side
    // This is a placeholder for potential future implementation
    console.warn("File deletion should be handled server-side for security");
    return false;
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param {string} url - Cloudinary URL
   * @returns {string} - Public ID
   */
  extractPublicId(url) {
    if (!url || typeof url !== "string") return null;

    try {
      const parts = url.split("/");
      const uploadIndex = parts.findIndex((part) => part === "upload");

      if (uploadIndex === -1) return null;

      // Get everything after 'upload' and any version/transformation parameters
      let pathParts = parts.slice(uploadIndex + 1);

      // Remove version if present (starts with 'v')
      if (
        pathParts[0] &&
        pathParts[0].startsWith("v") &&
        /^\d+$/.test(pathParts[0].substring(1))
      ) {
        pathParts = pathParts.slice(1);
      }

      // Join the remaining parts and remove file extension
      const fullPath = pathParts.join("/");
      const lastDotIndex = fullPath.lastIndexOf(".");

      return lastDotIndex > 0 ? fullPath.substring(0, lastDotIndex) : fullPath;
    } catch (error) {
      console.error("Error extracting public ID:", error);
      return null;
    }
  }
}

const cloud_name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const cloud_upload_preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Create and export a singleton instance
const cloudinaryUploader = new CloudinaryUploader(
  cloud_name || "your-cloud-name",
  cloud_upload_preset || "your-media-preset"
);

export default cloudinaryUploader;
