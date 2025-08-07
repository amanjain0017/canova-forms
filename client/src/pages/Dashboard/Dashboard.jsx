import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";

import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import DashboardContent from "../../components/Main/DashboardContent";
import CreateProjectModal from "../../components/Modals/CreateProjectModal/CreateProjectModal";
import CreateFormModal from "../../components/Modals/CreateFormModal/CreateFormModal";
import "./Dashboard.css";

const Dashboard = () => {
  const { theme } = useTheme();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const openProjectModal = () => setIsProjectModalOpen(true);
  const closeProjectModal = () => setIsProjectModalOpen(false);

  const openFormModal = () => setIsFormModalOpen(true);
  const closeFormModal = () => setIsFormModalOpen(false);

  return (
    <div className={`dashboard-container ${theme}`}>
      <Sidebar />
      <div className="main-content">
        <Header title="Welcome to CANOVA" />
        {/* Pass both modal functions to DashboardContent */}
        <DashboardContent
          openProjectModal={openProjectModal}
          openFormModal={openFormModal}
        />
      </div>

      {/* Conditionally render both modals */}
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

export default Dashboard;
