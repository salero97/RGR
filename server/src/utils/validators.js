const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const FULL_NAME_REGEX = /^[A-Za-zА-Яа-яЁё]+(?:[\s-][A-Za-zА-Яа-яЁё]+)+$/;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

function isValidFullName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (/\d/.test(trimmed)) return false;
  return FULL_NAME_REGEX.test(trimmed);
}

module.exports = { isValidEmail, isValidPassword, isValidFullName };