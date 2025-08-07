import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState(
    () => localStorage.getItem("forgotPasswordEmail") || null
  );
  const [otpProofToken, setOtpProofToken] = useState(
    () => localStorage.getItem("otpProofToken") || null
  );

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const API_URL = `${API_BASE_URL}/api/auth`;

  // Clears messages after a delay
  const setTemporaryMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  // Get localStorage keys for user-specific data
  const getProjectsStorageKey = (userId) =>
    userId ? `projects_${userId}` : null;
  const getRecentWorksStorageKey = (userId) =>
    userId ? `recent_works_${userId}` : null;
  const getSharedFormsStorageKey = (userId) =>
    userId ? `shared_forms_${userId}` : null;

  // Fetch and store projects after authentication
  const fetchAndStoreProjects = async (userToken, userId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/projects/myprojects`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      if (response.data.success) {
        const storageKey = getProjectsStorageKey(userId);
        if (storageKey) {
          localStorage.setItem(
            storageKey,
            JSON.stringify(response.data.projects)
          );
        }
      }
    } catch (err) {
      console.error("Error fetching projects after authentication:", err);
    }
  };

  // Fetch and store recent works after authentication
  const fetchAndStoreRecentWorks = async (userToken, userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/projects/recent`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (response.data.success) {
        const storageKey = getRecentWorksStorageKey(userId);
        if (storageKey) {
          localStorage.setItem(
            storageKey,
            JSON.stringify(response.data.recentWorks)
          );
        }
      }
    } catch (err) {
      console.error("Error fetching recent works after authentication:", err);
    }
  };

  // Fetch and store shared forms after authentication
  const fetchAndStoreSharedForms = async (userToken, userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/forms/shared`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (response.data.success) {
        const storageKey = getSharedFormsStorageKey(userId);
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(response.data.forms));
        }
      }
    } catch (err) {
      console.error("Error fetching shared forms after authentication:", err);
    }
  };

  // Clear user-specific data from localStorage
  const clearUserDataFromStorage = (userId) => {
    const projectStorageKey = getProjectsStorageKey(userId);
    if (projectStorageKey) {
      localStorage.removeItem(projectStorageKey);
    }
    const recentWorksStorageKey = getRecentWorksStorageKey(userId);
    if (recentWorksStorageKey) {
      localStorage.removeItem(recentWorksStorageKey);
    }
    const sharedFormsStorageKey = getSharedFormsStorageKey(userId);
    if (sharedFormsStorageKey) {
      localStorage.removeItem(sharedFormsStorageKey);
    }
  };

  const apiCall = async (method, endpoint, data = null) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await axios({
        method,
        url: `${API_URL}/${endpoint}`,
        data,
      });
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Network error. Please try again.";
      setError(errorMessage);
      console.error(`API call error to ${endpoint}:`, err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    const token =
      user?.token ||
      (localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user")).token
        : null);

    if (!token) {
      setLoading(false);
      setUser(null);
      return { success: false, message: "No token found." };
    }

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const result = await apiCall("get", "profile");
    if (result.success) {
      const fetchedUser = { ...user, ...result.data.user, token: token };
      setUser(fetchedUser);
      localStorage.setItem("user", JSON.stringify(fetchedUser));
      return { success: true, user: fetchedUser };
    } else {
      setUser(null);
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
    }
    return result;
  };

  useEffect(() => {
    const loadUserFromStorageAndFetchProfile = async () => {
      setLoading(true);
      setError(null);

      const storedUserString = localStorage.getItem("user");
      let storedUser = null;

      if (storedUserString) {
        try {
          storedUser = JSON.parse(storedUserString);
          setUser(storedUser);
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${storedUser.token}`;
        } catch (e) {
          console.error("Failed to parse user data from localStorage", e);
          localStorage.removeItem("user");
          setUser(null);
        }
      }

      if (storedUser && storedUser.token) {
        await fetchUserProfile();
      }
      setLoading(false);
    };

    loadUserFromStorageAndFetchProfile();
  }, []);

  const signUp = async (name, email, password) => {
    const result = await apiCall("post", "signup", { name, email, password });
    if (result.success) {
      const userWithToken = { ...result.data.user, token: result.data.token };
      setUser(userWithToken);
      localStorage.setItem("user", JSON.stringify(userWithToken));
      setTemporaryMessage({
        type: "success",
        text: "Account created successfully!",
      });
      await fetchUserProfile();

      // Fetch and store user data (projects, recent works, and shared forms)
      const currentUserId = result.data.user.id || result.data.user._id;
      await fetchAndStoreProjects(result.data.token, currentUserId);
      await fetchAndStoreRecentWorks(result.data.token, currentUserId);
      await fetchAndStoreSharedForms(result.data.token, currentUserId); // New: Fetch shared forms
    } else {
      setTemporaryMessage({ type: "error", text: result.message });
    }
    return result;
  };

  const signIn = async (email, password) => {
    const result = await apiCall("post", "signin", { email, password });
    if (result.success) {
      const userWithToken = { ...result.data.user, token: result.data.token };
      setUser(userWithToken);
      localStorage.setItem("user", JSON.stringify(userWithToken));
      setTemporaryMessage({ type: "success", text: "Logged in successfully!" });
      await fetchUserProfile();

      // Fetch and store user data (projects, recent works, and shared forms)
      const currentUserId = result.data.user.id || result.data.user._id;
      await fetchAndStoreProjects(result.data.token, currentUserId);
      await fetchAndStoreRecentWorks(result.data.token, currentUserId);
      await fetchAndStoreSharedForms(result.data.token, currentUserId); // New: Fetch shared forms
    } else {
      setTemporaryMessage({ type: "error", text: result.message });
    }
    return result;
  };

  const signOut = async () => {
    const currentUserId = user?.id || user?._id;
    const result = await apiCall("post", "logout");

    setUser(null);
    localStorage.removeItem("user");

    setForgotPasswordEmail(null);
    localStorage.removeItem("forgotPasswordEmail");

    setOtpProofToken(null);
    localStorage.removeItem("otpProofToken");

    localStorage.removeItem("theme");

    // Clear all user-specific data from localStorage
    if (currentUserId) {
      clearUserDataFromStorage(currentUserId);
    }

    delete axios.defaults.headers.common["Authorization"];
    setTemporaryMessage({ type: "success", text: "Logged out successfully!" });
    return result;
  };

  const sendOtp = async (email) => {
    const result = await apiCall("post", "forgotpassword", { email });
    if (result.success) {
      setForgotPasswordEmail(email);
      localStorage.setItem("forgotPasswordEmail", email);
      setTemporaryMessage({ type: "success", text: "OTP sent to your email!" });
    } else {
      setTemporaryMessage({ type: "error", text: result.message });
    }
    return result;
  };

  const verifyOtp = async (otp) => {
    const result = await apiCall("post", "verifyotp", {
      email: forgotPasswordEmail,
      otp,
    });
    if (result.success) {
      setOtpProofToken(result.data.passwordResetProofToken);
      localStorage.setItem(
        "otpProofToken",
        result.data.passwordResetProofToken
      );
      setTemporaryMessage({
        type: "success",
        text: "OTP verified successfully!",
      });
    } else {
      setTemporaryMessage({ type: "error", text: result.message });
    }
    return result;
  };

  const resetPassword = async (newPassword) => {
    const result = await apiCall("put", "resetpassword", {
      email: forgotPasswordEmail,
      newPassword,
      passwordResetProofToken: otpProofToken,
    });

    if (result.success) {
      const userWithToken = { ...result.data.user, token: result.data.token };
      setUser(userWithToken);
      localStorage.setItem("user", JSON.stringify(userWithToken));

      setForgotPasswordEmail(null);
      localStorage.removeItem("forgotPasswordEmail");

      setOtpProofToken(null);
      localStorage.removeItem("otpProofToken");

      setTemporaryMessage({
        type: "success",
        text: "Password reset successfully!",
      });
      await fetchUserProfile();

      // Fetch and store user data (projects, recent works, and shared forms)
      const currentUserId = result.data.user.id || result.data.user._id;
      await fetchAndStoreProjects(result.data.token, currentUserId);
      await fetchAndStoreRecentWorks(result.data.token, currentUserId);
      await fetchAndStoreSharedForms(result.data.token, currentUserId); // New: Fetch shared forms
    } else {
      setTemporaryMessage({ type: "error", text: result.message });
    }
    return result;
  };

  const getUserProfile = async () => fetchUserProfile();

  const updateUserProfile = async (profileData) => {
    const result = await apiCall("put", "profile", profileData);
    if (result.success) {
      const userWithToken = { ...user, ...result.data.user };
      setUser(userWithToken);
      localStorage.setItem("user", JSON.stringify(userWithToken));
      setTemporaryMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
    } else {
      setTemporaryMessage({ type: "error", text: result.message });
    }
    return result;
  };

  const updateUserPreferences = async (preferencesData) => {
    const result = await apiCall("put", "preferences", preferencesData);
    if (result.success) {
      const userWithToken = { ...user, ...result.data.user };
      setUser(userWithToken);
      localStorage.setItem("user", JSON.stringify(userWithToken));
      setTemporaryMessage({
        type: "success",
        text: "Preferences updated successfully!",
      });
    } else {
      setTemporaryMessage({ type: "error", text: result.message });
    }
    return result;
  };

  const value = {
    user,
    loading,
    error,
    message,
    signUp,
    signIn,
    signOut,
    sendOtp,
    verifyOtp,
    resetPassword,
    getUserProfile,
    updateUserProfile,
    updateUserPreferences,
    forgotPasswordEmail,
    otpProofToken,
    clearError: () => setError(null),
    clearMessage: () => setMessage(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
