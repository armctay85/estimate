import { describe, it, expect } from 'vitest';
import { calculateTrustScore, analyzeVariance } from '../client/src/lib/quote-analysis';

describe('Quote Analysis Engine', () => {
  const benchmarkRates = {
    'EL201': { low: 72.25, median: 85.00, high: 97.75 },
    'SC001': { low: 24.22, median: 28.50, high: 32.78 },
  };

  describe('Trust Score Calculation', () => {
    it('should give high score for quotes within benchmark range', () => {
      const lineItems = [
        { code: 'EL201', rate: 85.00 },
      ];
      const score = calculateTrustScore(lineItems, benchmarkRates);
      expect(score).toBeGreaterThanOrEqual(80);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should penalize quotes significantly above benchmark', () => {
      const lineItems = [
        { code: 'EL201', rate: 150.00 }, // 76% above median
      ];
      const score = calculateTrustScore(lineItems, benchmarkRates);
      expect(score).toBeLessThan(60);
    });

    it('should penalize quotes significantly below benchmark', () => {
      const lineItems = [
        { code: 'EL201', rate: 40.00 }, // 53% below median
      ];
      const score = calculateTrustScore(lineItems, benchmarkRates);
      expect(score).toBeLessThan(60);
    });

    it('should handle multiple line items', () => {
      const lineItems = [
        { code: 'EL201', rate: 85.00 },
        { code: 'SC001', rate: 28.50 },
      ];
      const score = calculateTrustScore(lineItems, benchmarkRates);
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('should handle unknown items gracefully', () => {
      const lineItems = [
        { code: 'UNKNOWN', rate: 100.00 },
      ];
      const score = calculateTrustScore(lineItems, benchmarkRates);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Variance Analysis', () => {
    it('should calculate positive variance correctly', () => {
      const variance = analyzeVariance(100, 85);
      expect(variance.percentage).toBeCloseTo(17.65, 1);
      expect(variance.direction).toBe('above');
    });

    it('should calculate negative variance correctly', () => {
      const variance = analyzeVariance(70, 85);
      expect(variance.percentage).toBeCloseTo(-17.65, 1);
      expect(variance.direction).toBe('below');
    });

    it('should handle zero variance', () => {
      const variance = analyzeVariance(85, 85);
      expect(variance.percentage).toBe(0);
      expect(variance.direction).toBe('match');
    });
  });
});
