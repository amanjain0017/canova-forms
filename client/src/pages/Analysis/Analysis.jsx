import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useProjectContext } from "../../context/ProjectContext";
import { useFormContext } from "../../context/FormContext";

import "./Analysis.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import AnalysisContent from "../../components/Main/AnalysisContent";
import ProjectAnalysisContent from "../../components/Main/ProjectAnalysisContent";
import FormAnalysisContent from "../../components/Main/FormAnalysisContent";

import CreateProjectModal from "../../components/Modals/CreateProjectModal/CreateProjectModal";
import CreateFormModal from "../../components/Modals/CreateFormModal/CreateFormModal";

// Page component for project-level analysis
const ProjectAnalysis = () => {
  const { theme } = useTheme();
  const { projectId } = useParams();
  const { getProjectById } = useProjectContext();
  const [projectTitle, setProjectTitle] = useState("Loading...");

  useEffect(() => {
    const fetchProjectTitle = async () => {
      const result = await getProjectById(projectId);
      if (result.success) {
        setProjectTitle(result.project.name);
      } else {
        setProjectTitle("Project Not Found");
      }
    };

    if (projectId) {
      fetchProjectTitle();
    }
  }, [projectId]);

  return (
    <div className={`analysis-container ${theme}`}>
      <Sidebar />
      <div className="main-content">
        <Header title={projectTitle} />

        <ProjectAnalysisContent />
      </div>
    </div>
  );
};

// Page component for form-level analysis
const FormAnalysis = () => {
  const { theme } = useTheme();
  const { formId } = useParams();
  const { getFormById } = useFormContext();
  const [formTitle, setFormTitle] = useState("Loading...");

  useEffect(() => {
    const fetchFormTitle = async () => {
      const result = await getFormById(formId);
      if (result.success) {
        setFormTitle(result.form.title);
      } else {
        setFormTitle("Form Not Found");
      }
    };

    if (formId) {
      fetchFormTitle();
    }
  }, [formId]);

  return (
    <div className={`analysis-container ${theme}`}>
      <Sidebar />
      <div className="main-content">
        <Header title={"Welcome to CANOVA"} />

        <FormAnalysisContent />
      </div>
    </div>
  );
};

// Page component for the main Analysis dashboard
const Analysis = () => {
  const { theme } = useTheme();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const openProjectModal = () => setIsProjectModalOpen(true);
  const closeProjectModal = () => setIsProjectModalOpen(false);

  const openFormModal = () => setIsFormModalOpen(true);
  const closeFormModal = () => setIsFormModalOpen(false);

  return (
    <div className={`analysis-container ${theme}`}>
      <Sidebar />
      <div className="main-content">
        <Header title="Analysis" />
        <hr className="divider" />

        <AnalysisContent />
      </div>

      {isProjectModalOpen && (
        <CreateProjectModal
          isOpen={isProjectModalOpen}
          onClose={closeProjectModal}
        />
      )}

      {isFormModalOpen && (
        <CreateFormModal isOpen={isFormModalOpen} onClose={closeFormModal} />
      )}
    </div>
  );
};

export { Analysis, ProjectAnalysis, FormAnalysis };
