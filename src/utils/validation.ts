export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getEmailRegistrationError(error: string | null | undefined): string | null {
  if (!error) return null;

  const normalized = error.toLowerCase();
  if (
    normalized.includes('already registered') ||
    normalized.includes('already been registered') ||
    normalized.includes('user already registered') ||
    normalized.includes('already exists')
  ) {
    return 'This email is already registered';
  }

  return null;
}
