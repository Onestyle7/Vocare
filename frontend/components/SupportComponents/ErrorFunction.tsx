export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const responseError = error as { response?: { data?: string } };
    return responseError.response?.data || 'Please try again.';
  }
  return 'Please try again.';
}
