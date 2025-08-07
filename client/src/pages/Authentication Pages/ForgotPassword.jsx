import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import "./AuthForm.css";
import canovaLogo from "../../assets/icons/canovaLogo.png";
import handWave from "../../assets/icons/waving-hand.svg";

const ForgotPassword = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Use the useAuth hook to get the sendOtp function
  const { sendOtp, user } = useAuth();

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
    setLoading(true);
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    try {
      // Call the sendOtp function from AuthContext
      const response = await sendOtp(email);

      if (response.success) {
        setSuccess(response.message || "OTP sent successfully. Redirecting...");
        // On success, navigate to the next step
        navigate("/verify-otp");
      } else {
        // Handle API errors
        setError(response.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      // Handle network or unexpected errors
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      // Ensure loading state is reset after the API call
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
          <h2 className="auth-title">
            Welcome CANOVA <img src={handWave} alt="wave" width={35} />
          </h2>
          <p className="auth-description">
            Please enter your registered email ID to receive an OTP.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
                placeholder="Enter your registered email"
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Sending..." : "Send Mail"}
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

export default ForgotPassword;
