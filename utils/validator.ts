export const validatePasswordStrength = (password: string) => {
  const errors = [];
  if (!/[A-Z]/.test(password)) errors.push('must contain uppercase');
  if (!/[a-z]/.test(password)) errors.push('must contain lowercase');
  if (!/\d/.test(password)) errors.push('must contain digit');
  if (!/[@$!%*?&]/.test(password)) errors.push('must contain special character');
  if (password.length < 8) errors.push('must be at least 8 characters');

  return {
    valid: errors.length === 0,
    errors,
  };
};
