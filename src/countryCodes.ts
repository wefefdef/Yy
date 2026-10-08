export interface CountryInfo {
  name: string;
  code: string; // ISO 2-letter
  dialCode: string; // e.g. "+1"
  minDigits: number;
  maxDigits: number;
}

export const COUNTRIES: CountryInfo[] = [
  { name: 'United States', code: 'US', dialCode: '+1', minDigits: 10, maxDigits: 10 },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', minDigits: 10, maxDigits: 11 },
  { name: 'Canada', code: 'CA', dialCode: '+1', minDigits: 10, maxDigits: 10 },
  { name: 'Australia', code: 'AU', dialCode: '+61', minDigits: 9, maxDigits: 10 },
  { name: 'Germany', code: 'DE', dialCode: '+49', minDigits: 10, maxDigits: 12 },
  { name: 'France', code: 'FR', dialCode: '+33', minDigits: 9, maxDigits: 10 },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', minDigits: 9, maxDigits: 9 },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', minDigits: 9, maxDigits: 9 },
  { name: 'India', code: 'IN', dialCode: '+91', minDigits: 10, maxDigits: 10 },
  { name: 'Pakistan', code: 'PK', dialCode: '+92', minDigits: 10, maxDigits: 10 },
  { name: 'Italy', code: 'IT', dialCode: '+39', minDigits: 9, maxDigits: 11 },
  { name: 'Spain', code: 'ES', dialCode: '+34', minDigits: 9, maxDigits: 9 },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', minDigits: 9, maxDigits: 9 },
  { name: 'Switzerland', code: 'CH', dialCode: '+41', minDigits: 9, maxDigits: 9 },
  { name: 'Sweden', code: 'SE', dialCode: '+46', minDigits: 9, maxDigits: 10 },
  { name: 'Norway', code: 'NO', dialCode: '+47', minDigits: 8, maxDigits: 8 },
  { name: 'Denmark', code: 'DK', dialCode: '+45', minDigits: 8, maxDigits: 8 },
  { name: 'Ireland', code: 'IE', dialCode: '+353', minDigits: 9, maxDigits: 9 },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', minDigits: 8, maxDigits: 10 },
  { name: 'Singapore', code: 'SG', dialCode: '+65', minDigits: 8, maxDigits: 8 },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', minDigits: 9, maxDigits: 10 },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', minDigits: 9, maxDigits: 9 },
  { name: 'Turkey', code: 'TR', dialCode: '+90', minDigits: 10, maxDigits: 10 },
  { name: 'Brazil', code: 'BR', dialCode: '+55', minDigits: 10, maxDigits: 11 },
  { name: 'Mexico', code: 'MX', dialCode: '+52', minDigits: 10, maxDigits: 10 },
  { name: 'Argentina', code: 'AR', dialCode: '+54', minDigits: 10, maxDigits: 10 },
  { name: 'Colombia', code: 'CO', dialCode: '+57', minDigits: 10, maxDigits: 10 },
  { name: 'Chile', code: 'CL', dialCode: '+56', minDigits: 9, maxDigits: 9 },
  { name: 'Peru', code: 'PE', dialCode: '+51', minDigits: 9, maxDigits: 9 },
  { name: 'Japan', code: 'JP', dialCode: '+81', minDigits: 10, maxDigits: 10 },
  { name: 'South Korea', code: 'KR', dialCode: '+82', minDigits: 9, maxDigits: 10 },
  { name: 'China', code: 'CN', dialCode: '+86', minDigits: 11, maxDigits: 11 },
  { name: 'Hong Kong', code: 'HK', dialCode: '+852', minDigits: 8, maxDigits: 8 },
  { name: 'Philippines', code: 'PH', dialCode: '+63', minDigits: 10, maxDigits: 10 },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', minDigits: 9, maxDigits: 12 },
  { name: 'Thailand', code: 'TH', dialCode: '+66', minDigits: 9, maxDigits: 9 },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', minDigits: 9, maxDigits: 10 },
  { name: 'Qatar', code: 'QA', dialCode: '+974', minDigits: 8, maxDigits: 8 },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', minDigits: 8, maxDigits: 8 },
  { name: 'Bahrain', code: 'BH', dialCode: '+973', minDigits: 8, maxDigits: 8 },
  { name: 'Oman', code: 'OM', dialCode: '+968', minDigits: 8, maxDigits: 8 },
  { name: 'Egypt', code: 'EG', dialCode: '+20', minDigits: 10, maxDigits: 10 },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', minDigits: 10, maxDigits: 10 },
  { name: 'Kenya', code: 'KE', dialCode: '+254', minDigits: 9, maxDigits: 9 },
  { name: 'Ghana', code: 'GH', dialCode: '+233', minDigits: 9, maxDigits: 9 },
  { name: 'Morocco', code: 'MA', dialCode: '+212', minDigits: 9, maxDigits: 9 },
  { name: 'Poland', code: 'PL', dialCode: '+48', minDigits: 9, maxDigits: 9 },
  { name: 'Portugal', code: 'PT', dialCode: '+351', minDigits: 9, maxDigits: 9 },
  { name: 'Austria', code: 'AT', dialCode: '+43', minDigits: 10, maxDigits: 11 },
  { name: 'Belgium', code: 'BE', dialCode: '+32', minDigits: 9, maxDigits: 9 },
  { name: 'Greece', code: 'GR', dialCode: '+30', minDigits: 10, maxDigits: 10 },
  { name: 'Czech Republic', code: 'CZ', dialCode: '+420', minDigits: 9, maxDigits: 9 },
  { name: 'Romania', code: 'RO', dialCode: '+40', minDigits: 9, maxDigits: 10 },
  { name: 'Hungary', code: 'HU', dialCode: '+36', minDigits: 9, maxDigits: 9 },
  { name: 'Israel', code: 'IL', dialCode: '+972', minDigits: 9, maxDigits: 9 },
  { name: 'Ukraine', code: 'UA', dialCode: '+380', minDigits: 9, maxDigits: 9 },
];

/**
 * Validates a phone number given country dial code and local digits.
 */
export function validatePhoneNumber(dialCode: string, rawLocalNumber: string): {
  valid: boolean;
  cleanFullNumber: string;
  error?: string;
} {
  // Extract only digits from the local part
  const digits = rawLocalNumber.replace(/\D/g, '');

  if (!digits) {
    return { valid: false, cleanFullNumber: '', error: 'Phone number is required.' };
  }

  // Find country specs if matching dialCode
  const country = COUNTRIES.find((c) => c.dialCode === dialCode);
  const min = country ? country.minDigits : 6;
  const max = country ? country.maxDigits : 15;

  if (digits.length < min) {
    return {
      valid: false,
      cleanFullNumber: '',
      error: `Phone number is too short for ${country ? country.name : 'this country'}. Minimum ${min} digits required.`,
    };
  }

  if (digits.length > max) {
    return {
      valid: false,
      cleanFullNumber: '',
      error: `Phone number is too long for ${country ? country.name : 'this country'}. Maximum ${max} digits allowed.`,
    };
  }

  // Format cleanly: e.g. "+1 555-123-4567"
  const formatted = `${dialCode} ${digits}`;
  return { valid: true, cleanFullNumber: formatted };
}
