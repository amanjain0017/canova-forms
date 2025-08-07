import React, { useState, useEffect, useRef } from "react";
import { useProjectContext } from "../../../context/ProjectContext";
import { useFormContext } from "../../../context/FormContext";
import Toast from "../../Toast/Toast";
import "./DeleteModal.css";

const DeleteModal = ({ isOpen, onClose, item }) => {
  const { deleteProject, loading: projectLoading } = useProjectContext();
  const { deleteForm, loading: formLoading } = useFormContext();

  const modalRef = useRef();

  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close the modal if a click occurs outside the modal content
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
        setToastMessage(null);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setToastMessage(null); // Clear any previous toast message

    let result;
    if (item.type === "project") {
      result = await deleteProject(item._id);
    } else if (item.type === "form") {
      result = await deleteForm(item._id);
    } else {
      setToastMessage({ type: "error", text: "Unknown item type." });
      return;
    }

    if (result.success) {
      setToastMessage({
        type: "success",
        text: `${
          item.type === "project" ? "Project" : "Form"
        } deleted successfully.`,
      });
      // Automatically close modal after a short delay, after the toast has been shown
      setTimeout(() => {
        onClose();
        setToastMessage(null); // Clear toast message after modal closes
      }, 1500);
    } else {
      setToastMessage({
        type: "error",
        text: result.message || "Failed to delete.",
      });
    }
  };

  const handleClose = () => {
    onClose();
    setToastMessage(null); // Clear toast message when modal is closed
  };

  const handleCloseToast = () => {
    setToastMessage(null); // Function to clear toast message from the Toast component
  };

  const isLoading = projectLoading || formLoading;
  const itemName = item?.name || item?.title || "";

  return (
    <div className="delete-modal-overlay">
      <div ref={modalRef} className="delete-modal-content">
        <div className="delete-modal-header">
          <h3 className="delete-modal-title">Confirm Deletion</h3>
          <button onClick={handleClose} className="delete-modal-close-btn">
            <span>&times;</span>
          </button>
        </div>
        <div>
          <p className="delete-modal-body-text">
            Are you sure you want to delete the {item.type} "
            <span className="delete-modal-highlight">{itemName}</span>"?
          </p>

          <div className="delete-modal-footer">
            <button
              type="button"
              onClick={handleClose}
              className="delete-modal-btn-cancel"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="delete-modal-btn-delete"
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      <Toast message={toastMessage} onClose={handleCloseToast} />
    </div>
  );
};

export default DeleteModal;
