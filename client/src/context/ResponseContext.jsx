import React, { createContext, useContext, useState } from "react";
import axios from "axios";
// Import the custom hook to access the Auth Context
import { useAuth } from "./AuthContext";

// Create the context
const ResponseContext = createContext();

// This is a custom hook to easily use the Response Context.
export const useResponseContext = () => useContext(ResponseContext);

// Get the backend URL from the Vite environment variables.
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

// This provider component wraps your application and manages the response state.
export const ResponseProvider = ({ children }) => {
  // State for all responses for a particular form
  const [responses, setResponses] = useState([]);
  // State for a single response
  const [currentResponse, setCurrentResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use the auth context to get the current user and their token
  const { user, loading: authLoading } = useAuth();

  // Helper function to handle API calls with authentication
  const apiCall = async (
    method,
    endpoint,
    data = null,
    headers = {},
    requireAuth = true
  ) => {
    // For endpoints that require authentication, check if user is logged in
    if (requireAuth && (authLoading || !user || !user.token)) {
      setError("Please log in to perform this action.");
      return { success: false, message: "Not authenticated" };
    }

    setLoading(true);
    setError(null);

    const config = {
      method,
      url: `${BASE_URL}/api/responses/${endpoint}`,
      data,
      headers: {
        "Content-Type": "application/json",
        ...headers,
        ...(user && user.token && { Authorization: `Bearer ${user.token}` }),
      },
    };

    // console.log("Making API call:", config);

    try {
      const response = await axios(config);
      setLoading(false);
      // console.log("API response:", response.data);
      return response.data;
    } catch (err) {
      setLoading(false);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Network error. Please try again.";
      setError(errorMessage);
      console.error(`API call error to ${endpoint}:`, err);
      console.error("Error details:", err.response?.data);
      return { success: false, message: errorMessage };
    }
  };

  /* API functions for interacting with the backend endpoints */

  // Submit a new form response
  const submitFormResponse = async (formId, answers, timeTakenSeconds) => {
    console.log("submitFormResponse called with:", {
      formId,
      answers,
      timeTakenSeconds,
    });

    // The submitFormResponse endpoint is public, so no auth required
    const result = await apiCall(
      "post",
      formId,
      { answers, timeTakenSeconds },
      {},
      false
    );
    return result;
  };

  // Fetch all responses for a specific form
  const getFormResponses = async (formId) => {
    const result = await apiCall("get", `form/${formId}`, null, {}, true);
    if (result && result.success) {
      setResponses(result.responses);
    } else {
      setResponses([]);
    }
    return result;
  };

  // Fetch a single response by its ID
  const getResponseById = async (responseId) => {
    const result = await apiCall("get", `${responseId}`, null, {}, true);
    if (result && result.success) {
      setCurrentResponse(result.response);
    }
    return result;
  };

  const value = {
    responses,
    currentResponse,
    loading,
    error,
    submitFormResponse,
    getFormResponses,
    getResponseById,
    setCurrentResponse, // Allows components to set the current response directly
    setError, // Allows components to clear errors
  };

  return (
    <ResponseContext.Provider value={value}>
      {children}
    </ResponseContext.Provider>
  );
};
