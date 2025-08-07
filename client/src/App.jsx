import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { FormProvider } from "./context/FormContext";
import { ResponseProvider } from "./context/ResponseContext";
import { ProjectProvider } from "./context/ProjectContext";

// Import your authentication pages
import SignIn from "./pages/Authentication Pages/Signin";
import Signup from "./pages/Authentication Pages/Signup";
import ForgotPassword from "./pages/Authentication Pages/ForgotPassword";
import VerifyOTP from "./pages/Authentication Pages/VerifyOTP";
import CreateNewPassword from "./pages/Authentication Pages/CreateNewPassword";

// Import your main application pages and components
import Dashboard from "./pages/Dashboard/Dashboard";
import Projects from "./pages/Projects/Projects";
import ProjectDetail from "./pages/ProjectDetail/ProjectDetail";
import {
  Analysis,
  ProjectAnalysis,
  FormAnalysis,
} from "./pages/Analysis/Analysis";
import Profile from "./pages/Profile/Profile";
import Settings from "./pages/Settings/Settings";
import FormBuilder from "./pages/FormBuilder/FormBuilder";
import PublicFormPage from "./pages/PublicFormPage/PublicFormPage";

import "./App.css";

// A component that protects routes, redirecting unauthenticated users to the sign-in page.
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  return children;
};

// Main App Component with all routing logic
const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ProjectProvider>
            <FormProvider>
              <ResponseProvider>
                <Routes>
                  {/* Public Routes (Authentication pages) */}
                  <Route path="/" element={<Navigate to="/signin" replace />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/verify-otp" element={<VerifyOTP />} />
                  <Route
                    path="/create-new-password"
                    element={<CreateNewPassword />}
                  />

                  <Route
                    path="/forms/public/:formId"
                    element={<PublicFormPage />}
                  />

                  {/* Protected Routes (Main application) */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analysis"
                    element={
                      <ProtectedRoute>
                        <Analysis />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analysis/projects/:projectId"
                    element={
                      <ProtectedRoute>
                        <ProjectAnalysis />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analysis/forms/:formId"
                    element={
                      <ProtectedRoute>
                        <FormAnalysis />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/projects"
                    element={
                      <ProtectedRoute>
                        <Projects />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/projects/:projectId"
                    element={
                      <ProtectedRoute>
                        <ProjectDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/create-form/:formId"
                    element={
                      <ProtectedRoute>
                        <FormBuilder />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </ResponseProvider>
            </FormProvider>
          </ProjectProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
