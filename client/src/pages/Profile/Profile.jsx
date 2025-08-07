import React from "react";
import { useTheme } from "../../context/ThemeContext";

import "./Profile.css";
import ProfileSidebar from "../../components/ProfileSidebar/ProfileSidebar";
import Header from "../../components/Header/Header";
import ProfileContent from "../../components/Main/ProfileContent";

const Profile = () => {
  const { theme } = useTheme();

  return (
    <div className={`profile-container ${theme}`}>
      <ProfileSidebar />
      <div className={`profile-main-content ${theme}`}>
        <Header title="My Profile" />
        <ProfileContent />
      </div>
    </div>
  );
};

export default Profile;
