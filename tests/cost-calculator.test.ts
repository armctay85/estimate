import { describe, it, expect } from 'vitest';
import { calculateElementCost, applyRegionalFactor } from '../client/src/lib/cost-calculator';

describe('Cost Calculation Engine', () => {
  const baseElement = {
    id: 1,
    code: 'EL201',
    name: 'LED Downlight',
    unit: 'ea',
    baseRate: 85.00,
  };

  describe('Basic Calculations', () => {
    it('should calculate cost for single item', () => {
      const result = calculateElementCost(baseElement, 1, 'gladstone_qld');
      expect(result.total).toBe(85.00);
      expect(result.quantity).toBe(1);
    });

    it('should calculate cost for multiple items', () => {
      const result = calculateElementCost(baseElement, 50, 'gladstone_qld');
      expect(result.total).toBe(4250.00);
    });

    it('should handle zero quantity', () => {
      const result = calculateElementCost(baseElement, 0, 'gladstone_qld');
      expect(result.total).toBe(0);
    });
  });

  describe('Regional Factors', () => {
    it('should apply Sydney premium (1.15x)', () => {
      const result = applyRegionalFactor(baseElement.baseRate, 'sydney_nsw');
      expect(result).toBe(97.75);
    });

    it('should apply Darwin premium (1.25x)', () => {
      const result = applyRegionalFactor(baseElement.baseRate, 'darwin_nt');
      expect(result).toBe(106.25);
    });

    it('should apply Adelaide discount (0.95x)', () => {
      const result = applyRegionalFactor(baseElement.baseRate, 'adelaide_sa');
      expect(result).toBe(80.75);
    });

    it('should return base rate for unknown regions', () => {
      const result = applyRegionalFactor(baseElement.baseRate, 'unknown');
      expect(result).toBe(85.00);
    });
  });

  describe('Complex Calculations', () => {
    it('should calculate with regional factor and quantity', () => {
      const rateWithRegion = applyRegionalFactor(baseElement.baseRate, 'sydney_nsw');
      const result = calculateElementCost(
        { ...baseElement, baseRate: rateWithRegion },
        100,
        'sydney_nsw'
      );
      expect(result.total).toBe(9775.00);
    });
  });
});
