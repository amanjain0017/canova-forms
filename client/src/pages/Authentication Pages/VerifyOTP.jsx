import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import "./AuthForm.css";
import canovaLogo from "../../assets/icons/canovaLogo.png";

const VerifyOTP = () => {
  const { theme } = useTheme();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const { verifyOtp, forgotPasswordEmail } = useAuth();

  // Redirect if the email isn't available in the context or localStorage
  useEffect(() => {
    if (!forgotPasswordEmail) {
      navigate("/forgot-password", { replace: true });
    }
  }, [forgotPasswordEmail, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      setLoading(false);
      return;
    }

    try {
      const response = await verifyOtp(otp);

      if (response.success) {
        setSuccess(
          response.message || "OTP verified successfully. Redirecting..."
        );
        navigate("/create-new-password");
      } else {
        setError(
          response.message || "OTP verification failed. Please try again."
        );
      }
    } catch (err) {
      console.error("OTP verification error:", err);
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
          <h2 className="auth-title">Enter Your OTP</h2>
          <p className="auth-description">
            We've sent a 6-digit OTP to your registered mail. Please enter it
            below to sign in.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="otp">OTP</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="form-input"
                placeholder="xxxxxx"
                maxLength="6"
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Confirming..." : "Confirm"}
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

export default VerifyOTP;
