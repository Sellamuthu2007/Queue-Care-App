export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  const code = error?.error?.code || error?.code;
  const message = error?.error?.message || error?.message;

  if (code) {
    switch (code) {
      case 'NETWORK_ERROR':
        return 'Unable to connect. Please check your internet connection.';
      case 'INTERNAL_SERVER_ERROR':
        return 'Something went wrong. Please try again.';
      case 'UNAUTHORIZED':
        return 'Session expired. Please log in again.';
      case 'AUTH_FAILED':
      case 'AUTH_ERROR':
        return message || 'Authentication failed. Please try again.';
      default:
        return message || 'An unexpected error occurred.';
    }
  }

  if (error?.message === 'Network Error' || error?.name === 'TypeError') {
    return 'Unable to connect. Please check your internet connection.';
  }

  return message || 'Something went wrong. Please try again.';
};
