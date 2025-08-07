import React, { useState, useEffect, useRef } from "react";
import shareIcon from "../../../assets/icons/shareIcon.png";
import linkIcon from "../../../assets/icons/linkIcon.png";
import "./ShareModal.css";

const ShareModal = ({ isOpen, onClose, item }) => {
  const modalRef = useRef(null);

  const [linkCopied, setLinkCopied] = useState(false);
  const shareLink = item.publishedLink || "";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
        setLinkCopied(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setLinkCopied(false);
    }
  }, [isOpen, item]);

  if (!isOpen) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const tempInput = document.createElement("input");
      tempInput.value = shareLink;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleCloseClick = () => {
    onClose();
    setLinkCopied(false);
  };

  return (
    <div className="modal-overlay sharing">
      <div className="modal-container" ref={modalRef}>
        <div className="modal-header">
          <div className="icon">
            <img src={shareIcon} alt="Share Icon" />
          </div>
          <h2 className="modal-title">Share</h2>{" "}
          <button className="close-button" onClick={handleCloseClick}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <button className="share-copy-button" onClick={handleCopy}>
            <img src={linkIcon} alt="" className="link-icon" />
            <span>{linkCopied ? "Copied ..." : "Copy the Link"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
