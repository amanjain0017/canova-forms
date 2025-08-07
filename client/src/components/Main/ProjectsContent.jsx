import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectContext } from "../../context/ProjectContext";
import projectCardIcon from "./../../assets/icons/projectCardIcon.png";
import threedotsIcon from "./../../assets/icons/threedotsIcon.png";

// Import components for Modals and Dropdown
import CardDropdown from "./../Dropdowns/CardDropdown";
import RenameModal from "./../Modals/RenameModal/RenameModal";
import DeleteModal from "./../Modals/DeleteModal/DeleteModal";
import ShareModal from "./../Modals/ShareModal/ShareModal";
import CreateProjectModal from "../../components/Modals/CreateProjectModal/CreateProjectModal";

// Helper function to render a Project card
const renderProjectCard = (
  item, // 'item' contains the project's _id
  activeDropdown,
  handleDropdownToggle,
  handleAction,
  navigate // Pass navigate function
) => {
  const isDropdownOpen = activeDropdown && activeDropdown._id === item._id;

  const handleProjectIconClick = (e) => {
    e.stopPropagation(); // Prevent any parent click handlers
    // Change: Navigate to the specific project's detail page using its _id
    navigate(`/projects/${item._id}`);
  };

  return (
    <div className="card project-card" key={item._id}>
      <div
        className="project-card-icon-wrapper"
        onClick={handleProjectIconClick} // This will now navigate to /projects/:id
      >
        {" "}
        {/* Add onClick handler here */}
        <img src={projectCardIcon} alt="project icon" className="card-icon" />
      </div>
      <div className="project-card-footer">
        <h3 className="card-title">{item.name}</h3>
        <div
          className="card-options-wrapper"
          onClick={(e) => {
            e.preventDefault(); // Prevent the Link from navigating when the icon is clicked
            e.stopPropagation();
            handleDropdownToggle({ ...item, type: "project" });
          }}
        >
          <img
            src={threedotsIcon}
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

const ProjectsContent = () => {
  const { projects, loading, error, getMyProjects } = useProjectContext();
  const navigate = useNavigate();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [modalState, setModalState] = useState(null);
  const dropdownRef = useRef(null);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState(false);

  useEffect(() => {
    getMyProjects();
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
    setModalState({ type: action, item });
  };

  // Modified closeModal to refresh data after successful operations
  const closeModal = () => {
    setModalState(null);
    // After closing any modal that might have changed a project,
    // re-fetch the list of projects to update the display.
    getMyProjects(true); // Call getMyProjects with true to force a fresh fetch
  };

  const openCreateProjectModal = () => {
    setIsCreateProjectModalOpen(true);
  };

  const closeCreateProjectModal = () => {
    setIsCreateProjectModalOpen(false);
    getMyProjects(); // This already forces a refresh
  };

  if (loading) {
    return <div className="status-message">Loading projects...</div>;
  }

  if (error) {
    return (
      <div className="status-message error-message">
        Error: {error}
        <p>Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <>
      <div className="works-grid">
        {projects.length > 0 ? (
          projects.map((item) =>
            renderProjectCard(
              item,
              activeDropdown,
              handleDropdownToggle,
              handleAction,
              navigate
            )
          )
        ) : (
          <p className="status-message no-projects">
            You don't have any projects yet.
          </p>
        )}
      </div>

      <div className="create-new-project-button-container">
        <button
          className="create-new-project-button"
          onClick={openCreateProjectModal}
        >
          Create New Project
        </button>
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

      {/* Create Project Modal */}
      {isCreateProjectModalOpen && (
        <CreateProjectModal
          isOpen={isCreateProjectModalOpen}
          onClose={closeCreateProjectModal}
        />
      )}
    </>
  );
};

export default ProjectsContent;
