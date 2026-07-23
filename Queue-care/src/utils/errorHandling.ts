export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  const code = error?.error?.code || error?.code;
  const message = error?.error?.message || error?.message;

  if (code) {
    switch (code) {
      case 'INVALID_PHONE':
        return 'Please enter a valid phone number.';
      case 'OTP_SEND_FAILED':
        return 'Unable to send OTP. Please try again.';
      case 'OTP_RATE_LIMITED':
        return 'Too many requests. Please wait a while before requesting a new OTP.';
      case 'OTP_EXPIRED':
        return 'OTP expired. Please request a new OTP.';
      case 'INVALID_OTP':
        return 'Invalid OTP. Please try again.';
      case 'OTP_MAX_ATTEMPTS_EXCEEDED':
        return 'Too many incorrect attempts. Please request a new OTP.';
      case 'VERIFICATION_SESSION_EXPIRED':
        return 'Your verification session expired. Please verify your OTP again.';
      case 'VERIFICATION_SESSION_ALREADY_USED':
        return 'This session was already used. Please start over.';
      case 'INVALID_PASSWORD':
        return message || 'Password does not meet requirements.';
      case 'PASSWORD_MISMATCH':
        return 'Passwords do not match.';
      case 'USER_ALREADY_EXISTS':
        return 'An account with this phone number already exists.';
      case 'NETWORK_ERROR':
        return 'Unable to connect. Please check your internet connection.';
      case 'INTERNAL_SERVER_ERROR':
        return 'Something went wrong. Please try again.';
      case 'UNAUTHORIZED':
        return 'Session expired. Please log in again.';
      default:
        return message || 'An unexpected error occurred.';
    }
  }

  if (error?.message === 'Network Error' || error?.name === 'TypeError') {
    return 'Unable to connect. Please check your internet connection.';
  }

  return message || 'Something went wrong. Please try again.';
};
