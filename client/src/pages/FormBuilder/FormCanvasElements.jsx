import React from "react";

export const EditableTextElement = ({
  element,
  sectionId,
  onUpdateQuestionText,
  onDeleteQuestion,
  isConditionMode,
}) => {
  const handleDeleteTextElementOnBackspace = (e) => {
    if (e.key === "Backspace" && e.target.textContent.trim() === "") {
      e.preventDefault();
      onDeleteQuestion(sectionId, element.id);
    }
  };

  return (
    <div
      className={`form-element-card text-element ${
        isConditionMode ? "condition-mode-disabled" : ""
      }`}
      key={element.id}
      tabIndex="0"
      onKeyDown={handleDeleteTextElementOnBackspace}
    >
      <div className="question-header">
        <span
          contentEditable={!isConditionMode}
          suppressContentEditableWarning
          className="editable-text"
          onBlur={(e) =>
            !isConditionMode &&
            onUpdateQuestionText(sectionId, element.id, e.target.textContent)
          }
          style={{
            pointerEvents: isConditionMode ? "none" : "auto",
            opacity: isConditionMode ? 0.6 : 1,
          }}
        >
          {element.questionText}
        </span>
      </div>
    </div>
  );
};

export const ImageElement = ({
  element,
  sectionId,
  onSelectElement,
  isSelected,
  onDeleteQuestion,
  isConditionMode,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === "Backspace" && isSelected) {
      e.preventDefault();
      onDeleteQuestion(sectionId, element.id);
    }
  };

  return (
    <div
      className={`form-element-card image-element ${
        isSelected ? "selected-element" : ""
      } ${isConditionMode ? "condition-mode-disabled" : ""}`}
      key={element.id}
      onClick={(e) => {
        if (!isConditionMode) {
          e.stopPropagation();
          onSelectElement(element.id, element.type);
        }
      }}
      tabIndex="0"
      onKeyDown={handleKeyDown}
      style={{
        opacity: isConditionMode ? 0.6 : 1,
        pointerEvents: isConditionMode ? "none" : "auto",
      }}
    >
      {element.mediaUrl ? (
        <img src={element.mediaUrl} alt="Form Image" />
      ) : (
        <div className="media-placeholder">No Image Selected</div>
      )}
    </div>
  );
};

export const VideoElement = ({
  element,
  sectionId,
  onSelectElement,
  isSelected,
  onDeleteQuestion,
  isConditionMode,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === "Backspace" && isSelected) {
      e.preventDefault();
      onDeleteQuestion(sectionId, element.id);
    }
  };

  return (
    <div
      className={`form-element-card video-element ${
        isSelected ? "selected-element" : ""
      } ${isConditionMode ? "condition-mode-disabled" : ""}`}
      key={element.id}
      onClick={(e) => {
        if (!isConditionMode) {
          e.stopPropagation();
          onSelectElement(element.id, element.type);
        }
      }}
      tabIndex="0"
      onKeyDown={handleKeyDown}
      style={{
        opacity: isConditionMode ? 0.6 : 1,
        pointerEvents: isConditionMode ? "none" : "auto",
      }}
    >
      {element.mediaUrl ? (
        <video
          width="100%"
          height="315"
          frameBorder="0"
          src={element.mediaUrl}
          className="preview-video"
          controls
        />
      ) : (
        <div className="media-placeholder">No Video Selected</div>
      )}
    </div>
  );
};

