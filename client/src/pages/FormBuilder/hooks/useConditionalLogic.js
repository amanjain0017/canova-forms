import { useState, useCallback } from "react";

export const useConditionalLogic = (
  form,
  currentPageId,
  showToast,
  setForm,
  setSelectedElementId
) => {
  const [isConditionModeActive, setIsConditionModeActive] = useState(false);
  const [showSelectPageModal, setShowSelectPageModal] = useState(false);
  const [pendingConditionValues, setPendingConditionValues] = useState({});

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

  // Handler to toggle conditional mode
  const toggleConditionMode = useCallback(() => {
    setIsConditionModeActive((prevState) => {
      const newState = !prevState;
      if (newState) {
        setSelectedElementId(null);
      } else {
        setPendingConditionValues({});
        setShowSelectPageModal(false);
      }
      return newState;
    });
  }, [setSelectedElementId]);

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
      showToast("Conditional logic saved", "success");
    },
    [
      pendingConditionValues,
      currentPageId,
      showToast,
      setForm,
      setSelectedElementId,
    ]
  );

  // Handler to cancel the condition setting process
  const handleCancelCondition = useCallback(() => {
    setPendingConditionValues({});
    setShowSelectPageModal(false);
    setIsConditionModeActive(false);
    setSelectedElementId(null);
  }, [setSelectedElementId]);

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
    [showToast, setForm]
  );

  return {
    isConditionModeActive,
    showSelectPageModal,
    pendingConditionValues,
    toggleConditionMode,
    handleOpenSelectPageModal,
    handleSaveCondition,
    handleCancelCondition,
    handleRemoveCondition,
    getAvailablePagesForCondition,
  };
};
