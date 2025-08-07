import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useParams } from "react-router-dom";
import { useFormContext } from "../../context/FormContext";
import { useFormMediaProcessor } from "../../hooks/useFormMediaProcessor";

import "./FormBuilder.css";
import FormBuilderSidebar from "./FormBuilderSidebar";
import FormHeader from "./FormHeader";
import FormCanvas from "./FormCanvas";
import FormElementsPanel from "./FormElementsPanel";
import SelectPageModal from "./SelectPageModal";
import PreviewModal from "./PreviewModal";
import Toast from "./../../components/Toast/Toast";

import { buildFormFlow } from "../../utils/formFlowBuilder";

// Helper to generate unique IDs
const generateUniqueId = (prefix = "") =>
  `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

const FormBuilder = React.memo(() => {
  const { theme } = useTheme();
  const { formId } = useParams();
  const {
    getFormById,
    loading: contextLoading,
    error: contextError,
    updateForm,
  } = useFormContext();

  // Media processor hook
  const {
    processFormMedia,
    processSingleMedia,
    hasMediaToUpload,
    isProcessing: isUploadingMedia,
    uploadProgress,
  } = useFormMediaProcessor();

  // State for the form structure - will be populated from API
  const [form, setForm] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch form data on component mount
  useEffect(() => {
    const fetchForm = async () => {
      if (formId) {
        setIsInitialLoading(true);
        const result = await getFormById(formId);
        if (result.success && result.form) {
          setForm(result.form);
        }
        setIsInitialLoading(false);
      }
    };

    fetchForm();
  }, []);

  const [currentPageId, setCurrentPageId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);

  // console.log(form);

  // Set currentPageId when form is loaded
  useEffect(() => {
    if (form && form.pages && form.pages.length > 0 && !currentPageId) {
      setCurrentPageId(form.pages[0].id);
    }
  }, [form, currentPageId]);

  // State for conditional logic mode
  const [isConditionModeActive, setIsConditionModeActive] = useState(false);
  const [showSelectPageModal, setShowSelectPageModal] = useState(false);
  const [pendingConditionValues, setPendingConditionValues] = useState({});

  // State for preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // New state for Toast messages
  const [toastMessage, setToastMessage] = useState(null);

  // Function to display a toast message
  const showToast = useCallback((text, type) => {
    setToastMessage({ text, type });
  }, []);

  // Function to clear the toast message
  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Derived state for the current page - memoized to prevent unnecessary recalculations
  const currentPage = useMemo(() => {
    return form?.pages?.find((page) => page.id === currentPageId);
  }, [form?.pages, currentPageId]);

  // Get available pages for conditions (excluding current page and pages that would create loops)
  const getAvailablePagesForCondition = useCallback(() => {
    if (!form?.pages) return [];

    const currentIndex = form.pages.findIndex(
      (page) => page.id === currentPageId
    );

    // Step 1: Gather all page IDs already used as truePageId or falsePageId
    const usedInConditions = new Set();
    form.pages.forEach((page) => {
      if (page.conditionalLogic) {
        if (page.conditionalLogic.truePageId) {
          usedInConditions.add(page.conditionalLogic.truePageId);
        }
        if (page.conditionalLogic.falsePageId) {
          usedInConditions.add(page.conditionalLogic.falsePageId);
        }
      }
    });

    // Step 2: Return only pages after current one and not already used
    return form.pages
      .slice(currentIndex + 1)
      .filter((page) => !usedInConditions.has(page.id));
  }, [form?.pages, currentPageId]);

  // Handler to show preview modal
  const handlePreview = useCallback(() => {
    setShowPreviewModal(true);
  }, []);

  // Handler to close preview modal
  const handleClosePreview = useCallback(() => {
    setShowPreviewModal(false);
  }, []);

  // Handler to toggle conditional mode
  const toggleConditionMode = useCallback(() => {
    setIsConditionModeActive((prevState) => {
      const newState = !prevState;
      if (newState) {
        setSelectedSectionId(null);
        setSelectedElementId(null);
      } else {
        setPendingConditionValues({});
        setShowSelectPageModal(false);
      }
      return newState;
    });
  }, []);

  // Handler to open the SelectPageModal with condition values
  const handleOpenSelectPageModal = useCallback(
    (conditionValues) => {
      const availablePages = getAvailablePagesForCondition();
      if (availablePages.length < 2) {
        showToast(
          "Minimum of two pages after current page required (should not be targets of another condition)",
          "error"
        );
        return;
      }

      setPendingConditionValues(conditionValues);
      setShowSelectPageModal(true);
    },
    [getAvailablePagesForCondition, showToast]
  );

  // Handler to save the condition to the form state
  const handleSaveCondition = useCallback(
    ({ truePageId, falsePageId }) => {
      if (!currentPageId || Object.keys(pendingConditionValues).length === 0) {
        console.error(
          "Missing currentPageId or condition values when saving condition."
        );
        showToast("Error: Missing page ID or condition values.", "error");
        return;
      }

      // Create conditions array from pendingConditionValues
      const conditions = Object.entries(pendingConditionValues).map(
        ([questionId, value]) => ({
          questionId,
          answerCriteria: Array.isArray(value)
            ? value.join(",")
            : String(value),
        })
      );

      // Update the current page with conditional logic
      setForm((prevForm) => ({
        ...prevForm,
        pages: prevForm.pages.map((page) =>
          page.id === currentPageId
            ? {
                ...page,
                conditionalLogic: {
                  conditions,
                  truePageId,
                  falsePageId,
                },
              }
            : page
        ),
      }));

      // Reset condition mode states after saving
      setPendingConditionValues({});
      setShowSelectPageModal(false);
      setIsConditionModeActive(false);
      setSelectedElementId(null);
      showToast("Conditional logic saved ", "success");
    },
    [pendingConditionValues, currentPageId, showToast]
  );

  // Handler to cancel the condition setting process
  const handleCancelCondition = useCallback(() => {
    setPendingConditionValues({});
    setShowSelectPageModal(false);
    setIsConditionModeActive(false);
    setSelectedElementId(null);
  }, []);

  // Handler to remove condition from a page
  const handleRemoveCondition = useCallback(
    (pageId) => {
      setForm((prevForm) => ({
        ...prevForm,
        pages: prevForm.pages.map((page) =>
          page.id === pageId ? { ...page, conditionalLogic: null } : page
        ),
      }));
      showToast("Conditional logic removed.", "success");
    },
    [showToast]
  );

  // Handler to navigate directly to a page (for sidebar navigation)
  const handleDirectPageNavigation = useCallback((pageId) => {
    setCurrentPageId(pageId);
    setSelectedSectionId(null);
    setSelectedElementId(null);
  }, []);

  const handleAddPage = useCallback(() => {
    setForm((prevForm) => {
      const newPage = {
        id: generateUniqueId("page"),
        name: `Page ${String(prevForm.pages.length + 1).padStart(2, "0")}`,
        backgroundColor: "#ffffff",
        sections: [
          {
            id: generateUniqueId("sec"),
            name: "New Section",
            backgroundColor: "#f9f9f9",
            questions: [],
          },
        ],
        conditionalLogic: null,
      };
      const updatedPages = [...prevForm.pages, newPage];
      setCurrentPageId(newPage.id);
      setSelectedSectionId(null);
      setSelectedElementId(null);
      showToast("New page added", "success");
      return { ...prevForm, pages: updatedPages };
    });
  }, [showToast]);

  const handleDeletePage = useCallback(
    (pageIdToDelete) => {
      setForm((prevForm) => {
        if (prevForm.pages.length <= 1) {
          showToast("Cannot delete the last page", "error");
          return prevForm;
        }

        // Check if any other pages reference this page in their conditions
        const referencingPages = prevForm.pages.filter(
          (page) =>
            page.conditionalLogic &&
            (page.conditionalLogic.truePageId === pageIdToDelete ||
              page.conditionalLogic.falsePageId === pageIdToDelete)
        );

        if (referencingPages.length > 0) {
          const pageNames = referencingPages.map((p) => p.name).join(", ");
          showToast(
            `Cannot delete this page. It is referenced by conditions in: ${pageNames}`,
            "error"
          );

          // Update the name of the page being "deleted" to "Untitled page"
          const updatedPagesOnFail = prevForm.pages.map((page) =>
            page.id === pageIdToDelete
              ? { ...page, name: "Untitled page" }
              : page
          );
          return { ...prevForm, pages: updatedPagesOnFail };
        }

        const updatedPages = prevForm.pages.filter(
          (page) => page.id !== pageIdToDelete
        );
        const newCurrentPageId =
          currentPageId === pageIdToDelete ? updatedPages[0].id : currentPageId;

        setCurrentPageId(newCurrentPageId);
        setSelectedSectionId(null);
        setSelectedElementId(null);
        showToast("Page deleted", "success");
        return { ...prevForm, pages: updatedPages };
      });
    },
    [currentPageId, showToast]
  );

  const handleUpdatePageTitle = useCallback(
    (newTitle) => {
      setForm((prevForm) => ({
        ...prevForm,
        pages: prevForm.pages.map((page) =>
          page.id === currentPageId ? { ...page, name: newTitle } : page
        ),
      }));
    },
    [currentPageId]
  );

  const handleUpdatePageBackgroundColor = useCallback(
    (newColor) => {
      setForm((prevForm) => ({
        ...prevForm,
        pages: prevForm.pages.map((page) =>
          page.id === currentPageId
            ? { ...page, backgroundColor: newColor }
            : page
        ),
      }));
    },
    [currentPageId]
  );

  const handleAddSection = useCallback(() => {
    setForm((prevForm) => {
      const updatedPages = prevForm.pages.map((page) => {
        if (page.id === currentPageId) {
          const newSection = {
            id: generateUniqueId("sec"),
            name: `Section ${page.sections.length + 1}`,
            backgroundColor: "#f9f9f9",
            questions: [],
          };
          setSelectedSectionId(newSection.id);
          setSelectedElementId(null);
          showToast("New section added", "success");
          return { ...page, sections: [...page.sections, newSection] };
        }
        return page;
      });
      return { ...prevForm, pages: updatedPages };
    });
  }, [currentPageId, showToast]);

  const handleDeleteSection = useCallback(
    (sectionIdToDelete) => {
      setForm((prevForm) => {
        const updatedPages = prevForm.pages.map((page) => {
          if (page.id === currentPageId) {
            const updatedSections = page.sections.filter(
              (sec) => sec.id !== sectionIdToDelete
            );

            if (updatedSections.length === 0) {
              showToast("Cannot delete the last section", "error");
              return {
                ...page,
                sections: [
                  {
                    id: generateUniqueId("sec"),
                    name: "New Section",
                    backgroundColor: "#f9f9f9",
                    questions: [],
                  },
                ],
              };
            }
            showToast("Section deleted", "success");
            return { ...page, sections: updatedSections };
          }
          return page;
        });

        const currentPageAfterDelete = updatedPages.find(
          (p) => p.id === currentPageId
        );
        let newSelectedSectionId = null;
        if (
          currentPageAfterDelete &&
          currentPageAfterDelete.sections.length > 0
        ) {
          newSelectedSectionId = currentPageAfterDelete.sections[0].id;
        }

        setSelectedSectionId(newSelectedSectionId);
        setSelectedElementId(null);
        return { ...prevForm, pages: updatedPages };
      });
    },
    [currentPageId, showToast]
  );

  const handleUpdateSectionColor = useCallback(
    (sectionId, newColor) => {
      setForm((prevForm) => ({
        ...prevForm,
        pages: prevForm.pages.map((page) =>
          page.id === currentPageId
            ? {
                ...page,
                sections: page.sections.map((section) =>
                  section.id === sectionId
                    ? { ...section, backgroundColor: newColor }
                    : section
                ),
              }
            : page
        ),
      }));
    },
    [currentPageId]
  );

  // Updated handleAddQuestion to upload media directly to Cloudinary
  const handleAddQuestion = useCallback(
    async (type, sectionId, initialMediaData = null) => {
      let mediaUrlToStore = "";

      // If there's media data, upload it to Cloudinary immediately
      if (initialMediaData) {
        try {
          showToast("Uploading media...", "info");
          mediaUrlToStore = await processSingleMedia(initialMediaData);
          showToast("Media uploaded", "success");
        } catch (error) {
          console.error("Error uploading media to Cloudinary:", error);
          showToast("Error uploading media. Please try again.", "error");
          return;
        }
      }

      setForm((prevForm) => {
        const updatedPages = prevForm.pages.map((page) => {
          if (page.id === currentPageId) {
            const updatedSections = page.sections.map((section) => {
              if (section.id === sectionId) {
                let newQuestion;
                switch (type) {
                  case "shortAnswer":
                  case "longAnswer":
                  case "date":
                  case "text":
                    newQuestion = {
                      id: generateUniqueId("q"),
                      type: type,
                      questionText:
                        type === "text" ? "Click to edit text" : "What is ?",
                      condition: null,
                    };
                    break;
                  case "multipleChoice":
                  case "checkbox":
                  case "dropdown":
                    newQuestion = {
                      id: generateUniqueId("q"),
                      type: type,
                      questionText: "What is ?",
                      options: ["Option 01", "Option 02"],
                      condition: null,
                    };
                    break;
                  case "fileUpload":
                    newQuestion = {
                      id: generateUniqueId("q"),
                      type: type,
                      questionText: "Upload Files",
                      fileSettings: {
                        maxFiles: 1,
                        maxSizeMB: 5,
                        allowedTypes: [],
                      },
                      condition: null,
                    };
                    break;
                  case "linearScale":
                  case "rating":
                    newQuestion = {
                      id: generateUniqueId("q"),
                      type: type,
                      questionText:
                        type === "linearScale"
                          ? "Rate on a scale"
                          : "Rate this",
                      ...(type === "linearScale"
                        ? {
                            minRating: 0,
                            maxRating: 10,
                            labels: ["Low", "High"],
                          }
                        : { maxRating: 5 }),
                      condition: null,
                    };
                    break;
                  case "image":
                  case "video":
                    newQuestion = {
                      id: generateUniqueId("q"),
                      type: type,
                      questionText: "",
                      mediaUrl: mediaUrlToStore, // Now contains Cloudinary URL
                      condition: null,
                    };
                    break;
                  default:
                    console.warn(`Unknown question type: ${type}`);
                    showToast(`Unknown question type: ${type}`, "error");
                    return section;
                }

                if (!initialMediaData) {
                  showToast("New field added", "success");
                }

                return {
                  ...section,
                  questions: [...section.questions, newQuestion],
                };
              }
              return section;
            });
            return { ...page, sections: updatedSections };
          }
          return page;
        });
        return { ...prevForm, pages: updatedPages };
      });
    },
    [currentPageId, showToast, processSingleMedia]
  );

  const handleUpdateQuestionText = useCallback(
    (sectionId, questionId, newText) => {
      setForm((prevForm) => ({
        ...prevForm,
        pages: prevForm.pages.map((page) =>
          page.id === currentPageId
            ? {
                ...page,
                sections: page.sections.map((section) =>
                  section.id === sectionId
                    ? {
                        ...section,
                        questions: section.questions.map((question) =>
                          question.id === questionId
                            ? { ...question, questionText: newText }
                            : question
                        ),
                      }
                    : section
                ),
              }
            : page
        ),
      }));
    },
    [currentPageId]
  );

  const handleUpdateQuestionProperty = useCallback(
    (sectionId, questionId, propertyName, newValue) => {
      setForm((prevForm) => ({
        ...prevForm,
        pages: prevForm.pages.map((page) =>
          page.id === currentPageId
            ? {
                ...page,
                sections: page.sections.map((section) =>
                  section.id === sectionId
                    ? {
                        ...section,
                        questions: section.questions.map((question) => {
                          if (question.id === questionId) {
                            if (propertyName === "fileSettings") {
                              return {
                                ...question,
                                fileSettings: {
                                  ...question.fileSettings,
                                  ...newValue,
                                },
                              };
                            } else if (propertyName === "labels") {
                              return { ...question, labels: newValue };
                            } else if (
                              propertyName === "minRating" ||
                              propertyName === "maxRating"
                            ) {
                              return { ...question, [propertyName]: newValue };
                            }
                          }
                          return question;
                        }),
                      }
                    : section
                ),
              }
            : page
        ),
      }));
    },
    [currentPageId]
  );

  const handleUpdateQuestionType = useCallback(
    (sectionId, questionId, newType) => {
      setForm((prevForm) => ({
        ...prevForm,
        pages: prevForm.pages.map((page) =>
          page.id === currentPageId
            ? {
                ...page,
                sections: page.sections.map((section) =>
                  section.id === sectionId
                    ? {
                        ...section,
                        questions: section.questions.map((question) => {
                          if (question.id === questionId) {
                            let updatedQuestion = {
                              ...question,
                              type: newType,
                            };
                            if (
                              [
                                "multipleChoice",
                                "checkbox",
                                "dropdown",
                              ].includes(newType) &&
                              !question.options
                            ) {
                              updatedQuestion.options = ["Option 1"];
                            } else if (
                              ![
                                "multipleChoice",
                                "checkbox",
                                "dropdown",
                              ].includes(newType) &&
                              question.options
                            ) {
                              const { options, ...rest } = updatedQuestion;
                              updatedQuestion = rest;
                            }
                            if (
                              newType === "fileUpload" &&
                              !question.fileSettings
                            ) {
                              updatedQuestion.fileSettings = {
                                maxFiles: 1,
                                maxSizeMB: 5,
                                allowedTypes: [],
                              };
                            } else if (
                              newType === "linearScale" &&
                              (question.minRating === undefined ||
                                question.maxRating === undefined)
                            ) {
                              updatedQuestion.minRating = 0;
                              updatedQuestion.maxRating = 10;
                              updatedQuestion.labels = ["Low", "High"];
                            } else if (
                              newType === "rating" &&
                              question.maxRating === undefined
                            ) {
                              updatedQuestion.maxRating = 5;
                            }
                            return updatedQuestion;
                          }
                          return question;
                        }),
                      }
                    : section
                ),
              }
            : page
        ),
      }));
    },
    [currentPageId]
  );

  const handleUpdateOptionText = useCallback(
    (sectionId, questionId, optionIndex, newText) => {
      setForm((prevForm) => ({
        ...prevForm,
        pages: prevForm.pages.map((page) =>
          page.id === currentPageId
            ? {
                ...page,
                sections: page.sections.map((section) =>
                  section.id === sectionId
                    ? {
                        ...section,
                        questions: section.questions.map((question) =>
                          question.id === questionId
                            ? {
                                ...question,
                                options: question.options.map((opt, idx) =>
                                  idx === optionIndex ? newText : opt
                                ),
                              }
                            : question
                        ),
                      }
                    : section
                ),
              }
            : page
        ),
      }));
    },
    [currentPageId]
  );

  const handleAddOption = useCallback(
    (sectionId, questionId, afterIndex) => {
      setForm((prevForm) => ({
        ...prevForm,
        pages: prevForm.pages.map((page) =>
          page.id === currentPageId
            ? {
                ...page,
                sections: page.sections.map((section) =>
                  section.id === sectionId
                    ? {
                        ...section,
                        questions: section.questions.map((question) =>
                          question.id === questionId
                            ? {
                                ...question,
                                options: [
                                  ...question.options.slice(0, afterIndex + 1),
                                  `Option ${question.options.length + 1}`,
                                  ...question.options.slice(afterIndex + 1),
                                ],
                              }
                            : question
                        ),
                      }
                    : section
                ),
              }
            : page
        ),
      }));
    },
    [currentPageId]
  );

  const handleDeleteOption = useCallback(
    (sectionId, questionId, optionIndex) => {
      setForm((prevForm) => ({
        ...prevForm,
        pages: prevForm.pages.map((page) =>
          page.id === currentPageId
            ? {
                ...page,
                sections: page.sections.map((section) =>
                  section.id === sectionId
                    ? {
                        ...section,
                        questions: section.questions.map((question) =>
                          question.id === questionId
                            ? {
                                ...question,
                                options: question.options.filter(
                                  (_, idx) => idx !== optionIndex
                                ),
                              }
                            : question
                        ),
                      }
                    : section
                ),
              }
            : page
        ),
      }));
    },
    [currentPageId]
  );

  const handleDeleteQuestion = useCallback(
    (sectionId, elementId) => {
      setForm((prevForm) => {
        const updatedPages = prevForm.pages.map((page) => {
          if (page.id === currentPageId) {
            const updatedSections = page.sections.map((section) => {
              if (section.id === sectionId) {
                const updatedQuestions = section.questions.filter(
                  (q) => q.id !== elementId
                );
                return { ...section, questions: updatedQuestions };
              }
              return section;
            });
            return { ...page, sections: updatedSections };
          }
          return page;
        });

        if (selectedElementId === elementId) {
          setSelectedElementId(null);
        }
        showToast("Field deleted", "success");
        return { ...prevForm, pages: updatedPages };
      });
    },
    [currentPageId, selectedElementId]
  );

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
  }, [form, showToast]); // Changed dependency from form.pages to form

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
  }, [form, formId, updateForm, processFormMedia, hasMediaToUpload, showToast]);

  // Show loading state while fetching initial form data
  if (isInitialLoading || !form) {
    return (
      <div className={`form-builder-page ${theme}`}>
        <div className="loading-container">
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's a context error
  if (contextError) {
    return (
      <div className={`form-builder-page ${theme}`}>
        <div className="error-container">
          <p>Error loading form: {contextError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`form-builder-page ${theme}`}>
      <FormBuilderSidebar
        pages={form.pages}
        form={form}
        onAddPage={handleAddPage}
        currentPageId={currentPageId}
        onPageSelect={handleDirectPageNavigation}
        onRemoveCondition={handleRemoveCondition}
        isConditionModeActive={isConditionModeActive}
      />
      <div className="form-builder-main">
        <FormHeader
          form={form}
          pageTitle={currentPage ? currentPage.name : "Page"}
          onUpdatePageTitle={handleUpdatePageTitle}
          onDeletePage={() => handleDeletePage(currentPageId)}
          onPreview={handlePreview}
          onSaveForm={handleSaveForm}
        />
        <div className="form-builder-action">
          <FormCanvas
            formId={formId}
            currentPage={currentPage}
            onUpdateQuestionText={handleUpdateQuestionText}
            onUpdateQuestionType={handleUpdateQuestionType}
            onUpdateOptionText={handleUpdateOptionText}
            onDeleteQuestion={handleDeleteQuestion}
            onDeleteOption={handleDeleteOption}
            onAddOption={handleAddOption}
            onUpdateQuestionProperty={handleUpdateQuestionProperty}
            selectedSectionId={selectedSectionId}
            onSelectSection={setSelectedSectionId}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onDeleteSection={handleDeleteSection}
            // Conditional mode props
            isConditionModeActive={isConditionModeActive}
            onSelectQuestionForCondition={null}
            questionForCondition={null}
            onOpenSelectPageModal={handleOpenSelectPageModal}
            onRemoveCondition={handleRemoveCondition}
          />
          <FormElementsPanel
            currentPage={currentPage}
            form={form} // ADD THIS LINE
            onAddQuestion={handleAddQuestion}
            onAddSection={handleAddSection}
            onUpdatePageBackgroundColor={handleUpdatePageBackgroundColor}
            onUpdateSectionColor={handleUpdateSectionColor}
            selectedSectionId={selectedSectionId}
            selectedElementId={selectedElementId}
            isConditionModeActive={isConditionModeActive}
            onToggleConditionMode={toggleConditionMode}
            onBuildFormFlow={handleBuildFormFlow}
          />
        </div>
      </div>

      {/* Select Page Modal for Conditional Logic */}
      <SelectPageModal
        isVisible={showSelectPageModal}
        onClose={handleCancelCondition}
        onSave={handleSaveCondition}
        pages={getAvailablePagesForCondition()}
        questionForCondition={null}
      />

      {/* Preview Modal */}
      <PreviewModal
        isVisible={showPreviewModal}
        onClose={handleClosePreview}
        currentPage={currentPage}
        form={form}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={clearToast} duration={3000} />
    </div>
  );
});

export default FormBuilder;