export const QuestionWithOptions = ({
  element,
  sectionId,
  onUpdateQuestionText,
  handleQuestionTextKeyDown,
  renderQuestionTypeSelector,
  onUpdateOptionText,
  handleOptionTextKeyDown,
  onAddOption,
  questionNumber,
  onDeleteQuestion,
  isConditionMode,
  conditionValues,
  onConditionValueChange,
}) => {
  const isEligibleForCondition = [
    "multipleChoice",
    "checkbox",
    "dropdown",
  ].includes(element.type);

  return (
    <div
      className={`form-element-card form-question-card ${
        isConditionMode && !isEligibleForCondition
          ? "condition-mode-disabled"
          : ""
      } ${
        isConditionMode && isEligibleForCondition
          ? "condition-mode-eligible"
          : ""
      }`}
      key={element.id}
      tabIndex="0"
    >
      <div className="question-header">
        <div className="question-text-wrapper">
          <span className="question-number">{questionNumber}</span>
          <span
            contentEditable={!isConditionMode}
            suppressContentEditableWarning
            className="question-text editable-text"
            onBlur={(e) =>
              !isConditionMode &&
              onUpdateQuestionText(sectionId, element.id, e.target.textContent)
            }
            onKeyDown={(e) =>
              !isConditionMode &&
              handleQuestionTextKeyDown(e, sectionId, element.id)
            }
            style={{
              pointerEvents: isConditionMode ? "none" : "auto",
              opacity: isConditionMode && !isEligibleForCondition ? 0.6 : 1,
            }}
          >
            {element.questionText || "What is ?"}
          </span>
        </div>
        {!isConditionMode && renderQuestionTypeSelector(element, sectionId)}
      </div>
      <div className="question-options" data-question-id={element.id}>
        {element.options?.map((option, optionIndex) => (
          <label key={optionIndex} className="option-item">
            {element.type === "multipleChoice" && (
              <input
                type="radio"
                name={`condition-${element.id}`}
                disabled={!isConditionMode || !isEligibleForCondition}
                checked={
                  isConditionMode && conditionValues[element.id] === option
                }
                onChange={() =>
                  isConditionMode && onConditionValueChange(element.id, option)
                }
              />
            )}
            {element.type === "checkbox" && (
              <input
                type="checkbox"
                disabled={!isConditionMode || !isEligibleForCondition}
                checked={
                  isConditionMode &&
                  conditionValues[element.id]?.includes(option)
                }
                onChange={(e) => {
                  if (isConditionMode) {
                    const currentValues = conditionValues[element.id] || [];
                    if (e.target.checked) {
                      onConditionValueChange(element.id, [
                        ...currentValues,
                        option,
                      ]);
                    } else {
                      onConditionValueChange(
                        element.id,
                        currentValues.filter((v) => v !== option)
                      );
                    }
                  }
                }}
              />
            )}
            {element.type === "dropdown" && (
              <span className="dropdown-prefix"></span>
            )}
            <span
              contentEditable={!isConditionMode}
              suppressContentEditableWarning
              className="editable-text"
              data-option-index={optionIndex}
              onBlur={(e) =>
                !isConditionMode &&
                onUpdateOptionText(
                  sectionId,
                  element.id,
                  optionIndex,
                  e.target.textContent
                )
              }
              onKeyDown={(e) =>
                !isConditionMode &&
                handleOptionTextKeyDown(e, sectionId, element.id, optionIndex)
              }
              style={{
                pointerEvents: isConditionMode ? "none" : "auto",
                opacity: isConditionMode && !isEligibleForCondition ? 0.6 : 1,
              }}
              onClick={(e) => {
                if (
                  isConditionMode &&
                  isEligibleForCondition &&
                  element.type === "dropdown"
                ) {
                  e.preventDefault();
                  onConditionValueChange(element.id, option);
                }
              }}
            >
              {option}
            </span>
          </label>
        ))}
      </div>
      {isConditionMode &&
        element.type === "dropdown" &&
        isEligibleForCondition && (
          <div className="dropdown-condition-selector">
            <select
              value={conditionValues[element.id] || ""}
              onChange={(e) =>
                onConditionValueChange(element.id, e.target.value)
              }
            >
              <option value="">Select an option</option>
              {element.options.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
    </div>
  );
};

export const SimpleQuestion = ({
  element,
  sectionId,
  onUpdateQuestionText,
  handleQuestionTextKeyDown,
  renderQuestionTypeSelector,
  questionNumber,
  isConditionMode,
}) => {
  return (
    <div
      className={`form-element-card form-question-card ${
        isConditionMode ? "condition-mode-disabled" : ""
      }`}
      key={element.id}
      tabIndex="0"
    >
      <div className="question-header">
        <div className="question-text-wrapper">
          <span className="question-number">{questionNumber}</span>
          <span
            contentEditable={!isConditionMode}
            suppressContentEditableWarning
            className="question-text editable-text"
            onBlur={(e) =>
              !isConditionMode &&
              onUpdateQuestionText(sectionId, element.id, e.target.textContent)
            }
            onKeyDown={(e) =>
              !isConditionMode &&
              handleQuestionTextKeyDown(e, sectionId, element.id)
            }
            style={{
              pointerEvents: isConditionMode ? "none" : "auto",
              opacity: isConditionMode ? 0.6 : 1,
            }}
          >
            {element.questionText || "What is ?"}
          </span>
        </div>
        {!isConditionMode && renderQuestionTypeSelector(element, sectionId)}
      </div>
      {element.type === "shortAnswer" && (
        <input
          type="text"
          placeholder={element.placeholder || "Short Answer Text"}
          className="short-answer-input"
          readOnly
          style={{ opacity: isConditionMode ? 0.6 : 1 }}
        />
      )}
      {element.type === "longAnswer" && (
        <textarea
          placeholder={element.placeholder || "Long Answer Text"}
          className="long-answer-textarea"
          readOnly
          style={{ opacity: isConditionMode ? 0.6 : 1 }}
        />
      )}
      {element.type === "date" && (
        <div className="date-input-wrapper">
          <input
            type="date"
            className="date-input"
            placeholder="DD/MM/YYYY"
            readOnly
            style={{ opacity: isConditionMode ? 0.6 : 1 }}
          />
        </div>
      )}
    </div>
  );
};

export const LinearScaleQuestion = ({
  element,
  sectionId,
  onUpdateQuestionText,
  handleQuestionTextKeyDown,
  renderQuestionTypeSelector,
  onUpdateQuestionProperty,
  questionNumber,
  isConditionMode,
  conditionValues,
  onConditionValueChange,
}) => {
  const minScale = element.minRating ?? 0;
  const maxScale = element.maxRating ?? 10;
  const labelLeft = element.labels?.[0] || "0";
  const labelRight = element.labels?.[1] || "10";

  const handleScaleBlur = (e, isMax) => {
    if (!isConditionMode) {
      const value = parseInt(e.target.textContent, 10);
      if (!isNaN(value)) {
        const property = isMax ? "maxRating" : "minRating";
        onUpdateQuestionProperty(sectionId, element.id, property, value);
        if (
          !element.labels ||
          element.labels[isMax ? 1 : 0] === String(element[property])
        ) {
          const newLabels = [...(element.labels || ["", ""])];
          newLabels[isMax ? 1 : 0] = String(value);
          onUpdateQuestionProperty(sectionId, element.id, "labels", newLabels);
        }
      }
    }
  };

  const handleLabelBlur = (e, isRight) => {
    if (!isConditionMode) {
      const newLabels = [...(element.labels || ["", ""])];
      newLabels[isRight ? 1 : 0] = e.target.textContent;
      onUpdateQuestionProperty(sectionId, element.id, "labels", newLabels);
    }
  };

  return (
    <div
      className={`form-element-card form-question-card ${
        isConditionMode ? "condition-mode-eligible" : ""
      }`}
      key={element.id}
      tabIndex="0"
    >
      <div className="question-header">
        <div className="question-text-wrapper">
          <span className="question-number">{questionNumber}</span>
          <span
            contentEditable={!isConditionMode}
            suppressContentEditableWarning
            className="question-text editable-text"
            onBlur={(e) =>
              !isConditionMode &&
              onUpdateQuestionText(sectionId, element.id, e.target.textContent)
            }
            onKeyDown={(e) =>
              !isConditionMode &&
              handleQuestionTextKeyDown(e, sectionId, element.id)
            }
            style={{ pointerEvents: isConditionMode ? "none" : "auto" }}
          >
            {element.questionText || "What is ?"}
          </span>
        </div>
        {!isConditionMode && renderQuestionTypeSelector(element, sectionId)}
      </div>

      <div className="linear-scale-input-section">
        <div className="scale-input-group-top">
          <div className="styled-input-box">
            <span
              contentEditable={!isConditionMode}
              suppressContentEditableWarning
              className="scale-editable-value"
              onBlur={(e) => {
                if (!isConditionMode) {
                  const value = parseInt(e.target.textContent, 10);
                  if (!isNaN(value)) {
                    onUpdateQuestionProperty(
                      sectionId,
                      element.id,
                      "minRating",
                      value
                    );
                  }
                }
              }}
              style={{ pointerEvents: isConditionMode ? "none" : "auto" }}
            >
              {minScale}
            </span>
            <span
              contentEditable={!isConditionMode}
              suppressContentEditableWarning
              className="scale-editable-label"
              onBlur={(e) => handleLabelBlur(e, false)}
              style={{ pointerEvents: isConditionMode ? "none" : "auto" }}
            >
              {labelLeft}
            </span>
          </div>

          <div className="styled-input-box">
            <span
              contentEditable={!isConditionMode}
              suppressContentEditableWarning
              className="scale-editable-value"
              onBlur={(e) => {
                if (!isConditionMode) {
                  const value = parseInt(e.target.textContent, 10);
                  if (!isNaN(value)) {
                    onUpdateQuestionProperty(
                      sectionId,
                      element.id,
                      "maxRating",
                      value
                    );
                  }
                }
              }}
              style={{ pointerEvents: isConditionMode ? "none" : "auto" }}
            >
              {maxScale}
            </span>
            <span
              contentEditable={!isConditionMode}
              suppressContentEditableWarning
              className="scale-editable-label"
              onBlur={(e) => handleLabelBlur(e, true)}
              style={{ pointerEvents: isConditionMode ? "none" : "auto" }}
            >
              {labelRight}
            </span>
          </div>
        </div>

        <div className="range-slider-with-labels">
          <input
            type="range"
            min={minScale}
            max={maxScale}
            value={conditionValues[element.id] || minScale}
            onChange={(e) =>
              isConditionMode &&
              onConditionValueChange(element.id, parseInt(e.target.value))
            }
            readOnly={!isConditionMode}
          />
        </div>

        {isConditionMode && (
          <div className="condition-value-display">
            Selected value: {conditionValues[element.id] || minScale}
          </div>
        )}
      </div>
    </div>
  );
};

export const RatingQuestion = ({
  element,
  sectionId,
  onUpdateQuestionText,
  handleQuestionTextKeyDown,
  renderQuestionTypeSelector,
  onUpdateQuestionProperty,
  questionNumber,
  isConditionMode,
  conditionValues,
  onConditionValueChange,
}) => {
  const starCount = element.maxRating ?? 5;

  const renderStars = () => {
    return Array.from({ length: starCount }, (_, i) => (
      <span
        key={i}
        className={`star ${
          conditionValues[element.id] >= i + 1 ? "selected" : ""
        }`}
        onClick={() =>
          isConditionMode && onConditionValueChange(element.id, i + 1)
        }
        style={{
          cursor: isConditionMode ? "pointer" : "default",
          color: conditionValues[element.id] >= i + 1 ? "#ffd700" : "#ddd",
        }}
      >
        ★
      </span>
    ));
  };

  return (
    <div
      className={`form-element-card form-question-card ${
        isConditionMode ? "condition-mode-eligible" : ""
      }`}
      key={element.id}
      tabIndex="0"
    >
      <div className="question-header">
        <div className="question-text-wrapper">
          <span className="question-number">{questionNumber}</span>
          <span
            contentEditable={!isConditionMode}
            suppressContentEditableWarning
            className="question-text editable-text"
            onBlur={(e) =>
              !isConditionMode &&
              onUpdateQuestionText(sectionId, element.id, e.target.textContent)
            }
            onKeyDown={(e) =>
              !isConditionMode &&
              handleQuestionTextKeyDown(e, sectionId, element.id)
            }
            style={{ pointerEvents: isConditionMode ? "none" : "auto" }}
          >
            {element.questionText || "What is ?"}
          </span>
        </div>
        {!isConditionMode && renderQuestionTypeSelector(element, sectionId)}
      </div>
      <div className="rating-settings">
        <div className="stars-preview">{renderStars()}</div>
        {!isConditionMode && (
          <div className="star-count-wrapper">
            <span>Star Count:</span>
            <input
              type="number"
              min="1"
              max="10"
              value={starCount}
              onChange={(e) =>
                onUpdateQuestionProperty(
                  sectionId,
                  element.id,
                  "maxRating",
                  Math.max(1, Math.min(10, Number(e.target.value)))
                )
              }
            />
          </div>
        )}
        {isConditionMode && (
          <div className="condition-value-display">
            Selected rating: {conditionValues[element.id] || 0} stars
          </div>
        )}
      </div>
    </div>
  );
};

export const FileUploadQuestion = ({
  element,
  sectionId,
  onUpdateQuestionText,
  handleQuestionTextKeyDown,
  renderQuestionTypeSelector,
  onUpdateQuestionProperty,
  questionNumber,
  isConditionMode,
}) => {
  const fileTypes = [
    { label: "image", value: "image" },
    { label: "pdf", value: "pdf" },
    { label: "ppt", value: "ppt" },
    { label: "document", value: "document" },
    { label: "video", value: "video" },
    { label: "zip", value: "zip" },
    { label: "audio", value: "audio" },
    { label: "spreadsheet", value: "spreadsheet" },
  ];

  const handleFileTypeChange = (e) => {
    if (!isConditionMode) {
      const typeValue = e.target.value;
      const isChecked = e.target.checked;
      const currentTypes = element.fileSettings?.allowedTypes || [];

      const updatedAllowedTypes = isChecked
        ? [...currentTypes, typeValue]
        : currentTypes.filter((type) => type !== typeValue);

      onUpdateQuestionProperty(sectionId, element.id, "fileSettings", {
        ...element.fileSettings,
        allowedTypes: updatedAllowedTypes,
      });
    }
  };

  return (
    <div
      className={`form-element-card form-question-card ${
        isConditionMode ? "condition-mode-disabled" : ""
      }`}
      key={element.id}
      tabIndex="0"
    >
      <div className="question-header">
        <div className="question-text-wrapper">
          <span className="question-number">{questionNumber}</span>
          <span
            contentEditable={!isConditionMode}
            suppressContentEditableWarning
            className="question-text editable-text"
            onBlur={(e) =>
              !isConditionMode &&
              onUpdateQuestionText(sectionId, element.id, e.target.textContent)
            }
            onKeyDown={(e) =>
              !isConditionMode &&
              handleQuestionTextKeyDown(e, sectionId, element.id)
            }
            style={{
              pointerEvents: isConditionMode ? "none" : "auto",
              opacity: isConditionMode ? 0.6 : 1,
            }}
          >
            {element.questionText || "What is ?"}
          </span>
        </div>
        {!isConditionMode && renderQuestionTypeSelector(element, sectionId)}
      </div>

      <div
        className="file-upload-settings"
        style={{ opacity: isConditionMode ? 0.6 : 1 }}
      >
        {/* File Settings Container */}
        <div className="file-settings-container">
          <div className="file-config">
            <label>Number of Files:</label>
            <div className="styled-input-box">
              <input
                type="number"
                min="1"
                max="5"
                value={element.fileSettings?.maxFiles || 1}
                onChange={(e) =>
                  !isConditionMode &&
                  onUpdateQuestionProperty(
                    sectionId,
                    element.id,
                    "fileSettings",
                    {
                      ...element.fileSettings,
                      maxFiles: Math.max(1, Number(e.target.value)),
                    }
                  )
                }
                disabled={isConditionMode}
              />
            </div>
          </div>

          <div className="file-config">
            <label>Max File Size:</label>
            <div className="styled-input-box-with-unit">
              <input
                type="number"
                min="1"
                max="200"
                value={element.fileSettings?.maxSizeMB || 5}
                onChange={(e) =>
                  !isConditionMode &&
                  onUpdateQuestionProperty(
                    sectionId,
                    element.id,
                    "fileSettings",
                    {
                      ...element.fileSettings,
                      maxSizeMB: Math.max(0, Number(e.target.value)),
                    }
                  )
                }
                disabled={isConditionMode}
              />
              <span>mb</span>
            </div>
          </div>
        </div>

        {/* File Types Container */}
        <div className="file-types-container">
          <label>Allowed File Types:</label>
          <div className="file-types-grid">
            {fileTypes.map((type) => (
              <label key={type.value} className="checkbox-label">
                <input
                  type="checkbox"
                  value={type.value}
                  checked={
                    element.fileSettings?.allowedTypes?.includes(type.value) ||
                    false
                  }
                  onChange={handleFileTypeChange}
                  disabled={isConditionMode}
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
