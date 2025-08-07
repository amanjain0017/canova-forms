import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../components/Toast/Toast"; // Adjust the import path as needed
import {
  validateProfileData,
  formatMobileNumber,
  sanitizeProfileData,
} from "../../utils/validation";

const ProfileContent = () => {
  const { user, loading, updateUserProfile, message, clearMessage } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user.name || "",
    mobile: user.phoneNumber || "",
    location: user.location || "",
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isChanged, setIsChanged] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [localMessage, setLocalMessage] = useState(null);

  // Helper function to generate initials from a full name
  const getInitials = (name) => {
    if (!name) return "U";
    const nameArray = name.split(" ");
    if (nameArray.length > 1) {
      return `${nameArray[0][0]}${nameArray[1][0]}`.toUpperCase();
    }
    return nameArray[0][0].toUpperCase();
  };

  // Handler for input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Special handling for mobile number - format as user types
    if (name === "mobile") {
      processedValue = formatMobileNumber(value);
    }

    const newProfileData = { ...profileData, [name]: processedValue };
    setProfileData(newProfileData);
    setIsChanged(true);

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Real-time validation to update validation errors immediately
    const sanitizedData = sanitizeProfileData(newProfileData);
    const validation = validateProfileData(sanitizedData);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
    } else {
      // Clear all validation errors if data is now valid
      setValidationErrors({});
    }

    // Clear any existing auth context messages when user starts editing
    if (message) {
      clearMessage();
    }
  };

  // Handler to save changes
  const handleSaveChanges = async () => {
    // Clear any existing messages
    clearMessage();

    // Sanitize data
    const sanitizedData = sanitizeProfileData(profileData);

    // Validate data
    const validation = validateProfileData(sanitizedData);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setShowValidationErrors(true);
      return; // Don't proceed with API call
    }

    // Clear validation errors if all is valid
    setValidationErrors({});
    setShowValidationErrors(false);

    // Prepare data for API call
    const apiData = {
      name: sanitizedData.name,
      phoneNumber: sanitizedData.mobile || null, // Send null if empty
      location: sanitizedData.location || null, // Send null if empty
    };

    try {
      const result = await updateUserProfile(apiData);
      if (result.success) {
        setIsChanged(false);
      }
      // The AuthContext will handle showing success/error messages
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Handler to discard changes
  const handleDiscardChanges = () => {
    if (user) {
      setProfileData({
        name: user.name || "",
        mobile: user.phoneNumber || "",
        location: user.location || "",
      });
      setIsChanged(false);
      setValidationErrors({});
      setShowValidationErrors(false);
      clearMessage();

      // Show info toast for discard action
      setLocalMessage({ type: "info", text: "Changes discarded" });
    }
  };

  // Check if save button should be enabled - Fixed logic
  const hasValidationErrors = Object.keys(validationErrors).some(
    (key) => validationErrors[key] && validationErrors[key].trim() !== ""
  );

  const canSave = isChanged && !loading && !hasValidationErrors;

  // Handler to close toast
  const handleCloseToast = () => {
    clearMessage();
    setLocalMessage(null);
  };

  // Get the message to display (prioritize auth context message over local message)
  const displayMessage = message || localMessage;

  return (
    <div className="profile-page-content">
      {/* Toast Component */}
      <Toast
        message={displayMessage}
        onClose={handleCloseToast}
        duration={2000} // 3 seconds
      />

      {/* Header section with initials, name, and email */}
      <div className="profile-header">
        <div className="profile-initials-wrapper">
          <div className="profile-initials">{getInitials(user?.name)}</div>
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{user?.name || "Your name"}</h2>
          <p className="profile-email">{user?.email || "yourname@gmail.com"}</p>
        </div>
      </div>

      {/* Profile form section */}
      <div className="profile-form">
        {/* Name Field - Required */}
        <div className="form-row">
          <label className="form-label">
            Name <span style={{ color: "red" }}>*</span>
          </label>
          <div className="input-group">
            <input
              type="text"
              name="name"
              value={profileData.name}
              onChange={handleInputChange}
              className={`form-input ${
                showValidationErrors && validationErrors.name ? "error" : ""
              }`}
              placeholder="Enter your full name"
              required
            />
            {showValidationErrors && validationErrors.name && (
              <span className="error-text">{validationErrors.name}</span>
            )}
          </div>
        </div>

        {/* Email Field - Disabled */}
        <div className="form-row">
          <label className="form-label">
            Email account<span style={{ color: "red" }}>*</span>
          </label>
          <div className="input-group">
            <input
              type="email"
              name="email"
              value={user?.email || ""}
              className="form-input read-only"
              disabled
            />
          </div>
        </div>

        {/* Mobile Field - Optional but validated */}
        <div className="form-row">
          <label className="form-label">Mobile number</label>
          <div className="input-group">
            <input
              type="tel"
              name="mobile"
              value={profileData.mobile}
              onChange={handleInputChange}
              className={`form-input ${
                showValidationErrors && validationErrors.mobile ? "error" : ""
              }`}
              placeholder="Enter mobile number"
              maxLength="10"
            />
            {showValidationErrors && validationErrors.mobile && (
              <span className="error-text">{validationErrors.mobile}</span>
            )}
          </div>
        </div>

        {/* Location Field - Optional */}
        <div className="form-row">
          <label className="form-label">Location</label>
          <div className="input-group">
            <input
              type="text"
              name="location"
              value={profileData.location}
              onChange={handleInputChange}
              className={`form-input ${
                showValidationErrors && validationErrors.location ? "error" : ""
              }`}
              placeholder="Enter your location"
              maxLength="100"
            />
            {showValidationErrors && validationErrors.location && (
              <span className="error-text">{validationErrors.location}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="form-actions">
        <button onClick={handleSaveChanges} className="save-button">
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button
          onClick={handleDiscardChanges}
          className="discard-button"
          disabled={!isChanged}
        >
          Discard Changes
        </button>
      </div>
    </div>
  );
};

export default ProfileContent;
