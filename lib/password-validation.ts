/**
 * Password Validation Utilities
 * Enforce password complexity rules from backend:
 * Minimum 8 characters, uppercase, lowercase, digit, special character
 */

export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-5
  errors: string[];
  hints: string[];
}

/**
 * Validate password against backend rules
 * Rules: min 8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit, ≥1 special char
 *
 * @param password - Password to validate
 * @returns Validation result with score and feedback
 *
 * @example
 * ```ts
 * const result = validatePassword('MyPassword123!');
 * if (!result.isValid) {
 *   console.log(result.errors); // ["Missing uppercase", ...]
 * }
 * ```
 */
export function validatePassword(password: string): PasswordStrength {
  const errors: string[] = [];
  let score = 0;

  if (!password) {
    return {
      isValid: false,
      score: 0,
      errors: ["Password is required"],
      hints: [
        "✓ At least 8 characters",
        "✓ Uppercase letter (A-Z)",
        "✓ Lowercase letter (a-z)",
        "✓ Number (0-9)",
        "✓ Special character (!@#$%^&*)",
      ],
    };
  }

  // Check length
  if (password.length < 8) {
    errors.push(`Password must be at least 8 characters (currently ${password.length})`);
  } else {
    score++;
  }

  // Check uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push("Must contain at least one uppercase letter (A-Z)");
  } else {
    score++;
  }

  // Check lowercase
  if (!/[a-z]/.test(password)) {
    errors.push("Must contain at least one lowercase letter (a-z)");
  } else {
    score++;
  }

  // Check digit
  if (!/\d/.test(password)) {
    errors.push("Must contain at least one number (0-9)");
  } else {
    score++;
  }

  // Check special character
  const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
  if (!specialCharRegex.test(password)) {
    errors.push(
      "Must contain at least one special character (!@#$%^&*)"
    );
  } else {
    score++;
  }

  // Build hints showing what's required
  const hints: string[] = [];
  if (password.length >= 8) {
    hints.push("✓ At least 8 characters");
  } else {
    hints.push(`✗ At least 8 characters (${password.length} so far)`);
  }

  if (/[A-Z]/.test(password)) {
    hints.push("✓ Uppercase letter (A-Z)");
  } else {
    hints.push("✗ Uppercase letter (A-Z)");
  }

  if (/[a-z]/.test(password)) {
    hints.push("✓ Lowercase letter (a-z)");
  } else {
    hints.push("✗ Lowercase letter (a-z)");
  }

  if (/\d/.test(password)) {
    hints.push("✓ Number (0-9)");
  } else {
    hints.push("✗ Number (0-9)");
  }

  if (specialCharRegex.test(password)) {
    hints.push("✓ Special character (!@#$%^&*)");
  } else {
    hints.push("✗ Special character (!@#$%^&*)");
  }

  return {
    isValid: errors.length === 0,
    score,
    errors,
    hints,
  };
}

/**
 * Get color for password strength indicator
 * Based on score (0-5)
 */
export function getPasswordStrengthColor(score: number): string {
  if (score === 0) return "bg-destructive";
  if (score === 1) return "bg-red-500";
  if (score === 2) return "bg-orange-500";
  if (score === 3) return "bg-yellow-500";
  if (score === 4) return "bg-lime-500";
  return "bg-green-500";
}

/**
 * Get label for password strength
 */
export function getPasswordStrengthLabel(score: number): string {
  if (score === 0) return "No password";
  if (score === 1) return "Very weak";
  if (score === 2) return "Weak";
  if (score === 3) return "Fair";
  if (score === 4) return "Good";
  return "Strong";
}
