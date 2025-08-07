import { useTheme } from "../../context/ThemeContext";
import ProfileSidebar from "../../components/ProfileSidebar/ProfileSidebar";
import Header from "../../components/Header/Header";
import SettingsContent from "../../components/Main/SettingsContent";
import "./Settings.css";

const Settings = () => {
  const { theme } = useTheme();

  return (
    <div className={`profile-container ${theme}`}>
      <ProfileSidebar />
      <div className={`profile-main-content ${theme}`}>
        <Header title="Settings" />
        <SettingsContent />
      </div>
    </div>
  );
};

export default Settings;
