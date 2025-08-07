// utils/validation.js
export const validateProfileData = (data) => {
  const errors = {};

  // Name validation - required and cannot be empty
  if (!data.name || data.name.trim().length === 0) {
    errors.name = "Name is required and cannot be empty";
  } else if (data.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters long";
  }

  // Mobile validation - optional but if provided, must be 10 digits
  if (data.mobile && data.mobile.trim() !== "") {
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(data.mobile.trim())) {
      errors.mobile = "Mobile number must be exactly 10 digits";
    }
  }

  // Location validation - optional, no specific rules for now
  // Could add length limits if needed
  if (data.location && data.location.trim().length > 100) {
    errors.location = "Location cannot exceed 100 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const formatMobileNumber = (mobile) => {
  // Remove all non-digit characters
  const cleaned = mobile.replace(/\D/g, "");

  // Limit to 10 digits
  return cleaned.slice(0, 10);
};

export const sanitizeProfileData = (data) => {
  return {
    name: data.name ? data.name.trim() : "",
    mobile: data.mobile ? data.mobile.trim() : "",
    location: data.location ? data.location.trim() : "",
  };
};
