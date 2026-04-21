/**
 * Validates that a phone number is exactly 10 digits (Indian format without country code).
 * Strips spaces before checking.
 */
export const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\s+/g, '');
  return /^\d{10}$/.test(digits);
};

/**
 * Strips non-digit characters and limits to 10 digits for phone input.
 */
export const sanitizePhone = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 10);
};
