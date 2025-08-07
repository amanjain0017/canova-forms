// components/MediaUploadModal.jsx
import React, { useState, useRef } from "react";
import "./MediaUploadModal.css";

const MediaUploadModal = ({ isVisible, onClose, onUpload, mediaType }) => {
  const [url, setUrl] = useState("");
  const [dragActive, setDragActive] = useState(false); // For drag-and-drop styling
  const inputRef = useRef(null); // Ref for file input (hidden)

  if (!isVisible) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      onUpload(file);
      resetModal();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // FIX: Pass the file object directly to onUpload instead of a URL string.
      onUpload(file);
      resetModal();
    }
  };

  const resetModal = () => {
    setUrl("");
    setDragActive(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="media-upload-modal">
        <h3>Add {mediaType === "image" ? "Image" : "Video"}</h3>
        <div
          className={`drop-area ${dragActive ? "drag-active" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={inputRef}
            style={{ display: "none" }}
            onChange={handleFileChange} // FIX: Use a dedicated handler for clarity
            accept={mediaType === "image" ? "image/*" : "video/*"}
          />
          <p>Drag & drop {mediaType} files to upload</p>
          <p>
            {mediaType === "image"
              ? `Consider upto 250KB per ${mediaType}`
              : `Consider upto 2500KB per ${mediaType}`}
          </p>
          <p>or</p>
          <button
            className="browse-button"
            onClick={() => inputRef.current.click()}
          >
            Browse Files
          </button>
        </div>

        <div className="modal-actions">
          <button className="cancel-button" onClick={resetModal}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaUploadModal;
