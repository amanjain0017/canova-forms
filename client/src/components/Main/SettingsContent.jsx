import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import Toast from "./../Toast/Toast";

const SettingsContent = () => {
  // Use the useTheme hook to get the current theme and the function to toggle it
  const { theme, toggleTheme } = useTheme();

  // Language is now a static, non-changeable value as requested
  const language = "eng";

  // Local state for toast message
  const [toastMessage, setToastMessage] = useState(null);

  // Handler for theme change
  const handleThemeChange = (e) => {
    const newTheme = e.target.value;

    // Only toggle if the selected theme is different from current
    if (newTheme !== theme) {
      toggleTheme();

      // Show success toast
      const themeDisplayName = newTheme === "dark" ? "Dark" : "Light";
      setToastMessage({
        type: "success",
        text: `Theme changed to ${themeDisplayName} mode`,
      });
    }
  };

  // Handler to close toast
  const handleCloseToast = () => {
    setToastMessage(null);
  };

  return (
    <div className="settings-page-content">
      <Toast
        message={toastMessage}
        onClose={handleCloseToast}
        duration={2000}
      />

      <div className="settings-section">
        <h3 className="section-title">Preferences</h3>
        <div className="settings-preferences">
          <div className="settings-item">
            <span className="settings-label">Theme</span>
            <select
              value={theme}
              onChange={handleThemeChange}
              className="settings-select"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="settings-item">
            <span className="settings-label">Language</span>
            <select
              value={language}
              disabled
              className="settings-select settings-select-disabled"
            >
              <option value="eng">Eng</option>
              <option value="spa">Spa</option>
              <option value="fra">Fra</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsContent;
