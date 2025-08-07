import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFormContext } from "../../context/FormContext";
import { useResponseContext } from "../../context/ResponseContext";
import Toast from "./../../components/Toast/Toast";
import canovaLogo from "./../../assets/icons/canovaLogo.png";
import "./PublicFormPage.css";

const PublicFormPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();

  const {
    getPublicFormById: fetchFormApi,
    loading: formLoading,
    error: formError,
  } = useFormContext();

  const {
    submitFormResponse,
    loading: responseLoading,
    error: responseError,
  } = useResponseContext();

  const [form, setForm] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageHistory, setPageHistory] = useState([0]); // Track navigation history
  const [answers, setAnswers] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [allPagesAnswered, setAllPagesAnswered] = useState(false);

  const currentFormPage = form?.pages[currentPageIndex];

  console.log("Answers", answers);
  console.log("Form", form);

  const fetchForm = useCallback(async () => {
    if (!formId) return;

    try {
      const result = await fetchFormApi(formId);
      if (result.success) {
        setForm(result.form);
        setStartTime(Date.now());
      } else {
        setToastMessage({
          type: "error",
          text: result.message || "Failed to load form.",
        });
      }
    } catch (err) {
      console.error("Error fetching form:", err);
      setToastMessage({
        type: "error",
        text: "An unexpected error occurred while loading the form.",
      });
    }
  }, [formId, fetchFormApi]);

  useEffect(() => {
    fetchForm();
  }, []);

  // Check if all required questions across all pages are answered
  useEffect(() => {
    if (!form) return;

    const requiredQuestions = [];
    form.pages.forEach((page) => {
      page.sections?.forEach((section) => {
        section.questions?.forEach((question) => {
          if (question.isRequired) {
            requiredQuestions.push(question.id);
          }
        });
      });
    });

    const answeredRequiredQuestions = requiredQuestions.filter((questionId) => {
      const answer = answers[questionId];
      return (
        answer &&
        answer.value !== undefined &&
        answer.value !== null &&
        answer.value !== "" &&
        (!Array.isArray(answer.value) || answer.value.length > 0)
      );
    });

    setAllPagesAnswered(
      answeredRequiredQuestions.length === requiredQuestions.length
    );
  }, [answers, form]);

  // Helper function to evaluate conditional logic
  const evaluateConditions = (conditionalLogic, currentAnswers) => {
    if (!conditionalLogic || !conditionalLogic.conditions) return null;

    const { conditions, truePageId, falsePageId } = conditionalLogic;

    // Check if ALL conditions are met
    const allConditionsMet = conditions.every((condition) => {
      const { questionId, answerCriteria } = condition;
      const userAnswer = currentAnswers[questionId]?.value;

      // If answerCriteria is empty, treat as wildcard (any answer is valid)
      if (!answerCriteria || answerCriteria.trim() === "") {
        return (
          userAnswer !== undefined && userAnswer !== null && userAnswer !== ""
        );
      }

      // Handle different answer types
      if (Array.isArray(userAnswer)) {
        // For checkbox/multi-select, check if any selected value matches
        return userAnswer.includes(answerCriteria);
      } else {
        // For single value answers, do exact match
        return String(userAnswer) === String(answerCriteria);
      }
    });

    // Return the appropriate next page ID
    return allConditionsMet ? truePageId : falsePageId;
  };

  // Get the next page ID based on conditional logic or linear flow
  const getNextPageId = () => {
    if (!form || !currentFormPage) return null;

    // Check if current page has conditional logic
    if (currentFormPage.conditionalLogic) {
      const nextPageId = evaluateConditions(
        currentFormPage.conditionalLogic,
        answers
      );
      if (nextPageId) {
        // Find the index of the next page
        const nextPageIndex = form.pages.findIndex(
          (page) => page.id === nextPageId
        );
        return nextPageIndex !== -1 ? nextPageIndex : null;
      }
    }

    // Check if current page has nextPageId array (from form flow builder)
    if (currentFormPage.nextPageId && currentFormPage.nextPageId.length > 0) {
      // For now, take the first next page ID (you might want to implement more complex logic)
      const nextPageId = currentFormPage.nextPageId[0];
      const nextPageIndex = form.pages.findIndex(
        (page) => page.id === nextPageId
      );
      return nextPageIndex !== -1 ? nextPageIndex : null;
    }

    // Fallback to linear progression
    return currentPageIndex < form.pages.length - 1
      ? currentPageIndex + 1
      : null;
  };

  // Check if current page is an endpoint (no next pages)
  const isEndpoint = () => {
    const nextPageIndex = getNextPageId();
    return nextPageIndex === null;
  };

  const handleAnswerChange = (questionId, value, type) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: {
        questionId,
        questionType: type,
        value,
        fileUrls:
          type === "fileUpload" || type === "image" || type === "video"
            ? value instanceof FileList
              ? Array.from(value).map((f) => URL.createObjectURL(f))
              : []
            : [],
      },
    }));
  };

  // Validate current page
  const validateCurrentPage = () => {
    const currentPageQuestions = [];
    currentFormPage?.sections?.forEach((section) => {
      section.questions?.forEach((question) => {
        if (question.isRequired) {
          currentPageQuestions.push(question);
        }
      });
    });

    // Check if all required questions are answered
    const missingAnswers = currentPageQuestions.filter((question) => {
      const answer = answers[question.id];
      return (
        !answer ||
        answer.value === undefined ||
        answer.value === null ||
        answer.value === "" ||
        (Array.isArray(answer.value) && answer.value.length === 0)
      );
    });

    return missingAnswers.length === 0;
  };

  const handleNextPage = () => {
    // Validate current page before proceeding
    if (!validateCurrentPage()) {
      setToastMessage({
        type: "error",
        text: "Please answer all required questions before proceeding.",
      });
      return;
    }

    const nextPageIndex = getNextPageId();

    if (nextPageIndex !== null) {
      // Add current page to history before moving
      setPageHistory((prev) => [...prev, nextPageIndex]);
      setCurrentPageIndex(nextPageIndex);
    }
  };

  const handlePreviousPage = () => {
    if (pageHistory.length > 1) {
      // Remove current page from history and go to previous
      const newHistory = [...pageHistory];
      newHistory.pop(); // Remove current page
      const previousPageIndex = newHistory[newHistory.length - 1];

      setPageHistory(newHistory);
      setCurrentPageIndex(previousPageIndex);
    }
  };

  const handleSubmitForm = async () => {
    if (!form || !startTime) {
      setToastMessage({
        type: "error",
        text: "Form not loaded or submission in progress.",
      });
      return;
    }

    // Check if all pages are completed
    if (!allPagesAnswered) {
      setToastMessage({
        type: "error",
        text: "Please complete all required fields across all pages before submitting.",
      });
      return;
    }

    const endTime = Date.now();
    const timeTakenSeconds = Math.floor((endTime - startTime) / 1000);

    // Convert answers object to array format expected by backend
    const answersArray = Object.values(answers).map((answer) => {
      // For file uploads, convert FileList to array of file names/info
      if (answer.value instanceof FileList && answer.value.length > 0) {
        const fileNames = Array.from(answer.value).map((file) => file.name);
        return {
          questionId: answer.questionId,
          questionType: answer.questionType,
          value: fileNames.join(", "), // Store file names as comma-separated string
          fileUrls: answer.fileUrls || [], // Store blob URLs for reference
        };
      }
      return {
        questionId: answer.questionId,
        questionType: answer.questionType,
        value: answer.value,
        fileUrls: answer.fileUrls || [],
      };
    });

    console.log("Submitting form with data:", {
      formId,
      answersArray,
      timeTakenSeconds,
    });

    try {
      setToastMessage(null);
      const result = await submitFormResponse(
        formId,
        answersArray,
        timeTakenSeconds
      );

      console.log("Submit response:", result);

      if (result && result.success) {
        setToastMessage({
          type: "success",
          text: "Form submitted successfully!",
        });
        setTimeout(() => navigate("/thank-you"), 2000);
      } else {
        setToastMessage({
          type: "error",
          text: result?.message || "Failed to submit form.",
        });
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setToastMessage({
        type: "error",
        text: "An unexpected error occurred during submission.",
      });
    }
  };

  const renderFilePreview = (files, questionId) => {
    if (!files || files.length === 0) return null;

    return (
      <div className="file-preview-container">
        {files.map((fileUrl, index) => {
          const fileName =
            answers[questionId]?.value?.[index]?.name || `File ${index + 1}`;
          const fileType = fileName.split(".").pop()?.toLowerCase() || "file";

          return (
            <div key={index} className="file-preview-item">
              <div className="file-preview-icon">
                {["jpg", "jpeg", "png", "gif", "webp"].includes(fileType) ? (
                  <img
                    src={fileUrl}
                    alt={fileName}
                    className="file-preview-image"
                  />
                ) : ["mp4", "webm", "ogg"].includes(fileType) ? (
                  <video
                    src={fileUrl}
                    className="file-preview-video"
                    controls
                  />
                ) : (
                  <div className="file-preview-generic">
                    <span className="file-icon">📄</span>
                    <span className="file-type">{fileType.toUpperCase()}</span>
                  </div>
                )}
              </div>
              <span className="file-preview-name">{fileName}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderQuestion = (question, index) => {
    const questionNumber = index + 1;

    switch (question.type) {
      case "text":
      case "shortAnswer":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
              {question.isRequired && <span className="required">*</span>}
            </label>
            <input
              type="text"
              className="preview-input"
              value={answers[question.id]?.value || ""}
              onChange={(e) =>
                handleAnswerChange(question.id, e.target.value, question.type)
              }
              placeholder={question.placeholder || "Your answer here..."}
              required={question.isRequired}
            />
          </div>
        );

      case "textarea":
      case "longAnswer":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
              {question.isRequired && <span className="required">*</span>}
            </label>
            <textarea
              className="preview-textarea"
              value={answers[question.id]?.value || ""}
              onChange={(e) =>
                handleAnswerChange(question.id, e.target.value, question.type)
              }
              placeholder={question.placeholder || "Your answer here..."}
              required={question.isRequired}
              rows="4"
            />
          </div>
        );

      case "number":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
              {question.isRequired && <span className="required">*</span>}
            </label>
            <input
              type="number"
              className="preview-input"
              value={answers[question.id]?.value || ""}
              onChange={(e) =>
                handleAnswerChange(question.id, e.target.value, question.type)
              }
              placeholder={question.placeholder}
              required={question.isRequired}
            />
          </div>
        );

      case "date":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
              {question.isRequired && <span className="required">*</span>}
            </label>
            <input
              type="date"
              className="preview-input"
              value={answers[question.id]?.value || ""}
              onChange={(e) =>
                handleAnswerChange(question.id, e.target.value, question.type)
              }
              required={question.isRequired}
            />
          </div>
        );

      case "time":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
              {question.isRequired && <span className="required">*</span>}
            </label>
            <input
              type="time"
              className="preview-input"
              value={answers[question.id]?.value || ""}
              onChange={(e) =>
                handleAnswerChange(question.id, e.target.value, question.type)
              }
              required={question.isRequired}
            />
          </div>
        );

      case "radio":
      case "multipleChoice":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
              {question.isRequired && <span className="required">*</span>}
            </label>
            <div className="preview-options">
              {question.options?.map((option, idx) => (
                <label key={idx} className="preview-option">
                  <input
                    type="radio"
                    name={question.id}
                    value={typeof option === "object" ? option.value : option}
                    checked={
                      answers[question.id]?.value ===
                      (typeof option === "object" ? option.value : option)
                    }
                    onChange={(e) =>
                      handleAnswerChange(
                        question.id,
                        e.target.value,
                        question.type
                      )
                    }
                    required={question.isRequired}
                  />
                  <span className="preview-option-text">
                    {typeof option === "object" ? option.label : option}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );

      case "checkbox":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
              {question.isRequired && <span className="required">*</span>}
            </label>
            <div className="preview-options">
              {question.options?.map((option, idx) => (
                <label key={idx} className="preview-option">
                  <input
                    type="checkbox"
                    value={typeof option === "object" ? option.value : option}
                    checked={
                      answers[question.id]?.value?.includes(
                        typeof option === "object" ? option.value : option
                      ) || false
                    }
                    onChange={(e) => {
                      const currentValues = answers[question.id]?.value || [];
                      const optionValue =
                        typeof option === "object" ? option.value : option;
                      const newValue = e.target.checked
                        ? [...currentValues, optionValue]
                        : currentValues.filter((val) => val !== optionValue);
                      handleAnswerChange(question.id, newValue, question.type);
                    }}
                  />
                  <span className="preview-option-text">
                    {typeof option === "object" ? option.label : option}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );

      case "dropdown":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
              {question.isRequired && <span className="required">*</span>}
            </label>
            <select
              className="preview-select"
              value={answers[question.id]?.value || ""}
              onChange={(e) =>
                handleAnswerChange(question.id, e.target.value, question.type)
              }
              required={question.isRequired}
            >
              <option value="">
                {question.placeholder || "Select an option..."}
              </option>
              {question.options?.map((option, idx) => (
                <option
                  key={idx}
                  value={typeof option === "object" ? option.value : option}
                >
                  {typeof option === "object" ? option.label : option}
                </option>
              ))}
            </select>
          </div>
        );

      case "fileUpload":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
              {question.isRequired && <span className="required">*</span>}
            </label>
            <div className="preview-file-upload-area">
              <div className="preview-file-dropzone">
                <input
                  type="file"
                  id={`file-${question.id}`}
                  multiple={question.fileSettings?.maxFiles > 1}
                  accept={question.fileSettings?.allowedTypes?.join(",")}
                  onChange={(e) =>
                    handleAnswerChange(
                      question.id,
                      e.target.files,
                      question.type
                    )
                  }
                  required={question.isRequired}
                  style={{ display: "none" }}
                />
                <label
                  htmlFor={`file-${question.id}`}
                  className="preview-file-dropzone-content"
                >
                  <div className="preview-file-icon">📁</div>
                  <p className="preview-file-text">
                    <span className="preview-file-action">Choose files</span> or
                    drag and drop
                  </p>
                  <p className="preview-file-subtext">
                    Max {question.fileSettings?.maxFiles || 1} file(s), up to{" "}
                    {question.fileSettings?.maxSizeMB || 5}MB each
                  </p>
                  {question.fileSettings?.allowedTypes?.length > 0 && (
                    <p className="preview-file-types">
                      Allowed: {question.fileSettings.allowedTypes.join(", ")}
                    </p>
                  )}
                </label>
              </div>
              {/* Show file previews */}
              {renderFilePreview(answers[question.id]?.fileUrls, question.id)}
            </div>
          </div>
        );

      case "linearScale":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
              {question.isRequired && <span className="required">*</span>}
            </label>
            <div className="preview-linear-scale">
              <div className="preview-scale-labels-container">
                <div className="preview-scale-label-box">
                  <span className="preview-scale-label-text">
                    {question.labels?.[0] || "Scale Starting"}
                  </span>
                </div>
                <div className="preview-scale-label-box">
                  <span className="preview-scale-label-text">
                    {question.labels?.[1] || "Scale Ending"}
                  </span>
                </div>
              </div>
              <div className="preview-scale-slider-container">
                <div className="preview-scale-numbers">
                  <span className="preview-scale-number">
                    {question.minRating || 0}
                  </span>
                  <span className="preview-scale-number">
                    {question.maxRating || 10}
                  </span>
                </div>
                <input
                  type="range"
                  className="preview-scale-slider"
                  min={question.minRating || 0}
                  max={question.maxRating || 10}
                  value={
                    answers[question.id]?.value ||
                    Math.floor(
                      ((question.minRating || 0) + (question.maxRating || 10)) /
                        2
                    )
                  }
                  onChange={(e) =>
                    handleAnswerChange(
                      question.id,
                      parseInt(e.target.value),
                      question.type
                    )
                  }
                  required={question.isRequired}
                />
                <div className="preview-scale-current-value">
                  {answers[question.id]?.value ||
                    Math.floor(
                      ((question.minRating || 0) + (question.maxRating || 10)) /
                        2
                    )}
                </div>
              </div>
            </div>
          </div>
        );

      case "rating":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
              {question.isRequired && <span className="required">*</span>}
            </label>
            <div className="preview-rating">
              {Array.from({ length: question.maxRating || 5 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`preview-star ${
                    (answers[question.id]?.value || 0) > i ? "active" : ""
                  }`}
                  onClick={() =>
                    handleAnswerChange(question.id, i + 1, question.type)
                  }
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "2rem",
                    padding: "0.2rem",
                  }}
                >
                  {(answers[question.id]?.value || 0) > i ? "⭐" : "☆"}
                </button>
              ))}
              <span className="rating-value">
                {answers[question.id]?.value || 0} / {question.maxRating || 5}
              </span>
            </div>
          </div>
        );

      case "textElement":
        return (
          <div key={question.id} className="preview-text-element">
            <p className="preview-text-content">{question.questionText}</p>
          </div>
        );

      case "image":
        return (
          <div key={question.id} className="preview-media-element">
            {question.mediaUrl ? (
              <img
                src={question.mediaUrl}
                alt="Form image"
                className="preview-image"
              />
            ) : (
              <div className="preview-placeholder">
                <span>Image Placeholder</span>
              </div>
            )}
          </div>
        );

      case "video":
        return (
          <div key={question.id} className="preview-media-element">
            {question.mediaUrl ? (
              <video
                src={question.mediaUrl}
                className="preview-video"
                controls
              />
            ) : (
              <div className="preview-placeholder">
                <span>Video Placeholder</span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div key={question.id} className="preview-question">
            <p>Unsupported question type: {question.type}</p>
          </div>
        );
    }
  };

  if (formLoading) {
    return <div className="public-form-container loading">Loading Form...</div>;
  }

  if (formError) {
    return (
      <div className="public-form-container error">
        <p>Error: {formError}</p>
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
          duration={5000}
        />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="public-form-container no-form">
        <p>Form not found or an error occurred.</p>
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
          duration={5000}
        />
      </div>
    );
  }

  return (
    <div className="preview-modal-overlay">
      <div className="preview-modal">
        <div className="preview-content">
          <div
            className="preview-page"
            style={{ backgroundColor: currentFormPage.backgroundColor }}
          >
            <h2 className="preview-page-title">{currentFormPage.name}</h2>

            {currentFormPage.sections?.map((section) => (
              <div
                key={section.id}
                className="preview-section"
                style={{ backgroundColor: section.backgroundColor }}
              >
                <div className="preview-questions">
                  {section.questions?.map((question, index) =>
                    renderQuestion(question, index)
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress indicator */}
        {/* <div className="form-progress">
          Page {currentPageIndex + 1} of {form.pages.length}
        </div> */}

        {/* Navigation buttons */}
        <div className="preview-form-navigation-buttons">
          {pageHistory.length > 1 && (
            <button
              className="preview-nav-button preview-prev-button"
              onClick={handlePreviousPage}
              disabled={responseLoading}
            >
              Previous
            </button>
          )}

          {!isEndpoint() ? (
            <button
              className="preview-nav-button preview-next-button"
              onClick={handleNextPage}
              disabled={responseLoading}
            >
              Next
            </button>
          ) : (
            <button
              className={`preview-nav-button preview-submit-button ${
                !allPagesAnswered ? "disabled" : ""
              }`}
              onClick={handleSubmitForm}
              disabled={responseLoading || !allPagesAnswered}
              title={
                !allPagesAnswered ? "Please complete all required fields" : ""
              }
            >
              {responseLoading ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>

        {/* Canova branding */}
        <div className="preview-logo">
          <img src={canovaLogo} alt="logo" width={22} />
          <h2 className="preview-name">CANOVA</h2>
        </div>

        {/* Toast notifications */}
        {toastMessage && (
          <Toast
            message={toastMessage}
            onClose={() => setToastMessage(null)}
            duration={3000}
          />
        )}
      </div>
    </div>
  );
};

export default PublicFormPage;
