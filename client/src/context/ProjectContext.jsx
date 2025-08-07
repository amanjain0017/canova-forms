import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const ProjectContext = createContext();

export const useProjectContext = () => useContext(ProjectContext);

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [recentWorks, setRecentWorks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user, loading: authLoading } = useAuth();

  // Get localStorage keys for user-specific data
  const getProjectsStorageKey = () =>
    user?.id || user?._id ? `projects_${user.id || user._id}` : null;
  const getRecentWorksStorageKey = () =>
    user?.id || user?._id ? `recent_works_${user.id || user._id}` : null;

  // Load data from localStorage
  const loadFromStorage = (key) => {
    const storageKey =
      key === "projects" ? getProjectsStorageKey() : getRecentWorksStorageKey();
    if (!storageKey) return [];
    try {
      const storedData = localStorage.getItem(storageKey);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return [];
    }
  };

  // Save data to localStorage
  const saveToStorage = (key, dataToSave) => {
    const storageKey =
      key === "projects" ? getProjectsStorageKey() : getRecentWorksStorageKey();
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  // Load projects and recent works from localStorage when user changes
  useEffect(() => {
    if (!authLoading && user) {
      setProjects(loadFromStorage("projects"));
      setRecentWorks(loadFromStorage("recentWorks"));
    } else if (!user) {
      setProjects([]);
      setCurrentProject(null);
      setRecentWorks([]);
    }
  }, [user, authLoading]);

  // Helper for authenticated API calls
  const apiCall = async (method, endpoint, data = null, headers = {}) => {
    if (authLoading || !user || !user.token) {
      setError("Please log in to perform this action.");
      return { success: false, message: "Not authenticated" };
    }

    setLoading(true);
    setError(null);

    const config = {
      method,
      url: `${BASE_URL}/api/projects/${endpoint}`,
      data,
      headers: {
        ...headers,
        Authorization: `Bearer ${user.token}`,
      },
    };

    try {
      const response = await axios(config);
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

  /* API functions */

  // Create a new project
  const createProject = async (name) => {
    const result = await apiCall("post", "", { name });
    if (result.success) {
      const updatedProjects = [result.project, ...projects];
      setProjects(updatedProjects);
      saveToStorage("projects", updatedProjects);
      await getRecentWorks(true); // <--- Call getRecentWorks after creation
    }
    return result;
  };

  // Fetch all projects for the authenticated user
  const getMyProjects = async (forceRefresh = false) => {
    if (!forceRefresh && projects.length > 0) {
      return { success: true, projects, fromCache: true };
    }
    const result = await apiCall("get", "myprojects");
    if (result.success) {
      setProjects(result.projects);
      saveToStorage("projects", result.projects);
    } else {
      setProjects([]);
    }
    return result;
  };

  // Fetch a single project by its ID
  const getProjectById = async (projectId) => {
    const cachedProject = projects.find((p) => p._id === projectId);
    if (cachedProject) {
      setCurrentProject(cachedProject);
      return { success: true, project: cachedProject, fromCache: true };
    }

    const result = await apiCall("get", `${projectId}`);
    if (result.success) {
      setCurrentProject(result.project);
      const updatedProjects = projects.map((p) =>
        p._id === projectId ? result.project : p
      );
      if (!projects.find((p) => p._id === projectId)) {
        updatedProjects.push(result.project);
      }
      setProjects(updatedProjects);
      saveToStorage("projects", updatedProjects);
      await getRecentWorks(true); // <--- Call getRecentWorks after viewing/updating via ID
    }
    return result;
  };

  // Update a project
  const updateProject = async (projectId, updatedData) => {
    const result = await apiCall("put", `${projectId}`, updatedData);
    if (result.success) {
      setCurrentProject(result.project);
      const updatedProjects = projects.map((project) =>
        project._id === projectId ? result.project : project
      );
      setProjects(updatedProjects);
      saveToStorage("projects", updatedProjects);
      await getRecentWorks(true); // <--- Call getRecentWorks after update
    }
    return result;
  };

  // Delete a project
  const deleteProject = async (projectId) => {
    const result = await apiCall("delete", `${projectId}`);
    if (result.success) {
      const updatedProjects = projects.filter(
        (project) => project._id !== projectId
      );
      setProjects(updatedProjects);
      saveToStorage("projects", updatedProjects);

      if (currentProject && currentProject._id === projectId) {
        setCurrentProject(null);
      }
      await getRecentWorks(true); // <--- Call getRecentWorks after deletion
    }
    return result;
  };

  // Fetch recent projects and forms
  const getRecentWorks = async (forceRefresh = false) => {
    if (!forceRefresh && recentWorks.length > 0) {
      return { success: true, recentWorks, fromCache: true };
    }
    const result = await apiCall("get", "recent");
    if (result.success) {
      setRecentWorks(result.recentWorks);
      saveToStorage("recentWorks", result.recentWorks);
    } else {
      setRecentWorks([]);
    }
    return result;
  };

  const value = {
    projects,
    currentProject,
    recentWorks,
    loading,
    error,
    createProject,
    getMyProjects,
    getProjectById,
    updateProject,
    deleteProject,
    getRecentWorks,
    setCurrentProject,
    setError,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};
