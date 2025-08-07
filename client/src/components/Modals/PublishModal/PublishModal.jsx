import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./PublishModal.css";
import cubeIcon from "./../../../assets/icons/cubeIcon.png";
import { useFormContext } from "./../../../context/FormContext";
import { useAuth } from "./../../../context/AuthContext";
import { useProjectContext } from "./../../../context/ProjectContext";
import Toast from "./../../Toast/Toast";

const PublishModal = ({
  isOpen,
  onClose,
  itemToPublish,
  onPublish: onModalPublishSuccess,
}) => {
  const modalRef = useRef(null);
  const navigate = useNavigate(); // Initialize useNavigate hook here
  const {
    publishForm: publishFormApi,
    shareForm: shareFormApi,
    checkUserExistsByEmail,
    loading: formLoading,
    updateForm: updateFormApi, // <--- ADDED THIS LINE
  } = useFormContext();
  const { user } = useAuth(); // Assuming useAuth provides the current user
  const { projects } = useProjectContext(); // Assuming useProjectContext provides projects

  const [toastMessage, setToastMessage] = useState(null);
  const [responderAccess, setResponderAccess] = useState("anyone"); // 'anyone' or 'restricted'
  const [localSharedUsers, setLocalSharedUsers] = useState([]); // Initialize empty, will populate with owner
  const [newEmailInput, setNewEmailInput] = useState("");
  const [newEmailRole, setNewEmailRole] = useState("view"); // Changed to 'view' for consistency with common roles
  const [isPublishing, setIsPublishing] = useState(false);
  const [canPublishRestricted, setCanPublishRestricted] = useState(true); // New state for publish button control

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

  // Effect to manage the owner entry in localSharedUsers and reset state
  useEffect(() => {
    if (isOpen && itemToPublish && user) {
      setResponderAccess("anyone"); // Default to anyone on open
      setNewEmailInput("");
      setNewEmailRole("view");
      setToastMessage(null); // Clear any previous toast messages
      setIsPublishing(false);

      // Initialize sharedUsers with the current authenticated user as owner
      // Ensure owner is always the first entry and not duplicated.
      setLocalSharedUsers((prevUsers) => {
        const ownerEntryId = user._id || user.id;
        const ownerExists = prevUsers.some(
          (u) =>
            u.role === "owner" &&
            (u.userId === ownerEntryId || u.id === "owner-initial")
        );

        if (!ownerExists) {
          return [
            {
              id: "owner-initial", // Consistent ID for initial owner
              email: user.email,
              role: "owner",
              userId: ownerEntryId,
              isVerified: true, // Owner is always considered verified
            },
            ...prevUsers.filter((u) => u.role !== "owner"), // Filter out any old non-owner entries if present
          ];
        }
        return prevUsers.map(
          (
            u // Update owner email/userId if they changed
          ) =>
            u.role === "owner" &&
            (u.userId === ownerEntryId || u.id === "owner-initial")
              ? {
                  ...u,
                  email: user.email,
                  userId: ownerEntryId,
                  isVerified: true,
                }
              : u
        );
      });
    }
  }, [isOpen, itemToPublish, user]);

  // Effect to determine if publishing is allowed for restricted access
  useEffect(() => {
    if (responderAccess === "restricted") {
      // Check if there's at least one non-owner, verified user in the list
      const hasVerifiedNonOwnerUsers = localSharedUsers.some(
        (u) => u.role !== "owner" && u.isVerified
      );
      setCanPublishRestricted(hasVerifiedNonOwnerUsers);
    } else {
      setCanPublishRestricted(true); // Always allow publishing if access is 'anyone'
    }
  }, [responderAccess, localSharedUsers]);

  if (!isOpen) {
    return null;
  }

  // Find the project name from the projects list
  const currentProject = projects?.find(
    // Use optional chaining for projects
    (p) => p._id === itemToPublish.projectId
  );
  const projectName = currentProject
    ? currentProject.name
    : projects === undefined
    ? "Loading projects..."
    : "No Project Selected"; // Handle projects being undefined

  const ownerEmail = user?.email || "N/A"; // Get owner email from authenticated user
  const ownerId = user?._id || user?.id; // Get owner ID from authenticated user

  const handleToggleResponderAccess = () => {
    setResponderAccess((prev) => (prev === "anyone" ? "restricted" : "anyone"));
    setToastMessage(null); // Clear any previous errors when toggling
  };

  const handleAddMail = async () => {
    const trimmedEmail = newEmailInput.trim();
    setToastMessage(null); // Clear previous error

    if (trimmedEmail === "") {
      setToastMessage({ type: "error", text: "Email cannot be empty." });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setToastMessage({
        type: "error",
        text: "Please enter a valid email address.",
      });
      return;
    }

    // Check if email already in list (ignoring case)
    if (
      localSharedUsers.some(
        (existingUser) =>
          existingUser.email.toLowerCase() === trimmedEmail.toLowerCase()
      )
    ) {
      setToastMessage({
        type: "error",
        text: "Email is already in the sharing list.",
      });
      return;
    }

    // Prevent adding owner's email again if they are already explicitly added
    if (ownerEmail && trimmedEmail.toLowerCase() === ownerEmail.toLowerCase()) {
      setToastMessage({
        type: "info", // Changed to info, as it's not strictly an error, just redundant
        text: "Cannot explicitly add the owner's email; they already have full access.",
      });
      return;
    }

    // Step 1: Check if user exists in the backend
    const checkResult = await checkUserExistsByEmail(trimmedEmail);

    if (checkResult.success && checkResult.exists) {
      setLocalSharedUsers((prevUsers) => [
        ...prevUsers,
        {
          id: Date.now(), // Unique ID for React key
          email: trimmedEmail,
          role: newEmailRole,
          userId: checkResult.userId,
          isVerified: true, // Mark as verified on successful backend check
        },
      ]);
      setNewEmailInput("");
      setNewEmailRole("view"); // Reset for next add
      setToastMessage({
        type: "success",
        text: `User added for sharing.`,
      });
    } else if (checkResult.success && !checkResult.exists) {
      setToastMessage({
        type: "error",
        text: `User not found. Please ensure they have an account.`,
      });
    } else {
      setToastMessage({
        type: "error",
        text:
          checkResult.message || "Failed to verify email. Please try again.",
      });
    }
  };

  const handleRemoveMail = (id) => {
    setLocalSharedUsers((prevUsers) =>
      prevUsers.filter((mail) => mail.id !== id)
    );
    setToastMessage({ type: "info", text: "Email removed from sharing list." });
  };

  const handleChangeEmailRole = (id, newRole) => {
    setLocalSharedUsers((prevUsers) =>
      prevUsers.map((mail) =>
        mail.id === id ? { ...mail, role: newRole } : mail
      )
    );
    setToastMessage({ type: "info", text: "User role updated." });
  };

  const handlePublishClick = async () => {
    if (responderAccess === "restricted" && !canPublishRestricted) {
      setToastMessage({
        type: "error",
        text: "Please add at least one verified email to share with before publishing restricted.",
      });
      return;
    }

    setIsPublishing(true);
    let publishSuccess = false;
    let shareSuccess = true; // Assume true unless sharing is restricted and fails
    let sharingMessages = [];

    try {
      // Step 0: Always update the form before publishing
      const updateResult = await updateFormApi(
        itemToPublish._id,
        itemToPublish
      );
      if (!updateResult.success) {
        setToastMessage({
          type: "error",
          text: `Failed to save form before publishing: ${
            updateResult.message || "Unknown error"
          }`,
        });
        setIsPublishing(false);
        return; // Stop the process if saving fails
      }
      // console.log("Form saved successfully before publishing.");

      // Step 1: Share the form (if restricted access)
      if (responderAccess === "restricted") {
        // Filter out the owner from the list to be sent to shareForm API, and only send verified users
        const usersToShare = localSharedUsers.filter(
          (userEntry) =>
            userEntry.isVerified &&
            (userEntry.role !== "owner" || userEntry.userId !== ownerId)
        );

        for (const userEntry of usersToShare) {
          if (userEntry.userId) {
            const shareResult = await shareFormApi(
              itemToPublish._id,
              userEntry.email,
              userEntry.role
            );
            if (!shareResult.success) {
              shareSuccess = false;
              sharingMessages.push(
                `Failed to share with ${userEntry.email}: ${shareResult.message}`
              );
              console.error(
                `Failed to share with ${userEntry.email}:`,
                shareResult.message
              );
            }
          } else {
            shareSuccess = false;
            sharingMessages.push(`Cannot share with user: No user ID found.`);
          }
        }
      }

      // Step 2: Publish the form
      const publishResult = await publishFormApi(itemToPublish._id);
      if (publishResult.success) {
        publishSuccess = true;
        console.log("Form published successfully:", publishResult.form);
        if (onModalPublishSuccess) {
          onModalPublishSuccess(publishResult.form);
        }
      } else {
        // console.error("Failed to publish form:", publishResult.message);
        setToastMessage({
          type: "error",
          text: `Failed to publish form: ${publishResult.message}`,
        });
      }

      // Final success message/handling
      if (publishSuccess && shareSuccess) {
        // Close the modal and then navigate to dashboard
        onClose(); // Close the modal
        setToastMessage({
          type: "success",
          text: "Form published and shared successfully!",
        });
        setTimeout(() => {
          // Use setTimeout to allow the modal to close visually first
          navigate("/dashboard"); // Navigate to dashboard
        }, 600); // A small delay, adjust as needed
      } else if (publishSuccess && !shareSuccess) {
        setToastMessage({
          type: "warning",
          text: `Form published, but some sharing attempts failed: ${sharingMessages.join(
            "; "
          )}`,
        });
      }
    } catch (error) {
      console.error(
        "An unexpected error occurred during publishing/sharing:",
        error
      );
      setToastMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Determine if the publish button should be disabled
  const disablePublish =
    isPublishing ||
    formLoading ||
    (responderAccess === "restricted" && !canPublishRestricted);

  return (
    <div className="modal-overlay">
      <div className="modal-container" ref={modalRef}>
        <div className="modal-header">
          <div className="logo-with-heading">
            <div className="icon">
              <img src={cubeIcon} alt="Publish icon" />
            </div>
            <h2 className="modal-title">Publish</h2>
          </div>
          <button
            className="close-button"
            onClick={onClose}
            disabled={isPublishing}
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* Save to Project Section */}
          <label className="section-label">Save to</label>
          <div className="section-group">
            <div className="control-row">
              <span className="control-text">
                Project: <strong>{projectName}</strong>
              </span>
            </div>
          </div>

          {/* Responders Section */}
          <label className="section-label">Responders</label>
          <div className="section-group">
            <div className="control-row">
              <span className="control-text">
                {responderAccess === "anyone"
                  ? "Anyone with the Link"
                  : "Restricted Emails"}
              </span>
              <button
                className="manage-button"
                onClick={handleToggleResponderAccess}
                disabled={isPublishing}
              >
                Manage
              </button>
            </div>
          </div>

          {/* Share Section (visible only when responderAccess is 'restricted') */}
          {responderAccess === "restricted" && (
            <div className="section-group share-section">
              <label className="section-label">Share</label>
              <div className="email-list">
                {localSharedUsers.map((mail) => (
                  <div key={mail.id} className="email-item">
                    <input
                      type="email"
                      value={mail.email}
                      readOnly
                      className="email-input"
                      disabled={mail.isVerified} // <--- CORRECTED THIS LINE
                    />
                    <div className="role-selector-wrapper">
                      <select
                        value={mail.role}
                        onChange={(e) =>
                          handleChangeEmailRole(mail.id, e.target.value)
                        }
                        className="role-selector"
                        disabled={
                          mail.role === "owner" ||
                          isPublishing ||
                          !mail.isVerified
                        } // Owner's role not changeable, disable during publish, or if not verified
                      >
                        <option value="owner">Owner</option>
                        <option value="edit">Edit</option>
                        <option value="view">View</option>
                      </select>
                      {mail.role !== "owner" && ( // Only allow removing non-owners
                        <button
                          className="remove-email-button"
                          onClick={() => handleRemoveMail(mail.id)}
                          disabled={isPublishing}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="add-mail-section">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  className="email-input"
                  disabled={isPublishing || formLoading}
                />
                <select
                  value={newEmailRole}
                  onChange={(e) => setNewEmailRole(e.target.value)}
                  className="role-selector new-email-role"
                  disabled={isPublishing || formLoading}
                >
                  <option value="view">View</option>
                  <option value="edit">Edit</option>
                </select>
              </div>

              <button
                className="add-mail-button"
                onClick={handleAddMail}
                disabled={isPublishing || formLoading}
              >
                {formLoading ? "Verifying..." : "+ Add Mail"}
              </button>
            </div>
          )}

          {/* Publish Button */}
          <button
            className="create-button"
            onClick={handlePublishClick}
            disabled={disablePublish}
          >
            {isPublishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
          duration={3000}
        />
      )}
    </div>
  );
};

export default PublishModal;
