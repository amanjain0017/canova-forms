import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import Toast from "./../Toast/Toast";

import canovaLogo from "../../assets/icons/canovaLogo.png";
import profileIcon from "../../assets/icons/profileIcon.png";
import logoutIcon from "../../assets/icons/logoutIcon.png";
import settingsIcon from "../../assets/icons/settingsIcon.png";

const ProfileSidebar = () => {
  const { theme } = useTheme();
  const { signOut } = useAuth();
  const location = useLocation();

  // Local state for toast message
  const [toastMessage, setToastMessage] = useState(null);

  const isProfileActive = location.pathname === "/profile";
  const isSettingsActive = location.pathname === "/settings";

  // Handler for logout
  const handleLogout = async () => {
    try {
      // Show success toast immediately
      setToastMessage({
        type: "success",
        text: "Logged out successfully",
      });

      // Small delay to show the toast before redirect
      setTimeout(() => {
        signOut();
      }, 1000); // 1 second delay to show toast
    } catch (error) {
      console.error("Error during logout:", error);
      // Show error toast if logout fails
      setToastMessage({
        type: "error",
        text: "Error during logout",
      });
    }
  };

  // Handler to close toast
  const handleCloseToast = () => {
    setToastMessage(null);
  };

  return (
    <div className={`sidebar ${theme} profile-sidebar`}>
      {/* Toast Component */}
      <Toast
        message={toastMessage}
        onClose={handleCloseToast}
        duration={2000} // 3 seconds
      />

      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-logo-link">
          <img src={canovaLogo} alt="logo" className="sidebar-logo-img" />
          <span className="sidebar-logo-name">CANOVA</span>
        </Link>
      </div>
      <nav className="profile-nav">
        <ul>
          <li className={isProfileActive ? "active" : ""}>
            <Link to="/profile" className="sidebar-nav-link">
              <span className="profile-icon-wrapper">
                <img src={profileIcon} alt="profile" width={22} />
              </span>
              My Profile
            </Link>
          </li>
          <li className={isSettingsActive ? "active" : ""}>
            <Link to="/settings" className="sidebar-nav-link">
              <span className="profile-icon-wrapper">
                <img src={settingsIcon} alt="settings" width={22} />
              </span>
              Settings
            </Link>
          </li>
          <li>
            <div
              className="logout-link sidebar-nav-link"
              onClick={handleLogout}
            >
              <span className="profile-icon-wrapper">
                <img src={logoutIcon} alt="logout" width={22} />
              </span>
              Log Out
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default ProfileSidebar;
