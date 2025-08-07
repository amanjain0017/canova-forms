import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { useProjectContext } from "../../context/ProjectContext"; // Access ProjectContext
import { useFormContext } from "../../context/FormContext"; // Access FormContext
import formIcon from "../../assets/icons/formIcon.png";
import projectCardIcon from "../../assets/icons/projectCardIcon.png";
import threeDotsIcon from "../../assets/icons/threeDotsIcon.png";

// Import components for Modals and Dropdown
import CardDropdown from "./../Dropdowns/CardDropdown";
import RenameModal from "./../Modals/RenameModal/RenameModal";
import DeleteModal from "./../Modals/DeleteModal/DeleteModal";
import ShareModal from "./../Modals/ShareModal/ShareModal";

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
    e.stopPropagation();

    navigate(`/analysis/forms/${item._id}`);
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
    navigate(`/analysis/projects/${item._id}`);
  };

  return (
    <div className="card project-card" key={item._id}>
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

const AnalysisContent = () => {
  const navigate = useNavigate(); // Initialize useNavigate hook
  const { recentWorks, loading, error, getRecentWorks } = useProjectContext();
  const {
    sharedForms,
    getSharedForms,
    loading: sharedFormsLoading,
    error: formsError,
  } = useFormContext();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [modalState, setModalState] = useState(null);
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

  if (loading) {
    return <div className="status-message">Loading works...</div>;
  }

  if (error) {
    return <div className="status-message error-message">Error: {error}</div>;
  }

  const publishedSharedForms = sharedForms.filter(
    (item) => item.status === "published"
  );

  const publishedRecentFromsandProjects = recentWorks.filter(
    (item) =>
      (item.status === "published" && item.type === "form") ||
      item.type === "project"
  );

  return (
    <>
      <div className="section">
        <h2 className="section-title">Recent Works</h2>
        <div className="works-grid">
          {loading ? (
            <p className="status-message">Loading recent works...</p>
          ) : error ? (
            <p className="status-message error-message">Error: {error}</p>
          ) : publishedRecentFromsandProjects &&
            publishedRecentFromsandProjects.length > 0 ? (
            publishedRecentFromsandProjects.map((item) =>
              item.type === "form"
                ? renderFormCard(
                    item,
                    activeDropdown,
                    handleDropdownToggle,
                    handleAction,
                    navigate // Pass navigate to helper
                  )
                : renderProjectCard(
                    item,
                    activeDropdown,
                    handleDropdownToggle,
                    handleAction,
                    navigate // Pass navigate to helper
                  )
            )
          ) : (
            <p className="status-message">
              No recent published works yet to analyse.
            </p>
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
          ) : publishedSharedForms && publishedSharedForms.length > 0 ? (
            publishedSharedForms.map((item) =>
              renderFormCard(
                item,
                activeDropdown,
                handleDropdownToggle,
                handleAction,
                navigate
              )
            )
          ) : (
            <p className="status-message">
              No published shared works to analyse.
            </p>
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
    </>
  );
};

export default AnalysisContent;
