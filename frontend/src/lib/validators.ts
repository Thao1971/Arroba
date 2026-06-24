/**
 * Form validators. Pure functions, fully testable.
 * Reused from /app/_design_intake/registro/rj-validation.jsx ideas (CIF/NIF basic).
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export interface PasswordStrength {
  ok: boolean;
  minLength: boolean;
  hasNumber: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const minLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  return {
    minLength,
    hasNumber,
    ok: minLength && hasNumber,
  };
}

/**
 * Spanish CIF/NIF basic format check.
 * NIF: 8 digits + letter. Ej: 12345678Z
 * CIF: letter + 7 digits + (letter or digit). Ej: B12345678 or A1234567X
 * No validamos el dígito de control (no es objetivo en E1.1).
 */
const NIF_RE = /^\d{8}[A-Za-z]$/;
const CIF_RE = /^[ABCDEFGHJNPQRSUVWabcdefghjnpqrsuvw]\d{7}[A-J0-9]$/;
const NIE_RE = /^[XYZxyz]\d{7}[A-Za-z]$/;

export function isValidSpanishTaxId(taxId: string): boolean {
  const normalised = taxId.trim().toUpperCase();
  return CIF_RE.test(normalised) || NIF_RE.test(normalised) || NIE_RE.test(normalised);
}
