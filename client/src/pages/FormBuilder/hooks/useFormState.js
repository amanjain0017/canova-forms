import { useState, useCallback } from "react";

export const useFormState = (formId, getFormById, showToast) => {
  const [form, setForm] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchForm = useCallback(async () => {
    if (formId) {
      setIsInitialLoading(true);
      try {
        const result = await getFormById(formId);
        if (result.success && result.form) {
          setForm(result.form);
        } else {
          showToast("Failed to load form", "error");
        }
      } catch (error) {
        console.error("Error fetching form:", error);
        showToast("Error loading form", "error");
      } finally {
        setIsInitialLoading(false);
      }
    }
  }, [formId, getFormById, showToast]);

  return {
    form,
    setForm,
    isInitialLoading,
    fetchForm,
  };
};
