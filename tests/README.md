# EstiMate Test Suite

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest run tests/auth.security.test.ts
```

## Test Structure

```
tests/
├── auth.security.test.ts    # Authentication & security tests
├── cost-calculator.test.ts  # Cost calculation engine tests
└── quote-analysis.test.ts   # Quote analysis & trust score tests
```

## Coverage Goals

- Authentication: 100%
- Cost calculations: 95%
- Quote analysis: 90%
- API endpoints: 80%

## Writing New Tests

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../path/to/module';

describe('Feature Name', () => {
  it('should do something specific', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```
