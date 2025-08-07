import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useFormContext } from "../../context/FormContext";
import { useProjectContext } from "../../context/ProjectContext";
import formIcon from "../../assets/icons/formIcon.png";
import threedotsIcon from "../../assets/icons/threedotsIcon.png";
import backIcon from "../../assets/icons/backIcon.png";

import CardDropdown from "./../Dropdowns/CardDropdown";
import RenameModal from "./../Modals/RenameModal/RenameModal";
import DeleteModal from "./../Modals/DeleteModal/DeleteModal";
import ShareModal from "./../Modals/ShareModal/ShareModal";

const ProjectDetailContent = ({ searchTerm }) => {
  const { projectId } = useParams();
  const {
    forms,
    loading: formsLoading,
    error,
    getFormsByProject,
    createForm,
  } = useFormContext();
  const { getProjectById } = useProjectContext();
  const [projectName, setProjectName] = useState("Loading...");

  const [creatingForm, setCreatingForm] = useState(false);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [modalState, setModalState] = useState(null);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  const fetchProjectName = useCallback(async () => {
    if (!projectId) return;

    try {
      const result = await getProjectById(projectId);
      if (result.success) {
        setProjectName(result.project.name);
      } else {
        setProjectName("Project Not Found");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      setProjectName("Error loading project");
    }
  }, [projectId, getProjectById]);

  useEffect(() => {
    if (projectId) {
      getFormsByProject(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProjectName();
    }
  }, [projectId]);

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
  }, []);

  const handleDropdownToggle = (item) => {
    setActiveDropdown(
      activeDropdown && activeDropdown._id === item._id ? null : item
    );
  };

  const handleAction = (action, item) => {
    setActiveDropdown(null);
    if (action === "edit") {
      navigate(`/create-form/${item._id}`, {
        state: {
          projectId: projectId,
          formId: item._id,
          formName: item.title,
          projectName: projectName,
        },
      });
    } else {
      setModalState({ type: action, item });
    }
  };

  const closeModal = () => {
    setModalState(null);
  };

  const handleCreateNewForm = async () => {
    if (creatingForm || !projectId) return;

    setCreatingForm(true);

    try {
      const defaultFormName = `New Form`;

      const result = await createForm(defaultFormName, projectId);

      if (result.success && result.form) {
        navigate(`/create-form/${result.form._id}`, {
          state: {
            projectId: projectId,
            formId: result.form._id,
            formName: defaultFormName,
            projectName: projectName,
          },
        });
      } else {
        console.error("Failed to create form:", result.message);
        alert("Failed to create form. Please try again.");
      }
    } catch (error) {
      console.error("Error creating form:", error);
      alert("An error occurred while creating the form. Please try again.");
    } finally {
      setCreatingForm(false);
    }
  };

  const filteredForms = forms.filter((form) =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFormIconClick = (form) => {
    navigate(`/create-form/${form._id}`, {
      state: {
        projectId: projectId,
        formId: form._id,
        formName: form.title,
        projectName: projectName,
      },
    });
  };

  const loading = formsLoading || creatingForm;

  if (formsLoading) {
    return <div className="status-message">Loading forms...</div>;
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
      <div className="project-header">
        <Link to="/projects" className="back-button">
          <img src={backIcon} alt="back" />
        </Link>
        <h2 className="project-title">{projectName}</h2>
      </div>

      <div className="works-grid">
        {filteredForms.length > 0 ? (
          filteredForms.map((form) => {
            const isDropdownOpen =
              activeDropdown && activeDropdown._id === form._id;
            return (
              <div key={form._id} className="card form-card">
                <div className="card-top-row">
                  <h3 className="card-title">
                    {form.title}
                    {form.status === "draft" && <span> (Draft)</span>}
                  </h3>
                </div>
                <div className="form-card-icon-wrapper">
                  <img
                    src={formIcon}
                    alt="form"
                    className="card-icon"
                    width={25}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleFormIconClick(form)}
                  />
                </div>
                <div className="form-card-footer">
                  {form.status !== "draft" ? (
                    <Link
                      to={`/analysis/forms/${form._id}`}
                      className="view-analysis-link"
                    >
                      View Analysis
                    </Link>
                  ) : (
                    <span className="view-analysis-text-disabled"></span>
                  )}
                  <div
                    className="card-options-wrapper"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDropdownToggle({ ...form, type: "form" });
                    }}
                  >
                    <img
                      src={threedotsIcon}
                      alt="3dots"
                      className="card-threedots-icon"
                    />
                    {isDropdownOpen && (
                      <div ref={dropdownRef}>
                        <CardDropdown
                          item={{ ...form, type: "form" }}
                          onAction={handleAction}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="status-message no-forms">
            No forms in this project yet.
          </p>
        )}
      </div>

      <div className="create-new-form-button-container">
        <button
          className="create-new-form-button"
          onClick={handleCreateNewForm}
          disabled={creatingForm}
        >
          {creatingForm ? "Creating..." : "Create New Form"}
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
    </>
  );
};

export default ProjectDetailContent;
