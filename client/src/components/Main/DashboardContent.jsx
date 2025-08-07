import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProjectContext } from "../../context/ProjectContext";
import { useFormContext } from "../../context/FormContext";
import formIcon from "../../assets/icons/formIcon.png";
import projectCardIcon from "../../assets/icons/projectCardIcon.png";
import threeDotsIcon from "../../assets/icons/threedotsIcon.png";

// Import components for Modals and Dropdown
import CardDropdown from "./../Dropdowns/CardDropdown";
import RenameModal from "./../Modals/RenameModal/RenameModal";
import DeleteModal from "./../Modals/DeleteModal/DeleteModal";
import ShareModal from "./../Modals/ShareModal/ShareModal";
import Toast from "./../Toast/Toast";

// Helper function to render a Form card
const renderFormCard = (
  item,
  activeDropdown,
  handleDropdownToggle,
  handleAction,
  navigate
) => {
  const isDropdownOpen = activeDropdown && activeDropdown._id === item._id;

  const handleFormIconClick = (e) => {
    e.stopPropagation(); // Prevent any parent click handlers
    navigate(`/create-form/${item._id}`);
  };

  return (
    <div key={item._id} className="card form-card">
      <div className="card-header">
        <h3 className="card-title">
          {item.title}
          {item.status === "draft" && <span> (Draft)</span>}
        </h3>
      </div>
      <div className="form-card-icon-wrapper">
        <img
          src={formIcon}
          alt="form"
          width={25}
          onClick={handleFormIconClick}
          style={{ cursor: "pointer" }}
        />
      </div>
      <div className="form-card-footer">
        {item.status !== "draft" ? (
          <Link
            to={`/analysis/forms/${item._id}`}
            className="view-analysis-link"
          >
            View Analysis
          </Link>
        ) : (
          <span className="view-analysis-text-disabled"></span>
        )}
        <div className="card-options-wrapper">
          <div
            className="card-options-icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDropdownToggle({ ...item, type: "form" });
            }}
          >
            <img src={threeDotsIcon} alt="options" height={19} />
          </div>
          {isDropdownOpen && (
            <CardDropdown
              item={{ ...item, type: "form" }}
              onAction={handleAction}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to render a Project card
const renderProjectCard = (
  item,
  activeDropdown,
  handleDropdownToggle,
  handleAction,
  navigate
) => {
  const isDropdownOpen = activeDropdown && activeDropdown._id === item._id;

  const handleProjectIconClick = (e) => {
    e.stopPropagation();
    navigate(`/projects/${item._id}`);
  };

  return (
    <div className="card project-card" key={item._id}>
      {/* Apply onClick to project-card-icon-wrapper */}
      <div
        className="project-card-icon-wrapper"
        onClick={handleProjectIconClick}
        style={{ cursor: "pointer" }}
      >
        <img src={projectCardIcon} alt="project icon" className="card-icon" />
      </div>
      <div className="project-card-footer">
        <h3 className="card-title">{item.name}</h3>
        <div
          className="card-options-wrapper"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDropdownToggle({ ...item, type: "project" });
          }}
        >
          <img
            src={threeDotsIcon}
            alt="options"
            className="card-options-icon"
          />
          {isDropdownOpen && (
            <CardDropdown
              item={{ ...item, type: "project" }}
              onAction={handleAction}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardContent = ({ openProjectModal, openFormModal }) => {
  const navigate = useNavigate(); // Initialize useNavigate hook
  const { recentWorks, loading, error, getRecentWorks } = useProjectContext();
  const {
    sharedForms,
    getSharedForms,
    loading: sharedFormsLoading,
  } = useFormContext();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [modalState, setModalState] = useState(null);
  const [toastMessage, setToastMessage] = useState(null); // State for toast messages
  const dropdownRef = useRef(null);

  useEffect(() => {
    getRecentWorks();
    getSharedForms();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleDropdownToggle = (item) => {
    setActiveDropdown(
      activeDropdown && activeDropdown._id === item._id ? null : item
    );
  };

  const handleAction = (action, item) => {
    setActiveDropdown(null);

    if (action === "edit" && item.type === "form" && item.status === "draft") {
      navigate(`/create-form/${item._id}`);
      return;
    }

    setModalState({ type: action, item });
  };

  const closeModal = () => {
    setModalState(null);
  };

  const handleCloseToast = () => {
    setToastMessage(null);
  };

  // Check if there are any projects available
  const hasProjects =
    recentWorks && recentWorks.some((item) => item.type === "project");

  const handleCreateFormClick = () => {
    if (hasProjects) {
      openFormModal();
    } else {
      setToastMessage({
        type: "error",
        text: "You need to have at least 1 project to create a form.",
      });
    }
  };

  return (
    <>
      <div className="action-grid">
        <div className="action-card" onClick={openProjectModal}>
          <div className="action-icon">
            <img src={projectCardIcon} alt="project" width={28} />
          </div>
          <h2 className="action-title">Start from scratch</h2>
          <p className="action-description">Create your first Project now</p>
        </div>

        {/* Conditionally allow clicking based on `hasProjects` */}
        <div
          className="action-card"
          onClick={handleCreateFormClick} // Use the new handler
          style={{ cursor: hasProjects ? "pointer" : "not-allowed" }} // Visual feedback
        >
          <div className="action-icon">
            <img src={formIcon} alt="form" width={22} />
          </div>
          <h2 className="action-title">Create Form</h2>
          <p className="action-description">Create your first Form now</p>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Recent Works</h2>
        <div className="works-grid">
          {loading ? (
            <p className="status-message">Loading recent works...</p>
          ) : error ? (
            <p className="status-message error-message">Error: {error}</p>
          ) : recentWorks && recentWorks.length > 0 ? (
            recentWorks.map((item) =>
              item.type === "form"
                ? renderFormCard(
                    item,
                    activeDropdown,
                    handleDropdownToggle,
                    handleAction,
                    navigate
                  )
                : renderProjectCard(
                    // Pass navigate here
                    item,
                    activeDropdown,
                    handleDropdownToggle,
                    handleAction,
                    navigate
                  )
            )
          ) : (
            <p className="status-message">No recent works yet.</p>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Shared Works</h2>
        </div>
        <div className="works-grid">
          {sharedFormsLoading ? (
            <p className="status-message">Loading shared forms...</p>
          ) : sharedForms && sharedForms.length > 0 ? (
            sharedForms.map((item) =>
              renderFormCard(
                item,
                activeDropdown,
                handleDropdownToggle,
                handleAction,
                navigate
              )
            )
          ) : (
            <p className="status-message">No shared works yet.</p>
          )}
        </div>
      </div>

      {modalState && modalState.type === "rename" && (
        <RenameModal
          isOpen={true}
          onClose={closeModal}
          item={modalState.item}
        />
      )}
      {modalState && modalState.type === "delete" && (
        <DeleteModal
          isOpen={true}
          onClose={closeModal}
          item={modalState.item}
        />
      )}
      {modalState && modalState.type === "share" && (
        <ShareModal isOpen={true} onClose={closeModal} item={modalState.item} />
      )}

      {/* Render the Toast component */}
      <Toast message={toastMessage} onClose={handleCloseToast} />
    </>
  );
};

export default DashboardContent;
