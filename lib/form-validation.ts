/**
 * Form Validation Utilities
 * Reusable validation functions for common fields
 */

/**
 * Validate email format
 */
export function validateEmail(email: string): string | null {
  if (!email || email.trim() === "") {
    return "Email is required";
  }

  const trimmed = email.trim();

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return "Please enter a valid email address";
  }

  return null;
}

/**
 * Validate full name
 */
export function validateFullName(fullName: string): string | null {
  if (!fullName || fullName.trim() === "") {
    return "Full name is required";
  }

  const trimmed = fullName.trim();

  if (trimmed.length < 2) {
    return "Full name must be at least 2 characters";
  }

  if (trimmed.length > 100) {
    return "Full name must be less than 100 characters";
  }

  // Check for at least one space (first and last name)
  if (!trimmed.includes(" ")) {
    return "Please provide both first and last name";
  }

  return null;
}

/**
 * Validate role
 */
export function validateRole(role: string): string | null {
  const validRoles = [
    "admin",
    "service",
    "radiologist",
    "imaging_technician",
    "radiographer",
  ];

  if (!role) {
    return "Role is required";
  }

  if (!validRoles.includes(role)) {
    return "Invalid role";
  }

  return null;
}
