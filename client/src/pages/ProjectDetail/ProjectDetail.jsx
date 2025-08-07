import { useTheme } from "../../context/ThemeContext";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import ProjectDetailContent from "../../components/Main/ProjectDetailContent";
import "./ProjectDetail.css";
import { useState } from "react";

const ProjectDetail = () => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className={`project-detail-container ${theme}`}>
      <Sidebar />
      <div className="main-content">
        <Header setSearchTerm={setSearchTerm} />
        <ProjectDetailContent searchTerm={searchTerm} />
      </div>
    </div>
  );
};

export default ProjectDetail;
