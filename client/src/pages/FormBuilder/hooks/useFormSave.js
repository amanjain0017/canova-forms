// hooks/useFormSave.js
import { useState, useCallback } from "react";
import { buildFormFlow } from "../../../utils/formFlowBuilder";

export const useFormSave = (
  form,
  formId,
  setForm,
  updateForm,
  processFormMedia,
  hasMediaToUpload,
  showToast
) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleBuildFormFlow = useCallback(async () => {
    try {
      // Check if form exists and has pages
      if (!form || !form.pages || form.pages.length === 0) {
        console.warn("No form or pages to build flow for");
        showToast("No form data to build flow", "warning");
        return form?.pages || [];
      }

      // Build the form flow using the imported function - pass the entire form object
      const updatedForm = buildFormFlow(form);

      // Update the form state with the new flow structure
      setForm((prevForm) => ({
        ...prevForm,
        pages: updatedForm.pages,
      }));

      showToast("Form flow updated", "success");

      return updatedForm.pages;
    } catch (error) {
      console.error("Error building form flow:", error);
      showToast("Error building form flow", "error");
      throw error;
    }
  }, [form, showToast, setForm]);

  const handleSaveForm = useCallback(async () => {
    if (!form || !formId) {
      showToast("No form data to save or form ID is missing.", "error");
      return;
    }

    setIsSaving(true);

    try {
      let formToSave = form;

      // Step 1: Build form flow first to ensure navigation is set
      try {
        // Check if form has pages before building flow
        if (form.pages && form.pages.length > 0) {
          const updatedFormWithFlow = buildFormFlow(form); // Pass entire form object

          // Update form with the flow structure
          formToSave = { ...form, pages: updatedFormWithFlow.pages };

          // Update local state with flow (so UI reflects the changes)
          setForm(formToSave);
        } else {
          console.warn("No pages to build flow for");
        }
      } catch (flowError) {
        console.error("Error building form flow during save:", flowError);
        showToast("Warning: Could not build form flow", "warning");
        // Continue with save even if flow building fails
      }

      // Step 2: Check if there's any media that needs uploading
      const needsMediaUpload = hasMediaToUpload(formToSave.pages);

      if (needsMediaUpload) {
        showToast("Uploading media files...", "info");

        // Process media uploads with progress callback
        const mediaResult = await processFormMedia(
          formToSave.pages,
          (current, total) => {
            // You can update UI with upload progress here if needed
            console.log(`Uploading media: ${current}/${total}`);
          }
        );

        if (!mediaResult.success) {
          throw new Error(mediaResult.error || "Failed to upload media files");
        }

        // Update form with processed pages (now containing Cloudinary URLs)
        formToSave = { ...formToSave, pages: mediaResult.pages };

        if (mediaResult.failedCount > 0) {
          showToast(
            `${mediaResult.uploadedCount} files uploaded successfully, ${mediaResult.failedCount} failed`,
            "warning"
          );
        } else {
          showToast(
            `${mediaResult.uploadedCount} media files uploaded successfully`,
            "success"
          );
        }
      }

      // Step 3: Prepare update payload - now contains flow navigation AND Cloudinary URLs
      const updatePayload = {
        title: formToSave.title,
        pages: formToSave.pages, // This now includes nextPageId and prevPageId
        accessSettings: formToSave.accessSettings,
        status: formToSave.status,
      };

      // Step 4: Save to backend
      const result = await updateForm(formId, updatePayload);

      if (result.success) {
        // Update local state with the final saved form structure
        setForm(formToSave);
        showToast("Form draft saved", "success");
      } else {
        throw new Error(result.message || "Failed to save form");
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast(
        error.message || "Failed to save form. Please try again.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    form,
    formId,
    updateForm,
    processFormMedia,
    hasMediaToUpload,
    showToast,
    setForm,
  ]);

  return {
    handleSaveForm,
    isSaving,
    handleBuildFormFlow,
  };
};
