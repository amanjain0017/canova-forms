import React, { useEffect, useRef } from "react";
import "./CardDropdown.css";

const CardDropdown = ({ item, onAction }) => {
  const dropdownRef = useRef(null);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the click is outside the dropdown and not on the trigger icon, close the dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // onAction(null, null) is used to close the dropdown by setting activeDropdown to null in the parent component
        onAction(null, null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onAction]);

  const handleItemClick = (action) => {
    // Pass the action and the item to the parent component

    onAction(action, item);
  };

  // Determine if this is a form or project based on item type
  const isForm = item?.type === "form";
  const isProject = item?.type === "project";
  const isDraftForm = isForm && item?.status === "draft";
  const isPublishedForm = isForm && item?.status === "published";

  return (
    <div ref={dropdownRef} className="card-dropdown-menu">
      {/* Show Edit only for draft forms */}
      {isDraftForm && (
        <button
          onClick={() => handleItemClick("edit")}
          className="dropdown-item"
        >
          Edit
        </button>
      )}

      {/* Show Share only for published forms */}
      {isPublishedForm && (
        <button
          onClick={() => handleItemClick("share")}
          className="dropdown-item"
        >
          Share
        </button>
      )}

      {/* Show Rename for forms (both draft and published) and projects */}
      {(isForm || isProject) && (
        <button
          onClick={() => handleItemClick("rename")}
          className="dropdown-item"
        >
          Rename
        </button>
      )}

      {/* Show Delete for forms (both draft and published) and projects */}
      {(isForm || isProject) && (
        <button
          onClick={() => handleItemClick("delete")}
          className="dropdown-item delete-item"
        >
          Delete
        </button>
      )}
    </div>
  );
};

export default CardDropdown;
