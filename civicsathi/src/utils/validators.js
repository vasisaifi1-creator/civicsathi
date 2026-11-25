import { ALLOWED_IMAGE_TYPES, CATEGORIES, MAX_IMAGE_BYTES } from './constants';

// Every function returns translation KEYS (or null) so messages follow the chosen language.

export function validateImage(file) {
  if (!file) return null;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'val.imageType';
  if (file.size === 0) return 'val.imageEmpty';
  if (file.size > MAX_IMAGE_BYTES) return 'val.imageSize';
  return null;
}

export function validateComplaintForm(v) {
  const errors = {};
  const title = v.title.trim();
  const description = v.description.trim();
  const city = v.city.trim();
  const locality = v.locality.trim();

  if (title.length < 5 || title.length > 120) errors.title = 'val.titleLen';
  if (!CATEGORIES.includes(v.category)) errors.category = 'val.categoryRequired';
  if (description.length < 20 || description.length > 1000) errors.description = 'val.descLen';
  if (!v.state) errors.state = 'val.stateRequired';
  if (city.length < 2 || city.length > 80) errors.city = 'val.cityRequired';
  if (locality.length < 3 || locality.length > 120) errors.locality = 'val.localityLen';
  return errors;
}

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

export function validatePassword(password) {
  if (password.length < 8) return 'val.passwordLen';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'val.passwordMix';
  return null;
}

export function validatePhone(phone) {
  if (!phone) return null; // optional
  return /^[0-9+() -]{7,20}$/.test(phone.trim()) ? null : 'val.phone';
}
