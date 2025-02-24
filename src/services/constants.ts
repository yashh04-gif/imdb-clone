export const API_KEY = '797e81f83e84e0fe85ca2a8bff917f51';
export const BASE_URL = 'https://api.themoviedb.org/3';

export const ErrorType = {
  NETWORK: 'NETWORK_ERROR',
  API: 'API_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  AUTH: 'AUTHENTICATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR'
};

export const handleApiError = (error: Error) => {
  if (error.message.includes('429')) {
    return { error: ErrorType.RATE_LIMIT, message: 'API rate limit exceeded. Please try again later.' };
  }
  if (error.message.includes('401')) {
    return { error: ErrorType.AUTH, message: 'Authentication failed. Please check your API key.' };
  }
  if (error.message.includes('404')) {
    return { error: ErrorType.NOT_FOUND, message: 'Resource not found.' };
  }
  if (!navigator.onLine) {
    return { error: ErrorType.NETWORK, message: 'Network connection lost. Please check your internet connection.' };
  }
  return { error: ErrorType.API, message: 'An API error occurred. Please try again.' };
};
