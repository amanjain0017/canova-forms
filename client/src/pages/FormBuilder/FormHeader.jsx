// FormHeader.jsx
import React, { useRef, useEffect } from "react";

const FormHeader = ({
  form,
  pageTitle,
  onUpdatePageTitle,
  onDeletePage,
  onPreview,
  onSaveForm, // <--- Add this new prop
}) => {
  const titleRef = useRef(null);

  // Set the contentEditable div's text content when pageTitle changes
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.textContent = pageTitle;
    }
  }, [pageTitle]);

  const handleBlur = (e) => {
    const newText = e.target.textContent.trim();
    onUpdatePageTitle(newText);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent new line on Enter
      e.target.blur(); // Trigger blur to save changes
    } else if (e.key === "Backspace" && e.target.textContent.trim() === "") {
      e.preventDefault(); // Prevent browser back navigation
      onDeletePage(); // Call the delete page function
    }
  };

  return (
    <header className="form-header">
      <div className="header-left">
        <div
          contentEditable
          suppressContentEditableWarning
          className="page-title-editable"
          ref={titleRef}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        >
          {pageTitle}
        </div>
      </div>
      <div className="header-right">
        <button className="header-button preview-button" onClick={onPreview}>
          Preview
        </button>
        {/* Attach onSaveForm to the Save button's onClick event */}
        <button
          className="header-button save-button black-buttons"
          onClick={onSaveForm}
        >
          Save
        </button>
      </div>
    </header>
  );
};

export default FormHeader;
