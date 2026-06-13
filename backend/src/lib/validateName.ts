export interface NameValidationResult {
  valid: boolean;
  error?: string;
}

export function validateName(name: string): NameValidationResult {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Name must be between 1 and 100 characters" };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: "Name must be between 1 and 100 characters" };
  }
  return { valid: true };
}
