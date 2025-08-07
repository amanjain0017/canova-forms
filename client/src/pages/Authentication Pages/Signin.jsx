import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Toast from "./../../components/Toast/Toast";

import "./AuthForm.css";
import canovaLogo from "../../assets/icons/canovaLogo.png";
import handWave from "../../assets/icons/waving-hand.svg";
import unhidePassword from "../../assets/icons/unhidepassword.png";
import hidePassword from "../../assets/icons/hidepassword.png";

const SignIn = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState(null); // Local toast state
  const navigate = useNavigate();
  const { signIn, loading, user, message, clearMessage } = useAuth(); // Get message from auth context

  // New useEffect hook to handle session-based redirection
  useEffect(() => {
    // Check if the user is already logged in and the loading state from the context is false
    // The !loading check ensures we don't prematurely redirect before the local storage check is complete
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]); // Rerun the effect if user, loading, or navigate changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setToastMessage(null); // Clear any existing toast
    clearMessage(); // Clear any existing auth context message

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    // Call the signIn function from AuthContext
    const result = await signIn(email, password);

    if (result.success) {
      // Show success toast
      setToastMessage({
        type: "success",
        text: "Sign in successful! Redirecting to dashboard...",
      });

      // Small delay before redirect to show the toast
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500); // 1.5 second delay
    } else {
      // Show error toast instead of inline error
      setToastMessage({
        type: "error",
        text: result.message || "Sign in failed. Please try again.",
      });
    }
  };

  // Handler to close toast
  const handleCloseToast = () => {
    setToastMessage(null);
    clearMessage();
  };

  // Get the message to display (prioritize local toast over auth context message)
  const displayMessage = toastMessage || message;

  return (
    <div className={`auth-container ${theme}`}>
      {/* Toast Component */}
      <Toast
        message={displayMessage}
        onClose={handleCloseToast}
        duration={4000} // 4 seconds for better visibility on auth pages
      />

      <div className="auth-logo-container">
        <img src={canovaLogo} alt="logo" className="canova-logo" />
        <span className="logo-name">CANOVA</span>
      </div>
      <div className="auth-card">
        <div className="auth-content">
          <h2 className="auth-title">
            Welcome CANOVA <img src={handWave} alt="wave" width={35} />
          </h2>
          <p className="auth-description">
            Today is a new day. It's your day. You shape it. Sign in to start
            managing your projects.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
                placeholder="Example@email.com"
              />
            </div>
            <div className="form-group password-group">
              <label htmlFor="password">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                placeholder="at least 8 characters"
              />
              {/* Password visibility toggle */}
              <div
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
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
            {/* Keep inline error for validation errors only */}
            {error && <p className="error-message">{error}</p>}
            <div className="auth-link-text forgot-password">
              <Link to="/forgot-password" className="auth-link">
                Forgot Password?
              </Link>
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="auth-bottom-links">
            <p className="auth-link-text">
              Don't you have an account?{" "}
              <Link to="/signup" className="auth-link">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
