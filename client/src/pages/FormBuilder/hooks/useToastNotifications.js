// hooks/useToastNotifications.js
import { useState, useCallback } from "react";

export const useToastNotifications = () => {
  const [toastMessage, setToastMessage] = useState(null);

  // Function to display a toast message
  const showToast = useCallback((text, type) => {
    setToastMessage({ text, type });
  }, []);

  // Function to clear the toast message
  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  return {
    toastMessage,
    showToast,
    clearToast,
  };
};
