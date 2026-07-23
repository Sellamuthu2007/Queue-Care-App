export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string;
  error?: string;
}

export const validateAndNormalizePhone = (phone: string): PhoneValidationResult => {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Phone number cannot be empty.' };
  }

  // Strip spaces, dashes, brackets, letters
  let cleaned = trimmed.replace(/[^0-9+]/g, '');

  // Remove duplicate '+' if any
  cleaned = cleaned.replace(/\+{2,}/g, '+');
  
  // Strip duplicate country codes
  if (cleaned.startsWith('+91+91')) {
    cleaned = cleaned.replace(/^\+91\+91/, '+91');
  }
  if (cleaned.startsWith('+9191') && cleaned.length > 12) {
    cleaned = cleaned.replace(/^\+9191/, '+91');
  }
  if (cleaned.startsWith('9191') && cleaned.length > 12) {
    cleaned = cleaned.replace(/^9191/, '91');
  }

  const phoneRegex = /^\+?[0-9]+$/;
  if (!phoneRegex.test(cleaned)) {
    return { isValid: false, error: 'Please enter a valid phone number.' };
  }

  if (cleaned.startsWith('+91')) {
    const digits = cleaned.slice(3);
    if (digits.length === 10) {
      return { isValid: true, normalized: cleaned };
    }
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    return { isValid: true, normalized: `+${cleaned}` };
  } else if (cleaned.length === 10) {
    return { isValid: true, normalized: `+91${cleaned}` };
  }

  return { isValid: false, error: 'Please enter a valid 10-digit phone number.' };
};
