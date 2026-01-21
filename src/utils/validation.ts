/**
 * Validation utilities for Israeli phone numbers and email addresses
 */

/**
 * Validates Israeli phone number formats:
 * - Mobile: 050-058, 10 digits (05X-XXXXXXX or 05XXXXXXXX)
 * - Landline: 02-09, 9 digits (0X-XXXXXXX or 0XXXXXXXXX)
 * - With or without dashes/spaces
 */
export function validateIsraeliPhone(phone: string): boolean {
  if (!phone) return false;

  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Mobile: 05X followed by 7 digits (total 10 digits)
  const mobileRegex = /^05[0-9]{8}$/;

  // Landline: 0 followed by 2-9 and then 7 digits (total 9 digits)
  const landlineRegex = /^0[2-9][0-9]{7}$/;

  // Also accept with country code +972
  const mobileWithCountryRegex = /^(\+972|972)5[0-9]{8}$/;
  const landlineWithCountryRegex = /^(\+972|972)[2-9][0-9]{7}$/;

  return (
    mobileRegex.test(cleaned) ||
    landlineRegex.test(cleaned) ||
    mobileWithCountryRegex.test(cleaned) ||
    landlineWithCountryRegex.test(cleaned)
  );
}

/**
 * Formats phone number for display (adds dashes)
 * Example: 0521234567 -> 052-123-4567
 */
export function formatIsraeliPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Mobile format: 05X-XXX-XXXX
  if (/^05[0-9]{8}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Landline format: 0X-XXX-XXXX
  if (/^0[2-9][0-9]{7}$/.test(cleaned)) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  }

  return phone;
}

/**
 * Validates email address format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;

  // Standard email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Get validation error message for phone
 */
export function getPhoneErrorMessage(phone: string): string | null {
  if (!phone) return 'Phone number is required';
  if (!validateIsraeliPhone(phone)) {
    return 'Please enter a valid Israeli phone number (e.g., 052-123-4567)';
  }
  return null;
}

/**
 * Get validation error message for email
 */
export function getEmailErrorMessage(email: string): string | null {
  if (!email) return 'Email is required';
  if (!validateEmail(email)) {
    return 'Please enter a valid email address';
  }
  return null;
}
