# Elemental Cost Database

A comprehensive NRM1/AIQS-aligned construction cost database system for the EstiMate platform.

## Overview

The Elemental Cost Database is the core data moat of the EstiMate construction estimation platform. It provides:

- **100+ Standard Elements** aligned with NRM1 (New Rules of Measurement) and AIQS standards
- **Regional Cost Factors** for 30+ Australian cities
- **Multi-dimensional Rates** by building type, quality level, and location
- **Crowdsourced Data** with QS verification workflow
- **Inflation Tracking** with monthly cost index updates

## Database Schema

### Core Tables

#### 1. Elements (Master List)
```sql
elements: {
  id: serial,
  code: string,           // NRM1 code (e.g., "1.1.1")
  category: string,       // Substructure, Superstructure, etc.
  subcategory: string,    // Foundations, Floor construction, etc.
  name: string,           // "Concrete slab on ground"
  description: text,
  unit: string,           // m2, m3, m, each, etc.
  measurementRules: text,
  exclusions: text,
  sortOrder: integer,
  isActive: boolean
}
```

#### 2. Cost Rates
```sql
costRates: {
  id: serial,
  elementId: integer,
  region: string,
  buildingType: string,
  quality: string,
  lowRate: decimal,       // 10th percentile
  medianRate: decimal,    // 50th percentile
  highRate: decimal,      // 90th percentile
  sampleSize: integer,
  source: string,         // industry_data, user_contributed, qs_partner
  dataQuality: string,    // high, medium, low
  confidenceScore: decimal
}
```

#### 3. Regional Factors
```sql
regionalFactors: {
  id: serial,
  region: string,
  state: string,
  overallFactor: decimal,    // Relative to Sydney (1.0)
  laborFactor: decimal,
  materialFactor: decimal,
  equipmentFactor: decimal,
  transportFactor: decimal,
  marketCondition: string,   // hot, warm, stable, cool, cold
  costIndex: decimal
}
```

#### 4. Cost Submissions (Crowdsourcing)
```sql
costSubmissions: {
  id: serial,
  elementId: integer,
  region: string,
  buildingType: string,
  quality: string,
  rate: decimal,
  status: string,        // pending, verified, rejected
  verified: boolean,
  verifiedBy: integer,
  isQsSubmitted: boolean
}
```

## API Endpoints

### Elements
- `GET /api/elements` - List all elements with filtering
- `GET /api/elements/:id` - Get element details with rates
- `GET /api/elements/categories/list` - Get NRM1 categories

### Cost Estimation
- `POST /api/costs/estimate` - Get cost estimate for element
  ```json
  {
    "elementId": 123,
    "region": "Sydney",
    "buildingType": "residential_detached",
    "quality": "standard",
    "quantity": 100
  }
  ```

- `POST /api/costs/estimate-bulk` - Bulk estimation
- `GET /api/costs/regions` - Regional comparison for element

### Crowdsourcing
- `POST /api/costs/submit` - Submit cost data
- `GET /api/costs/submissions` - List submissions
- `POST /api/costs/submissions/:id/verify` - Verify submission (QS only)

### Reference Data
- `GET /api/costs/reference` - All reference data
- `GET /api/regions` - Regional factors
- `GET /api/building-types` - Building type definitions
- `GET /api/quality-levels` - Quality level definitions

## UI Components

### CostDatabaseExplorer
Browse and search the element database by category.

```tsx
import { CostDatabaseExplorer } from "@/components/cost-database";

function Page() {
  return <CostDatabaseExplorer />;
}
```

### ElementSelector
Autocomplete element selector with rate preview.

```tsx
import { ElementSelector } from "@/components/cost-database";

function Form() {
  return (
    <ElementSelector
      onSelect={(element, rate) => console.log(element, rate)}
      region="Sydney"
      buildingType="residential_detached"
      quality="standard"
    />
  );
}
```

### CostSubmissionForm
Form for submitting cost data with QS verification.

```tsx
import { CostSubmissionForm } from "@/components/cost-database";

function Page() {
  return <CostSubmissionForm onSuccess={() => toast("Submitted!")} />;
}
```

### RegionalComparisonChart
Visualize cost differences across regions.

```tsx
import { RegionalComparisonChart } from "@/components/cost-database";

function Page() {
  return (
    <RegionalComparisonChart
      elementName="Concrete slab on ground"
      baseRate={125}
      baseRegion="Sydney"
      comparisons={comparisons}
    />
  );
}
```

## Data Sources

### Initial Seed Data
- **Rawlinsons Construction Handbook 2025**
- **Cordell Construction Cost Guide**
- **AIQS Building Cost Index**
- **Industry QS Partners**

### Regional Factors
Based on comprehensive analysis of:
- Labor market conditions
- Material transport costs
- Local market competition
- Regulatory requirements

### Quality Levels
- **Basic**: Economy specifications, ~75% of standard
- **Standard**: Good quality, baseline (100%)
- **Premium**: High-end, ~135% of standard
- **Luxury**: Exceptional, ~185% of standard

## Building Types

- Residential: detached, apartment, townhouse
- Commercial: retail, office (low/high rise)
- Industrial: warehouse, manufacturing
- Healthcare: hospital, clinic
- Education: school, university
- Hospitality: hotel, restaurant
- Special: sports, aged care, civic

## Regions

### New South Wales
- Sydney (base: 1.0)
- Newcastle (0.92)
- Wollongong (0.94)
- Canberra (0.98)
- And 10+ regional centers

### Victoria
- Melbourne (0.95)
- Geelong (0.88)
- Ballarat (0.82)
- Bendigo (0.81)

### Queensland
- Brisbane (0.92)
- Gold Coast (0.90)
- Sunshine Coast (0.88)
- Cairns (0.82)
- Townsville (0.83)
- And 5+ regional centers

### Other States
- Perth (0.98)
- Adelaide (0.88)
- Hobart (0.90)
- Darwin (1.15)

## Usage Examples

### Get Cost Estimate
```typescript
const response = await fetch('/api/costs/estimate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    elementId: 25, // Concrete slab on ground
    region: 'Melbourne',
    buildingType: 'residential_detached',
    quality: 'standard',
    quantity: 150 // m2
  })
});

const result = await response.json();
// { low: 17250, median: 25350, high: 34500, confidence: 'high' }
```

### Submit Cost Data
```typescript
const response = await fetch('/api/costs/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    elementId: 25,
    region: 'Sydney',
    buildingType: 'residential_detached',
    quality: 'standard',
    rate: 135.00,
    projectName: 'Smith Residence',
    hasDocumentation: true
  })
});
```

## Admin & Verification

### QS Verification Workflow
1. User submits cost data
2. Submission enters "pending" state
3. Verified QS reviews submission
4. QS approves/rejects with notes
5. Approved data contributes to rate calculations

### Rate Calculation
- New submissions are aggregated monthly
- Outliers are filtered using IQR method
- Median rate is recalculated
- Sample size and confidence updated

## Migration

Run the database migration:
```bash
npm run db:push
```

Seed the database:
```bash
npx tsx server/seed/run-seed.ts
```

## Future Enhancements

### Planned Features
- [ ] Machine learning for rate prediction
- [ ] BIM integration for automatic quantity extraction
- [ ] Market condition forecasting
- [ ] Integration with major QS software
- [ ] Mobile app for field data collection

### Inflation Tracking
- Monthly cost index updates
- Predictive inflation models
- Historical trend analysis

## License

Proprietary - EstiMate Platform

## Contributing

Cost data contributions welcome from verified Quantity Surveyors.
Contact: support@estimate.app
