export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required.';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Please enter a valid email address.';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  // Optional: Add complexity checks here
  return null;
};

export const validateFullName = (name: string): string | null => {
  if (!name) return 'Full name is required.';
  if (name.trim().split(' ').length < 2) return 'Please enter your first and last name.';
  return null;
};
