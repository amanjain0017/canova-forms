import { useState, useEffect, useCallback } from "react";

export const usePageNavigation = (form) => {
  const [currentPageId, setCurrentPageId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);

  // Set currentPageId when form is loaded
  useEffect(() => {
    if (form && form.pages && form.pages.length > 0 && !currentPageId) {
      setCurrentPageId(form.pages[0].id);
    }
  }, [form, currentPageId]);

  // Handler to navigate directly to a page (for sidebar navigation)
  const handleDirectPageNavigation = useCallback((pageId) => {
    setCurrentPageId(pageId);
    setSelectedSectionId(null);
    setSelectedElementId(null);
  }, []);

  return {
    currentPageId,
    selectedSectionId,
    selectedElementId,
    setCurrentPageId,
    setSelectedSectionId,
    setSelectedElementId,
    handleDirectPageNavigation,
  };
};
