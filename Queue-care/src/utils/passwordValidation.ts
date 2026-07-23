export interface PasswordRequirements {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

export const checkPasswordRequirements = (password: string): PasswordRequirements => {
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
};

export const getPasswordStrength = (requirements: PasswordRequirements): 'weak' | 'medium' | 'strong' => {
  const metCount = Object.values(requirements).filter(Boolean).length;
  if (metCount <= 2) {
    return 'weak';
  } else if (metCount === 3) {
    return 'medium';
  } else {
    return 'strong';
  }
};
