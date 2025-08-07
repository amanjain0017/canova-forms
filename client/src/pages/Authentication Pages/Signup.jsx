import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import "./AuthForm.css";
import canovaLogo from "../../assets/icons/canovaLogo.png";
import unhidePassword from "../../assets/icons/unhidepassword.png";
import hidePassword from "../../assets/icons/hidepassword.png";
import handWave from "../../assets/icons/waving-hand.svg";

const Signup = () => {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { signUp, loading, user } = useAuth(); // Use the auth context hook

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
    setSuccess("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    // Call the signUp function from AuthContext
    const result = await signUp(name, email, password);

    if (result.success) {
      setSuccess(result.message);
      // Redirect to the dashboard on successful sign-up
      navigate("/dashboard");
    } else {
      setError(result.message);
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
            Today is a new day. It's your day. You shape it. Sign up to start
            managing your projects.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-input"
                placeholder="Name"
              />
            </div>
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
              <label htmlFor="password">Create Password</label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                placeholder="at least 8 characters"
              />
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
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>

          <div className="auth-bottom-links">
            <p className="auth-link-text">
              Do you have an account?{" "}
              <Link to="/signin" className="auth-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
