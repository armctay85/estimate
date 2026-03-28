import { describe, it, expect, beforeEach } from 'vitest';
import { validatePasswordStrength, checkRateLimit } from '../server/auth';

describe('Authentication Security', () => {
  describe('Password Validation', () => {
    it('should reject passwords shorter than 12 characters', () => {
      const result = validatePasswordStrength('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should require uppercase letters', () => {
      const result = validatePasswordStrength('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should require lowercase letters', () => {
      const result = validatePasswordStrength('UPPERCASE123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should require numbers', () => {
      const result = validatePasswordStrength('NoNumbers!');
      expect(result.valid).toBe(false);
    });

    it('should require special characters', () => {
      const result = validatePasswordStrength('NoSpecial123');
      expect(result.valid).toBe(false);
    });

    it('should accept strong passwords', () => {
      const result = validatePasswordStrength('Str0ng!Passw0rd');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Rate Limiting', () => {
    it('should track request counts', () => {
      const key = 'test-key';
      checkRateLimit(key, 100, 900000);
      const result = checkRateLimit(key, 100, 900000);
      expect(result.count).toBe(2);
    });

    it('should reset after window expires', () => {
      const key = 'test-key-reset';
      checkRateLimit(key, 100, 0); // 0ms window for testing
      const result = checkRateLimit(key, 100, 900000);
      expect(result.count).toBe(1);
    });
  });
});
