import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectContext } from "../../../context/ProjectContext";
import { useFormContext } from "../../../context/FormContext";
import cubeIcon from "./../../../assets/icons/cubeIcon.png";
import "./CreateFormModal.css";

const CreateFormModal = ({ isOpen, onClose }) => {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [formName, setFormName] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Use both contexts
  const {
    projects,
    getMyProjects,
    loading: projectLoading,
  } = useProjectContext();
  const { createForm, loading: formLoading } = useFormContext();

  const modalRef = useRef(null);

  // Combined loading state
  const loading = projectLoading || formLoading;

  // Load projects when modal opens
  useEffect(() => {
    if (isOpen && projects.length === 0) {
      getMyProjects();
    }
  }, [isOpen, projects.length, getMyProjects]);

  // Effect to handle clicks outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedProjectId("");
      setFormName("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleCreateForm = async () => {
    setError(null);

    // Validate inputs
    if (!selectedProjectId || !formName.trim()) {
      setError("Please select a project and enter a form name.");
      return;
    }

    try {
      // Create the form in the selected project
      const formResult = await createForm(formName.trim(), selectedProjectId);

      if (!formResult.success || !formResult.form) {
        setError(
          formResult.message || "Form creation failed. Please try again."
        );
        return;
      }

      // Success! Close modal and navigate
      onClose();

      // Navigate to the form builder/editor page with the new form
      navigate(`/create-form/${formResult.form._id}`, {
        state: {
          projectId: selectedProjectId,
          formId: formResult.form._id,
          formName: formName.trim(),
        },
      });
    } catch (err) {
      console.error("Error creating form:", err);
      setError("Failed to create form: " + err.message);
    }
  };

  return (
    <div className="modal-overlay second">
      <div className="modal-container" ref={modalRef}>
        <div className="modal-header">
          <div className="icon">
            <img src={cubeIcon} alt="icon" />
          </div>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <h2 className="modal-title">Create Form</h2>
        <div className="modal-body">
          <p>Select a project and provide your form a name to get started</p>
          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <label htmlFor="projectSelect">Select Project</label>
            <select
              id="projectSelect"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={loading}
              className="project-select"
            >
              <option value="">Choose a project...</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="formName">Form Name</label>
            <input
              type="text"
              id="formName"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Form Name"
              disabled={loading}
            />
          </div>

          <button
            className="create-button"
            onClick={handleCreateForm}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateFormModal;
