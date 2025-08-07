import { useTheme } from "../../context/ThemeContext";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import ProjectsContent from "../../components/Main/ProjectsContent";
import "./Projects.css";

const Projects = () => {
  const { theme } = useTheme();

  return (
    <div className={`projects-container ${theme}`}>
      <Sidebar />
      <div className="main-content">
        <Header title="Welcome to CANOVA" />
        <ProjectsContent />
      </div>
    </div>
  );
};

export default Projects;
