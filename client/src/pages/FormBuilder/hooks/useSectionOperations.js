import { useCallback } from "react";

// Helper to generate unique IDs
const generateUniqueId = (prefix = "") =>
  `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

export const useSectionOperations = (
  form,
  setForm,
  currentPageId,
  setSelectedSectionId,
  setSelectedElementId,
  showToast
) => {
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
  }, [
    currentPageId,
    showToast,
    setForm,
    setSelectedSectionId,
    setSelectedElementId,
  ]);

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
    [
      currentPageId,
      showToast,
      setForm,
      setSelectedSectionId,
      setSelectedElementId,
    ]
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
    [currentPageId, setForm]
  );

  return {
    handleAddSection,
    handleDeleteSection,
    handleUpdateSectionColor,
  };
};
