
import { REGXEMAIL } from "../regex/regex";


// Email validation for login
export const validateLoginEmail = (email) => {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }
  if (!REGXEMAIL.test(email)) {
    return 'Please enter a valid email address';
  }
  return '';
};

// Password validation for login
export const validateLoginPassword = (password) => {
  if (!password || password.trim() === '') {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return '';
};

// Complete login form validation
export const validateLoginForm = (formData) => {
  const errors = {};
  
  const emailError = validateLoginEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validateLoginPassword(formData.password);
  if (passwordError) errors.password = passwordError;
  
  return errors;
};