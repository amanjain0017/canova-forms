import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectContext } from "../../../context/ProjectContext";
import { useFormContext } from "../../../context/FormContext"; // Import FormContext
import cubeIcon from "./../../../assets/icons/cubeIcon.png";
import "./CreateProjectModal.css";

const CreateProjectModal = ({ isOpen, onClose }) => {
  const [projectName, setProjectName] = useState("");
  const [formName, setFormName] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Use both contexts
  const { createProject, loading: projectLoading } = useProjectContext();
  const { createForm, loading: formLoading } = useFormContext();

  const modalRef = useRef(null);

  // Combined loading state
  const loading = projectLoading || formLoading;

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

  if (!isOpen) {
    return null;
  }

  const handleCreateProject = async () => {
    setError(null);

    // Validate inputs
    if (!projectName.trim() || !formName.trim()) {
      setError("Project Name and Form Name cannot be empty.");
      return;
    }

    try {
      // Step 1: Create the project
      const projectResult = await createProject(projectName.trim());

      if (!projectResult.success || !projectResult.project) {
        setError(
          projectResult.message || "Project creation failed. Please try again."
        );
        return;
      }

      // Step 2: Create the form in the newly created project
      const formResult = await createForm(
        formName.trim(),
        projectResult.project._id
      );

      if (!formResult.success || !formResult.form) {
        setError(
          formResult.message || "Form creation failed. Please try again."
        );
        return;
      }

      // Step 3: Success! Close modal and navigate
      onClose();

      // Navigate to the form builder/editor page with the new form
      navigate(`/create-form/${formResult.form._id}`, {
        state: {
          projectId: projectResult.project._id,
          formId: formResult.form._id,
          formName: formName.trim(),
          projectName: projectName.trim(),
        },
      });
    } catch (err) {
      console.error("Error creating project and form:", err);
      setError("Failed to create project and form: " + err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container first" ref={modalRef}>
        <div className="modal-header">
          <div className="icon">
            <img src={cubeIcon} alt="icon" />
          </div>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <h2 className="modal-title">Create Project</h2>
        <div className="modal-body">
          <p>Provide your project a name and start with your journey</p>
          {error && <div className="error-message">{error}</div>}
          <div className="input-group">
            <label htmlFor="projectName">Project Name</label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project Name"
              disabled={loading}
            />
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
            className="create-button first"
            onClick={handleCreateProject}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
