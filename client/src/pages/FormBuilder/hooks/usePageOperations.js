import { useCallback } from "react";

// Helper to generate unique IDs
const generateUniqueId = (prefix = "") =>
  `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

export const usePageOperations = (
  form,
  setForm,
  currentPageId,
  setCurrentPageId,
  setSelectedSectionId,
  setSelectedElementId,
  showToast
) => {
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
  }, [
    showToast,
    setForm,
    setCurrentPageId,
    setSelectedSectionId,
    setSelectedElementId,
  ]);

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
    [
      currentPageId,
      showToast,
      setForm,
      setCurrentPageId,
      setSelectedSectionId,
      setSelectedElementId,
    ]
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
    [currentPageId, setForm]
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
    [currentPageId, setForm]
  );

  return {
    handleAddPage,
    handleDeletePage,
    handleUpdatePageTitle,
    handleUpdatePageBackgroundColor,
  };
};
