import { useState } from "react";
import MediaUploadModal from "./MediaUploadModal";
import FlowchartModal from "./FlowchartModal";

import addIcon from "./../../assets/icons/addIcon.png";
import imageIcon from "./../../assets/icons/imageIcon.png";
import videoIcon from "./../../assets/icons/videoIcon.png";
import sectionIcon from "./../../assets/icons/sectionIcon.png";
import textIcon from "./../../assets/icons/textIcon.png";
import conditionIcon from "./../../assets/icons/conditionIcon.png";

// Right-hand panel for adding new form elements and managing colors.
const FormElementsPanel = ({
  currentPage,
  form,
  onAddQuestion,
  onAddSection,
  onUpdatePageBackgroundColor,
  onUpdateSectionColor,
  selectedSectionId,
  isConditionModeActive,
  onToggleConditionMode,
  onBuildFormFlow,
  onPublishForm, // New prop to handle form publishing
}) => {
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [currentMediaType, setCurrentMediaType] = useState(""); // "image" or "video"
  const [showFlowchartModal, setShowFlowchartModal] = useState(false);

  // Helper to get the target section ID for adding new elements
  const getTargetSectionId = () => {
    if (selectedSectionId) {
      return selectedSectionId;
    }
    // Fallback to the last section if no section is explicitly selected
    if (currentPage && currentPage.sections.length > 0) {
      return currentPage.sections[currentPage.sections.length - 1].id;
    }
    return null; // Should ideally not happen if a page always has at least one section
  };

  const handleAddGenericQuestion = () => {
    // Only allow adding questions if not in condition mode
    if (isConditionModeActive) return;
    const targetSectionId = getTargetSectionId();
    if (targetSectionId) {
      onAddQuestion("shortAnswer", targetSectionId);
    } else {
      console.warn("No section found to add the question to.");
    }
  };

  const handleAddTextElement = () => {
    if (isConditionModeActive) return;
    const targetSectionId = getTargetSectionId();
    if (targetSectionId) {
      onAddQuestion("text", targetSectionId);
    } else {
      console.warn("No section found to add the text block to.");
    }
  };

  const handleOpenImageModal = () => {
    if (isConditionModeActive) return;
    setCurrentMediaType("image");
    setShowMediaModal(true);
  };

  const handleOpenVideoModal = () => {
    if (isConditionModeActive) return;
    setCurrentMediaType("video");
    setShowMediaModal(true);
  };

  const handleMediaUpload = (url) => {
    const targetSectionId = getTargetSectionId();
    if (targetSectionId) {
      onAddQuestion(currentMediaType, targetSectionId, url);
    } else {
      console.warn(`No section found to add the ${currentMediaType} to.`);
    }
    setShowMediaModal(false);
  };

  const handleAddSection = () => {
    if (isConditionModeActive) return;
    onAddSection();
  };

  const selectedSection = currentPage?.sections.find(
    (section) => section.id === selectedSectionId
  );

  // This handler will now just call the prop from FormBuilder
  const handleToggleConditionModeLocal = () => {
    onToggleConditionMode(); // Calls the parent's handler
  };

  const handleShowFlowchart = async () => {
    // Build form flow before showing flowchart
    if (onBuildFormFlow) {
      await onBuildFormFlow();
    }
    setShowFlowchartModal(true);
  };

  const handleCloseFlowchart = () => {
    setShowFlowchartModal(false);
  };

  const handleBackToEdit = () => {
    setShowFlowchartModal(false);
  };

  // Updated to handle publish data from the publish modal
  const handlePublish = (publishData) => {
    console.log("Publishing form with data:", publishData);

    // Call the parent's publish handler if provided
    if (onPublishForm) {
      onPublishForm(publishData);
    } else {
      // Fallback behavior
      console.log("Form published successfully!");
    }

    // Close the flowchart modal
    setShowFlowchartModal(false);
  };

  return (
    <div className="form-elements-panel">
      <div className="elements-list">
        <button
          className="add-element-button"
          onClick={handleAddGenericQuestion}
          disabled={isConditionModeActive} // Disable in condition mode
        >
          <img src={addIcon} alt="add" className="panel-icons" /> Add Question
        </button>
        <button
          className="add-element-button"
          onClick={handleAddTextElement}
          disabled={isConditionModeActive} // Disable in condition mode
        >
          <img src={textIcon} alt="text" className="panel-icons" /> Add Text
        </button>
        <button
          className="add-element-button"
          onClick={handleToggleConditionModeLocal} // Use the new local handler
          // Change text and class based on mode
          style={{
            backgroundColor: isConditionModeActive ? "#dc3545" : "", // Red if active
            color: isConditionModeActive ? "#fff" : "",
            borderColor: isConditionModeActive ? "#dc3545" : "",
          }}
        >
          {isConditionModeActive ? (
            <>
              <span className="plus-icon">✕</span> Cancel Condition
            </>
          ) : (
            <>
              <img src={conditionIcon} alt="add" className="panel-icons" /> Add
              Condition
            </>
          )}
        </button>
        <button
          className="add-element-button"
          onClick={handleOpenImageModal}
          disabled={isConditionModeActive} // Disable in condition mode
        >
          <img src={imageIcon} alt="add" className="panel-icons" />
          Add Image
        </button>
        <button
          className="add-element-button"
          onClick={handleOpenVideoModal}
          disabled={isConditionModeActive} // Disable in condition mode
        >
          <img src={videoIcon} alt="add" className="panel-icons" />
          Add Video
        </button>
        <button
          className="add-element-button"
          onClick={handleAddSection}
          disabled={isConditionModeActive} // Disable in condition mode
        >
          <img src={sectionIcon} alt="add" className="panel-icons" /> Add
          Sections
        </button>
      </div>

      <div className="color-picker-section">
        <h4>Background Color</h4>
        <div className="color-picker-item">
          <input
            type="color"
            value={currentPage?.backgroundColor || "#ffffff"}
            onChange={(e) => onUpdatePageBackgroundColor(e.target.value)}
            disabled={isConditionModeActive} // Disable in condition mode
          />
          <pre>
            {currentPage?.backgroundColor.toUpperCase() || "#FFFFFF"} | 100%
          </pre>
        </div>
        <h4>Section Color</h4>
        <div className="color-picker-item">
          <input
            type="color"
            value={selectedSection?.backgroundColor || "#f9f9f9"}
            onChange={(e) =>
              selectedSectionId &&
              onUpdateSectionColor(selectedSectionId, e.target.value)
            }
            disabled={!selectedSectionId || isConditionModeActive} // Disable if no section selected OR in condition mode
          />
          <pre>
            {selectedSection?.backgroundColor.toUpperCase() || "#F9F9F9"} | 100%
          </pre>
        </div>
      </div>

      {/* This button should only be visible when NOT in condition mode */}
      {!isConditionModeActive && (
        <button
          className="next-button black-buttons"
          onClick={handleShowFlowchart}
        >
          Next
        </button>
      )}

      <MediaUploadModal
        isVisible={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onUpload={handleMediaUpload}
        mediaType={currentMediaType}
      />

      <FlowchartModal
        isOpen={showFlowchartModal}
        onClose={handleCloseFlowchart}
        form={form}
        onBackToEdit={handleBackToEdit}
        onPublish={handlePublish}
      />
    </div>
  );
};

export default FormElementsPanel;
