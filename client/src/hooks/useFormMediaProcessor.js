// hooks/useFormMediaProcessor.js
import { useState, useCallback } from "react";
import cloudinaryUploader from "../utils/cloudinaryUpload";

/**
 * Custom hook to handle media processing for forms
 * Uploads new media files to Cloudinary and prepares form data for saving
 */
export const useFormMediaProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });

  /**
   * Check if a URL is a File object or base64 data that needs uploading
   */
  const needsUpload = (mediaUrl) => {
    if (!mediaUrl) return false;

    // Check if it's a File object
    if (mediaUrl instanceof File) return true;

    // Check if it's base64 data
    if (typeof mediaUrl === "string") {
      return (
        mediaUrl.startsWith("data:image/") || mediaUrl.startsWith("data:video/")
      );
    }

    return false;
  };

  /**
   * Collect all media that needs to be uploaded from form pages
   */
  const collectMediaToUpload = (pages) => {
    const mediaToUpload = [];

    pages.forEach((page, pageIndex) => {
      page.sections?.forEach((section, sectionIndex) => {
        section.questions?.forEach((question, questionIndex) => {
          if (
            (question.type === "image" || question.type === "video") &&
            needsUpload(question.mediaUrl)
          ) {
            mediaToUpload.push({
              pageIndex,
              sectionIndex,
              questionIndex,
              file: question.mediaUrl,
              questionId: question.id,
            });
          }
        });
      });
    });

    return mediaToUpload;
  };

  /**
   * Upload media files and update form pages with Cloudinary URLs
   */
  const processFormMedia = useCallback(async (pages, onProgress = null) => {
    setIsProcessing(true);
    setUploadProgress({ current: 0, total: 0 });

    try {
      // Create a deep copy of pages to avoid mutations
      const processedPages = JSON.parse(JSON.stringify(pages));

      // Collect all media that needs uploading
      const mediaToUpload = collectMediaToUpload(processedPages);

      if (mediaToUpload.length === 0) {
        setIsProcessing(false);
        return { success: true, pages: processedPages, uploadedCount: 0 };
      }

      setUploadProgress({ current: 0, total: mediaToUpload.length });

      // Upload files with controlled concurrency
      const uploadResults = { success: [], failed: [] };
      const BATCH_SIZE = 3; // Process 3 files at a time

      for (let i = 0; i < mediaToUpload.length; i += BATCH_SIZE) {
        const batch = mediaToUpload.slice(i, i + BATCH_SIZE);

        const batchPromises = batch.map(async (mediaItem) => {
          try {
            const url = await cloudinaryUploader.uploadFile(mediaItem.file);
            return { ...mediaItem, url, success: true };
          } catch (error) {
            console.error(
              `Failed to upload media for question ${mediaItem.questionId}:`,
              error
            );
            return { ...mediaItem, error, success: false };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((result, batchIndex) => {
          const currentIndex = i + batchIndex;

          if (result.status === "fulfilled") {
            if (result.value.success) {
              uploadResults.success.push(result.value);
            } else {
              uploadResults.failed.push(result.value);
            }
          } else {
            uploadResults.failed.push({
              ...batch[batchIndex],
              error: new Error("Upload promise rejected"),
              success: false,
            });
          }

          // Update progress
          setUploadProgress({
            current: currentIndex + 1,
            total: mediaToUpload.length,
          });

          // Call progress callback if provided
          if (onProgress) {
            onProgress(currentIndex + 1, mediaToUpload.length);
          }
        });
      }

      // Update the pages with uploaded URLs
      uploadResults.success.forEach(
        ({ pageIndex, sectionIndex, questionIndex, url }) => {
          processedPages[pageIndex].sections[sectionIndex].questions[
            questionIndex
          ].mediaUrl = url;
        }
      );

      // Log any failures
      if (uploadResults.failed.length > 0) {
        console.warn(
          `${uploadResults.failed.length} media uploads failed:`,
          uploadResults.failed
        );
      }

      setIsProcessing(false);

      return {
        success: true,
        pages: processedPages,
        uploadedCount: uploadResults.success.length,
        failedCount: uploadResults.failed.length,
        failures: uploadResults.failed,
      };
    } catch (error) {
      console.error("Error processing form media:", error);
      setIsProcessing(false);

      return {
        success: false,
        error: error.message,
        pages: pages, // Return original pages if processing failed
      };
    }
  }, []);

  /**
   * Process a single media file and return the URL
   */
  const processSingleMedia = useCallback(async (file) => {
    if (!needsUpload(file)) {
      return file; // Return as-is if it doesn't need uploading
    }

    try {
      const url = await cloudinaryUploader.uploadFile(file);
      return url;
    } catch (error) {
      console.error("Error uploading single media file:", error);
      throw error;
    }
  }, []);

  /**
   * Check if any media in the form needs uploading
   */
  const hasMediaToUpload = useCallback((pages) => {
    return collectMediaToUpload(pages).length > 0;
  }, []);

  return {
    processFormMedia,
    processSingleMedia,
    hasMediaToUpload,
    isProcessing,
    uploadProgress,
    cloudinaryUploader, // Expose the uploader instance for direct use if needed
  };
};
