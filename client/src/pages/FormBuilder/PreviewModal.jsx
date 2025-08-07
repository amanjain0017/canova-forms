import "./PreviewModal.css";
import canovaLogo from "./../../assets/icons/canovaLogo.png";

const PreviewModal = ({ isVisible, onClose, currentPage, form }) => {
  if (!isVisible || !currentPage) return null;

  const renderQuestion = (question, index) => {
    // Added 'index' parameter here
    const questionNumber = index + 1;

    switch (question.type) {
      case "shortAnswer":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
            </label>
            <input
              type="text"
              className="preview-input"
              placeholder="Your answer here..."
              disabled
              readOnly
            />
          </div>
        );

      case "longAnswer":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
            </label>
            <textarea
              className="preview-textarea"
              placeholder="Your answer here..."
              disabled
              readOnly
              rows="4"
            />
          </div>
        );

      case "date":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
            </label>
            <input type="date" className="preview-input" disabled readOnly />
          </div>
        );

      case "multipleChoice":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
            </label>
            <div className="preview-options">
              {question.options?.map((option, optIndex) => (
                <label key={optIndex} className="preview-option">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    disabled
                    readOnly
                  />
                  <span className="preview-option-text">{option}</span>
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
            </label>
            <div className="preview-options">
              {question.options?.map((option, optIndex) => (
                <label key={optIndex} className="preview-option">
                  <input type="checkbox" disabled readOnly />
                  <span className="preview-option-text">{option}</span>
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
            </label>
            <select className="preview-select" disabled>
              <option>Select an option...</option>
              {question.options?.map((option, optIndex) => (
                <option key={optIndex} value={option}>
                  {option}
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
            </label>
            <div className="preview-file-upload-area">
              <div className="preview-file-dropzone">
                <div className="preview-file-dropzone-content">
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
                </div>
              </div>
            </div>
          </div>
        );

      case "linearScale":
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-question-label">
              <span className="question-number">Q{questionNumber}.</span>{" "}
              {question.questionText}
            </label>
            <div className="preview-linear-scale">
              <div className="preview-scale-labels-container">
                <div className="preview-scale-label-box">
                  <span className="preview-scale-label-text">
                    {question.labels[0] || "Scale Starting"}
                  </span>
                </div>
                <div className="preview-scale-label-box">
                  <span className="preview-scale-label-text">
                    {question.labels[1] || "Scale Ending"}
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
                <div className="preview-scale-slider">
                  <div className="preview-scale-track">
                    <div className="preview-scale-progress"></div>
                    <div className="preview-scale-thumb">
                      <div className="preview-scale-checkmark">✓</div>
                    </div>
                  </div>
                </div>
                <div className="preview-scale-current-value">
                  {Math.floor(
                    ((question.minRating || 0) + (question.maxRating || 10)) / 2
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
            </label>
            <div className="preview-rating">
              {Array.from({ length: question.maxRating || 5 }, (_, i) => (
                <span key={i} className="preview-star">
                  ⭐
                </span>
              ))}
            </div>
          </div>
        );

      case "text":
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

  return (
    <div className="preview-modal-overlay">
      <div className="preview-modal">
        <div className="preview-content">
          <div
            className="preview-page"
            style={{ backgroundColor: currentPage.backgroundColor }}
          >
            <h2 className="preview-page-title">{currentPage.name}</h2>

            {currentPage.sections?.map((section) => (
              <div
                key={section.id}
                className="preview-section"
                style={{ backgroundColor: section.backgroundColor }}
              >
                <div className="preview-questions">
                  {section.questions?.map(
                    (question, index) => renderQuestion(question, index) // Pass index here
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="preview-logo">
          <img src={canovaLogo} alt="logo" width={22} />
          <h2 className="preview-name">CANOVA</h2>
        </div>

        <button className="preview-back-button" onClick={onClose}>
          Back to Edit
        </button>
      </div>
    </div>
  );
};

export default PreviewModal;
