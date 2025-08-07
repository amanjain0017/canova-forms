import React, { useState, useEffect, useRef } from "react";
import { useProjectContext } from "../../../context/ProjectContext";
import { useFormContext } from "../../../context/FormContext";
import Toast from "../../Toast/Toast";
import "./RenameModal.css"; // IMPORTANT: Keep this import as is

const RenameModal = ({ isOpen, onClose, item }) => {
  const { updateProject, loading: projectLoading } = useProjectContext();
  const { updateForm, loading: formLoading } = useFormContext();

  const modalRef = useRef();

  const [newName, setNewName] = useState(item?.name || item?.title || "");
  const [toastMessage, setToastMessage] = useState(null);

  // Update the input value when item changes
  useEffect(() => {
    setNewName(item?.name || item?.title || "");
  }, [item]);

  useEffect(() => {
    const handleClickOutside = (event) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToastMessage(null);

    const currentName = item?.name || item?.title || "";

    if (newName.trim() === currentName.trim()) {
      setToastMessage({
        type: "error",
        text: "The new name is the same as the current one.",
      });
      return;
    }

    if (!newName.trim()) {
      setToastMessage({ type: "error", text: "The name cannot be empty." });
      return;
    }

    let result;
    if (item.type === "project") {
      result = await updateProject(item._id, { name: newName.trim() });
    } else if (item.type === "form") {
      // For forms, we update the 'title' field, not 'name'
      result = await updateForm(item._id, { title: newName.trim() });
    } else {
      setToastMessage({ type: "error", text: "Unknown item type." });
      return;
    }

    if (result.success) {
      setToastMessage({
        type: "success",
        text: `${
          item.type === "project" ? "Project" : "Form"
        } renamed successfully!`,
      });
      // Automatically close modal after a short delay, after the toast has been shown
      setTimeout(() => {
        onClose();
        setToastMessage(null);
      }, 1500);
    } else {
      setToastMessage({
        type: "error",
        text: result.message || "Failed to rename.",
      });
    }
  };

  const handleClose = () => {
    onClose();
    setNewName(item?.name || item?.title || ""); // Reset input on close
    setToastMessage(null);
  };

  const handleCloseToast = () => {
    setToastMessage(null);
  };

  const isLoading = projectLoading || formLoading;

  return (
    <div className="rn-modal-overlay">
      <div ref={modalRef} className="rn-modal-content">
        <div className="rn-modal-header">
          <h3 className="rn-modal-title">Rename {item.type}</h3>
          <button onClick={handleClose} className="rn-modal-close-btn">
            <span>&times;</span>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="rn-modal-body">
            <label htmlFor="rename-input" className="rn-modal-label">
              New {item.type} Name
            </label>
            <input
              type="text"
              id="rename-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rn-modal-input"
              disabled={isLoading}
              placeholder={`Enter new ${item.type} name`}
            />
          </div>
          <div className="rn-modal-footer">
            <button
              type="button"
              onClick={handleClose}
              className="rn-modal-btn-cancel"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rn-modal-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Renaming..." : "Rename"}
            </button>
          </div>
        </form>
      </div>
      {/* Render the Toast component */}
      <Toast message={toastMessage} onClose={handleCloseToast} />
    </div>
  );
};

export default RenameModal;
