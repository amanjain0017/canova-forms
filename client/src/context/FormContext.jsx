import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { useProjectContext } from "./ProjectContext";

const FormContext = createContext();

export const useFormContext = () => useContext(FormContext);

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const publicAxiosInstance = axios.create({
  baseURL: `${BASE_URL}`, // The base URL for your backend
});

export const FormProvider = ({ children }) => {
  const [forms, setForms] = useState([]);
  const [currentForm, setCurrentForm] = useState(null);
  const [sharedForms, setSharedForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user, loading: authLoading } = useAuth();
  // Access getRecentWorks from ProjectContext
  const { getRecentWorks } = useProjectContext();

  // Helper function to get shared forms storage key
  const getSharedFormsStorageKey = () =>
    user?.id || user?._id ? `shared_forms_${user.id || user._id}` : null;

  // Load shared forms from localStorage
  const loadSharedFormsFromStorage = () => {
    const storageKey = getSharedFormsStorageKey();
    if (!storageKey) return [];
    try {
      const storedData = localStorage.getItem(storageKey);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error("Error loading shared forms from localStorage:", error);
      return [];
    }
  };

  // Save shared forms to localStorage
  const saveSharedFormsToStorage = (dataToSave) => {
    const storageKey = getSharedFormsStorageKey();
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Error saving shared forms to localStorage:", error);
    }
  };

  // Load shared forms from localStorage when user changes
  useEffect(() => {
    if (!authLoading && user) {
      const cachedSharedForms = loadSharedFormsFromStorage();
      setSharedForms(cachedSharedForms);
    } else if (!user) {
      setSharedForms([]);
    }
  }, [user, authLoading]);

  const apiCall = async (method, endpoint, data = null, headers = {}) => {
    if (authLoading || !user || !user.token) {
      setError("Please log in to perform this action.");
      return { success: false, message: "Not authenticated" };
    }

    setLoading(true);
    setError(null);

    const config = {
      method,
      url: `${BASE_URL}/api/forms/${endpoint}`,
      data,
      headers: {
        ...headers,
        Authorization: `Bearer ${user.token}`,
      },
    };

    try {
      const response = await axios(config); // Assuming your main axios instance is configured to use token
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Network error. Please try again.";
      setError(errorMessage);
      console.error(`API call error to ${endpoint}:`, err);
      return { success: false, message: errorMessage };
    }
  };

  /* API functions for interacting with the backend endpoints */

  // check user existence
  const checkUserExistsByEmail = async (email) => {
    if (authLoading || !user || !user.token) {
      setError("Please log in to perform this action.");
      return { success: false, message: "Not authenticated" };
    }

    setLoading(true);
    setError(null);

    const config = {
      method: "get",
      url: `${BASE_URL}/api/auth/check-email?email=${encodeURIComponent(
        email
      )}`, // Assuming /api/users endpoint for user checks
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    };

    try {
      const response = await axios(config);
      setLoading(false);
      return response.data; // Should return { success: true, exists: boolean, userId?: string, email?: string }
    } catch (err) {
      setLoading(false);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Network error. Please try again.";
      setError(errorMessage);
      console.error(`API call error to check-email:`, err);
      return { success: false, message: errorMessage };
    }
  };

  // Function to refresh shared forms in localStorage
  const refreshSharedForms = async (forceRefresh = false) => {
    if (!user) return { success: false, message: "No user authenticated" };

    // If not forcing refresh, check if data exists in cache
    if (!forceRefresh && sharedForms.length > 0) {
      return { success: true, sharedForms, fromCache: true };
    }

    // Fetch fresh data from API
    const result = await apiCall("get", "shared");
    if (result.success) {
      const formsWithType = result.forms.map((form) => ({
        ...form,
        type: "form",
      }));
      setSharedForms(formsWithType);
      saveSharedFormsToStorage(result.forms); // Save original data to localStorage
    } else {
      setSharedForms([]);
    }
    return result;
  };

  const createForm = async (title, projectId) => {
    const result = await apiCall("post", "", { title, projectId });
    if (result.success) {
      setForms((prevForms) => [result.form, ...prevForms]);
      await getRecentWorks(true); // <--- Call to refresh recent works
    }
    return result;
  };

  const getFormsByProject = async (projectId) => {
    const result = await apiCall("get", `project/${projectId}`);
    if (result.success) {
      setForms(result.forms);
    } else {
      setForms([]);
    }
    return result;
  };

  const getFormById = async (formId) => {
    const result = await apiCall("get", `${formId}`);
    if (result.success) {
      setCurrentForm(result.form);
    }
    return result;
  };

  const updateForm = async (formId, updatedData) => {
    const result = await apiCall("put", `${formId}`, updatedData);
    if (result.success) {
      setCurrentForm(result.form);
      setForms((prevForms) =>
        prevForms.map((form) => (form._id === formId ? result.form : form))
      );
      await getRecentWorks(true);
    }
    return result;
  };

  const deleteForm = async (formId) => {
    const result = await apiCall("delete", `${formId}`);
    if (result.success) {
      setForms((prevForms) => prevForms.filter((form) => form._id !== formId));
      await getRecentWorks(true);
    }
    return result;
  };

  const publishForm = async (formId) => {
    const result = await apiCall("put", `${formId}/publish`);
    if (result.success) {
      setCurrentForm(result.form);
      setForms((prevForms) =>
        prevForms.map((form) => (form._id === formId ? result.form : form))
      );
      await getRecentWorks(true);
    }
    return result;
  };

  const shareForm = async (formId, email, accessLevel) => {
    const result = await apiCall("post", `${formId}/share`, {
      email,
      accessLevel,
    });
    if (result.success) {
      setCurrentForm(result.form);
      setForms((prevForms) =>
        prevForms.map((form) => (form._id === formId ? result.form : form))
      );

      await refreshSharedForms(true);
    }
    return result;
  };

  const getSharedForms = async (forceRefresh = false) => {
    // If not forcing refresh and we have cached data, return it
    if (!forceRefresh && sharedForms.length > 0) {
      return { success: true, sharedForms, fromCache: true };
    }

    const result = await apiCall("get", `shared`);
    if (result.success) {
      const formsWithType = result.forms.map((form) => ({
        ...form,
        type: "form",
      }));
      setSharedForms(formsWithType);
      setForms(result.forms); // Keep original setForms for compatibility
      saveSharedFormsToStorage(result.forms); // Save to localStorage
    } else {
      setSharedForms([]);
    }
    return result;
  };

  const getPublicFormById = async (formId) => {
    setLoading(true);
    setError(null);
    try {
      // Use the publicAxiosInstance here!
      const response = await publicAxiosInstance.get(
        `/api/forms/public/${formId}`
      );
      setLoading(false);
      return { success: true, form: response.data.form };
    } catch (err) {
      console.error("Error fetching public form:", err);
      setLoading(false);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch public form.";
      if (err.response && err.response.status === 403) {
        setError("This form is not publicly accessible.");
        return {
          success: false,
          message: "This form is not publicly accessible.",
        };
      }
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const value = {
    forms,
    currentForm,
    sharedForms,
    loading,
    error,
    createForm,
    getFormsByProject,
    getFormById,
    getPublicFormById,
    updateForm,
    deleteForm,
    publishForm,
    shareForm,
    getSharedForms,
    refreshSharedForms,
    setCurrentForm,
    checkUserExistsByEmail,
    setError,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};
