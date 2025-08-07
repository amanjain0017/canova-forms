import React, { useState, useEffect } from "react";
import "./SelectPageModal.css";
import Toast from "./../../components/Toast/Toast";

const SelectPageModal = ({ isVisible, onClose, onSave, pages }) => {
  const [truePageId, setTruePageId] = useState("");
  const [falsePageId, setFalsePageId] = useState("");
  const [toastMessage, setToastMessage] = useState(null); // State for toast messages

  useEffect(() => {
    if (isVisible) {
      setTruePageId("");
      setFalsePageId("");
      setToastMessage(null); // Clear any old toast messages when opening
    }
  }, [isVisible]);

  const handleSave = () => {
    if (!truePageId || !falsePageId) {
      setToastMessage({
        type: "error",
        text: "Please select pages for both true and false outcomes.",
      });
      return;
    }

    if (truePageId === falsePageId) {
      setToastMessage({
        type: "error",
        text: "Please select different pages for true and false outcomes.",
      });
      return;
    }

    onSave({ truePageId, falsePageId });
    setToastMessage({
      type: "success",
      text: "Page selections saved successfully!",
    });
    // onClose will be called after a short delay to allow toast to show if needed,
    // or immediately if the toast is not meant to linger.
    // For now, let's keep onClose immediate as per original, but toast will still show.
    onClose();
  };

  const handleCloseToast = () => {
    setToastMessage(null);
  };

  if (!isVisible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="select-page-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Select Page</h3>
        <p className="modal-description">
          If the conditions are all met, it will lead the user to the page
          you've selected here.
        </p>

        <div className="modal-field">
          <label htmlFor="select-true-page">Select, if it's true</label>
          <select
            id="select-true-page"
            value={truePageId}
            onChange={(e) => setTruePageId(e.target.value)}
            className="modal-select"
          >
            <option value="">Select Page</option>
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name || `Page ${page.pageNumber}`}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-field">
          <label htmlFor="select-false-page">Select, if it's false</label>
          <select
            id="select-false-page"
            value={falsePageId}
            onChange={(e) => setFalsePageId(e.target.value)}
            className="modal-select"
          >
            <option value="">Select Page</option>
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name || `Page ${page.pageNumber}`}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-actions">
          <button className="modal-button continue" onClick={handleSave}>
            Continue
          </button>
        </div>
      </div>
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={handleCloseToast}
          duration={3000} // Increased duration to 3 seconds for better readability
        />
      )}
    </div>
  );
};

export default SelectPageModal;
