// export const REGXEMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
// export const STRONGPASSWORD =/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^\w\s]).*$/


export const REGEX_PATTERNS = {
  email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
  phone: /^[6-9]\d{9}$/,
  name: /^[a-zA-Z\s]{2,50}$/,
  employeeId: /^EMP\d{6}$/,
 title: /^[a-zA-Z0-9\s-]{3,150}$/,
};

export const VALIDATION_MESSAGES = {
  email: 'Please enter a valid email address',
  password: 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character',
  phone: 'Please enter a valid 10-digit phone number starting with 6-9',
  name: 'Name must be 2-50 characters and contain only letters',
  required: 'This field is required'
};
