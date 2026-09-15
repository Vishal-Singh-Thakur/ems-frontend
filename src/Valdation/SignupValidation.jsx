// utils/signupValidation.js

import { REGXEMAIL, STRONGPASSWORD } from "../regex/regex";


// Name validation
export const validateSignupName = (name) => {
  if (!name || name.trim() === '') {
    return 'Full name is required';
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  return '';
};

// Email validation
export const validateSignupEmail = (email) => {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }
  if (!REGXEMAIL.test(email)) {
    return 'Please enter a valid email address';
  }
  return '';
};

// Password validation
export const validateSignupPassword = (password, useStrongPassword = true) => {
  if (!password || password.trim() === '') {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (useStrongPassword && !STRONGPASSWORD.test(password)) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  }
  return '';
};

// Confirm password validation
export const validateSignupConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return '';
};

// Complete signup form validation
export const validateSignupForm = (formData, useStrongPassword = true) => {
  const errors = {};
  
  const nameError = validateSignupName(formData.name);
  if (nameError) errors.name = nameError;
  
  const emailError = validateSignupEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validateSignupPassword(formData.password, useStrongPassword);
  if (passwordError) errors.password = passwordError;
  
  const confirmPasswordError = validateSignupConfirmPassword(formData.password, formData.confirmPassword);
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
  
  return errors;
};