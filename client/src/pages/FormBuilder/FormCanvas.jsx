import React, { useState, useRef, useEffect } from "react";
import {
  EditableTextElement,
  ImageElement,
  VideoElement,
  QuestionWithOptions,
  SimpleQuestion,
  LinearScaleQuestion,
  RatingQuestion,
  FileUploadQuestion,
} from "./FormCanvasElements";

const FormCanvas = ({
  currentPage,
  onUpdateQuestionText,
  onUpdateQuestionType,
  onUpdateOptionText,
  onDeleteQuestion,
  onDeleteOption,
  onAddOption,
  onUpdateQuestionProperty,
  selectedSectionId,
  onSelectSection,
  selectedElementId,
  onSelectElement: onSelectElementProp,
  onDeleteSection,
  isConditionModeActive,
  onOpenSelectPageModal,
  onRemoveCondition,
}) => {
  const [conditionValues, setConditionValues] = useState({});

  useEffect(() => {
    if (!isConditionModeActive) {
      setConditionValues({});
    }
  }, [isConditionModeActive]);

  const onSelectElement = (elementId, elementType) => {
    if (elementType === "image" || elementType === "video") {
      onSelectElementProp(elementId);
    } else {
      onSelectElementProp(null);
    }
    onSelectSection(null);
  };

  const handleConditionValueChange = (questionId, value) => {
    setConditionValues((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleQuestionTextKeyDown = (e, sectionId, elementId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
      onSelectElementProp(null);
    } else if (e.key === "Backspace" && e.target.textContent.trim() === "") {
      e.preventDefault();
      onDeleteQuestion(sectionId, elementId);
      onSelectElementProp(null);
    }
  };

  const handleOptionTextKeyDown = (e, sectionId, questionId, optionIndex) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAddOption(sectionId, questionId, optionIndex);
      setTimeout(() => {
        const nextInput = document.querySelector(
          `[data-question-id="${questionId}"] [data-option-index="${
            optionIndex + 1
          }"]`
        );
        nextInput?.focus();
      }, 0);
    } else if (e.key === "Backspace" && e.target.textContent.trim() === "") {
      e.preventDefault();
      const currentQuestion = currentPage.sections
        .find((sec) => sec.id === sectionId)
        ?.questions.find((q) => q.id === questionId);

      if (currentQuestion && currentQuestion.options.length > 1) {
        onDeleteOption(sectionId, questionId, optionIndex);
        if (optionIndex > 0) {
          setTimeout(() => {
            const prevInput = document.querySelector(
              `[data-question-id="${questionId}"] [data-option-index="${
                optionIndex - 1
              }"]`
            );
            prevInput?.focus();
          }, 0);
        }
      }
    }
  };

  const renderQuestionTypeSelector = (question, sectionId) => {
    const questionTypes = [
      "shortAnswer",
      "longAnswer",
      "multipleChoice",
      "checkbox",
      "dropdown",
      "fileUpload",
      "date",
      "linearScale",
      "rating",
    ];

    const typeMap = {
      shortAnswer: "Short Answer",
      longAnswer: "Long Answer",
      multipleChoice: "Multiple Choice",
      checkbox: "Checkbox",
      dropdown: "Dropdown",
      fileUpload: "File Upload",
      date: "Date",
      linearScale: "Linear Scale",
      rating: "Rating",
    };

    return (
      <select
        className="question-type-selector"
        value={question.type}
        onChange={(e) =>
          onUpdateQuestionType(sectionId, question.id, e.target.value)
        }
        onClick={(e) => e.stopPropagation()}
      >
        {questionTypes.map((type) => (
          <option key={type} value={type}>
            {typeMap[type] || "Question"}
          </option>
        ))}
      </select>
    );
  };

  const renderElement = (element, index, sectionId) => {
    const questionElementsInSection =
      currentPage.sections
        .find((sec) => sec.id === sectionId)
        ?.questions.filter(
          (q) => !["text", "image", "video"].includes(q.type)
        ) || [];

    const questionIndex = questionElementsInSection.findIndex(
      (q) => q.id === element.id
    );
    const isQuestionType = !["text", "image", "video"].includes(element.type);
    const questionNumber =
      isQuestionType && questionIndex !== -1 ? `Q${questionIndex + 1}` : null;

    const commonProps = {
      element,
      sectionId,
      onUpdateQuestionText,
      onUpdateQuestionProperty,
      questionNumber,
      isSelected: selectedElementId === element.id,
      onSelectElement,
      onDeleteQuestion,
      handleQuestionTextKeyDown,
      isConditionMode: isConditionModeActive,
      conditionValues,
      onConditionValueChange: handleConditionValueChange,
    };

    switch (element.type) {
      case "text":
        return <EditableTextElement {...commonProps} />;
      case "image":
        return <ImageElement {...commonProps} />;
      case "video":
        return <VideoElement {...commonProps} />;
      case "multipleChoice":
      case "checkbox":
      case "dropdown":
        return (
          <QuestionWithOptions
            {...commonProps}
            renderQuestionTypeSelector={renderQuestionTypeSelector}
            onUpdateOptionText={onUpdateOptionText}
            handleOptionTextKeyDown={handleOptionTextKeyDown}
            onAddOption={onAddOption}
          />
        );
      case "shortAnswer":
      case "longAnswer":
      case "date":
        return (
          <SimpleQuestion
            {...commonProps}
            renderQuestionTypeSelector={renderQuestionTypeSelector}
          />
        );
      case "fileUpload":
        return (
          <FileUploadQuestion
            {...commonProps}
            renderQuestionTypeSelector={renderQuestionTypeSelector}
          />
        );
      case "linearScale":
        return (
          <LinearScaleQuestion
            {...commonProps}
            renderQuestionTypeSelector={renderQuestionTypeSelector}
          />
        );
      case "rating":
        return (
          <RatingQuestion
            {...commonProps}
            renderQuestionTypeSelector={renderQuestionTypeSelector}
          />
        );
      default:
        return null;
    }
  };

  const handleSectionKeyDown = (e, sectionId) => {
    if (e.key === "Backspace" && selectedSectionId === sectionId) {
      const currentSection = currentPage.sections.find(
        (sec) => sec.id === sectionId
      );
      if (currentSection && currentSection.questions.length === 0) {
        e.preventDefault();
        onDeleteSection(sectionId);
      }
    }
  };

  const handleCanvasClick = () => {
    if (!isConditionModeActive) {
      onSelectElementProp(null);
      onSelectSection(null);
    }
  };

  const hasConditionValues =
    Object.keys(conditionValues).length > 0 &&
    Object.values(conditionValues).some(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== "" &&
        (Array.isArray(value) ? value.length > 0 : true)
    );

  const handleAddCondition = () => {
    if (hasConditionValues) {
      onOpenSelectPageModal(conditionValues);
    }
  };

  const handleRemovePageCondition = () => {
    if (currentPage && currentPage.id) {
      onRemoveCondition(currentPage.id);
    }
  };

  return (
    <div className="form-canvas-wrapper" onClick={handleCanvasClick}>
      <div
        className={`form-canvas ${
          isConditionModeActive ? "condition-mode" : ""
        }`}
        style={{ backgroundColor: currentPage?.backgroundColor }}
      >
        {currentPage &&
          currentPage.sections.map((section) => (
            <div
              key={section.id}
              className={`form-section ${
                section.id === selectedSectionId ? "selected" : ""
              } ${isConditionModeActive ? "condition-mode-section" : ""}`}
              style={{ backgroundColor: section.backgroundColor }}
              onClick={(e) => {
                if (!isConditionModeActive) {
                  e.stopPropagation();
                  onSelectSection(section.id);
                  onSelectElementProp(null);
                }
              }}
              tabIndex="0"
              onKeyDown={(e) =>
                !isConditionModeActive && handleSectionKeyDown(e, section.id)
              }
            >
              {section.questions.map((element, index) =>
                React.cloneElement(renderElement(element, index, section.id), {
                  key: element.id || index,
                })
              )}
            </div>
          ))}

        {/* Conditional rendering for Add/Remove Condition buttons */}
        {isConditionModeActive && (
          <div className="condition-buttons-container">
            {currentPage?.conditionalLogic ? (
              <button
                className="remove-condition-button"
                onClick={handleRemovePageCondition}
              >
                Remove Condition
              </button>
            ) : (
              <button
                className="add-condition-button"
                onClick={handleAddCondition}
                disabled={!hasConditionValues} // Disable if no condition values are selected
              >
                Add Condition
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormCanvas;
