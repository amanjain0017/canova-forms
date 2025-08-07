import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import "./AuthForm.css";
import canovaLogo from "../../assets/icons/canovaLogo.png";
import unhidePassword from "../../assets/icons/unhidepassword.png";
import hidePassword from "../../assets/icons/hidepassword.png";

const CreateNewPassword = () => {
  const { theme } = useTheme();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const { resetPassword, forgotPasswordEmail, otpProofToken } = useAuth();

  // Redirect if the necessary tokens are not in the context
  useEffect(() => {
    if (!forgotPasswordEmail || !otpProofToken) {
      navigate("/forgot-password", { replace: true });
    }
  }, [forgotPasswordEmail, otpProofToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const response = await resetPassword(newPassword);

      if (response.success) {
        setSuccess(
          response.message ||
            "Password reset successful. Redirecting to sign in."
        );
        setTimeout(() => {
          setLoading(false);
          navigate("/signin");
        }, 1500);
      } else {
        setError(
          response.message || "Failed to reset password. Please try again."
        );
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-container ${theme}`}>
      <div className="auth-logo-container">
        <img src={canovaLogo} alt="logo" className="canova-logo" />
        <span className="logo-name">CANOVA</span>
      </div>
      <div className="auth-card">
        <div className="auth-content">
          <h2 className="auth-title">Create New Password</h2>
          <p className="auth-description">
            Today is a new day. You shape it. Sign in to start managing your
            projects.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group password-group">
              <label htmlFor="newPassword">Enter New Password</label>
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="form-input"
                placeholder="at least 8 characters"
              />

              <div
                className="password-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <img
                    src={hidePassword}
                    alt="hide-password"
                    className="password-icon"
                  />
                ) : (
                  <img
                    src={unhidePassword}
                    alt="unhide-password"
                    className="password-icon"
                  />
                )}
              </div>
            </div>
            <div className="form-group password-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="form-input"
                placeholder="at least 8 characters"
              />

              <div
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <img
                    src={hidePassword}
                    alt="hide-password"
                    className="password-icon"
                  />
                ) : (
                  <img
                    src={unhidePassword}
                    alt="unhide-password"
                    className="password-icon"
                  />
                )}
              </div>
            </div>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="auth-bottom-links">
            <p className="auth-link-text">
              <Link to="/signin" className="auth-link">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNewPassword;
