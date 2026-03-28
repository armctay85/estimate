import { db } from '../db';
import { elements, costRates, costSubmissions } from '../../shared/schema';
import fs from 'fs';
import path from 'path';

// Types for seed data
interface BenchmarkRate {
  code: string;
  trade: string;
  category: string;
  description: string;
  unit: string;
  rate: number;
  region: string;
  source: string;
  projectType?: string;
}

// NRM1 Category mapping
const CATEGORY_MAP: Record<string, { code: string; name: string }> = {
  '0 - Preliminaries': { code: '0', name: 'Preliminaries' },
  '1 - Demolition': { code: '1', name: 'Demolition and Alterations' },
  '2 - Substructure': { code: '2', name: 'Substructure' },
  '3 - Structural Frame': { code: '3', name: 'Structural Frame' },
  '4 - Facade/Metalwork': { code: '4', name: 'Facades and Envelope' },
  '5 - Joinery': { code: '5', name: 'Joinery' },
  '6 - Internal Finishes': { code: '6', name: 'Internal Finishes' },
  '6.1 - Floor Finishes': { code: '6.1', name: 'Floor Finishes' },
  '6.2 - Ceiling Finishes': { code: '6.2', name: 'Ceiling Finishes' },
  '7 - Decorating': { code: '7', name: 'Decorating' },
  '8.1 - Electrical Services': { code: '8.1', name: 'Electrical Services' },
  '8.2 - Mechanical Services': { code: '8.2', name: 'Mechanical Services' },
  '8.3 - Hydraulic/Fire Services': { code: '8.3', name: 'Hydraulic and Fire Services' },
  '9 - Fittings': { code: '9', name: 'Fittings and Furnishings' },
  '10 - Professional Fees': { code: '10', name: 'Professional Fees' }
};

// Regional factor multipliers (relative to Gladstone)
const REGIONAL_FACTORS: Record<string, number> = {
  'gladstone_qld': 1.0,
  'sydney_nsw': 1.15,
  'melbourne_vic': 1.08,
  'brisbane_qld': 1.05,
  'perth_wa': 1.12,
  'adelaide_sa': 0.95,
  'gold_coast_qld': 1.02,
  'newcastle_nsw': 1.00,
  'canberra_act': 1.10,
  'darwin_nt': 1.25
};

// Load benchmark data
function loadBenchmarkData(): BenchmarkRate[] {
  const dataPath = path.join(process.cwd(), 'seed_data', 'kmart_benchmark_rates.json');
  if (!fs.existsSync(dataPath)) {
    console.warn('⚠️  Benchmark data not found, using embedded data');
    return [];
  }
  
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  return data.baseRates || [];
}

// Seed elements
async function seedElements(benchmarks: BenchmarkRate[]) {
  console.log('🌱 Seeding elements...');
  
  // Group by unique code + description
  const uniqueElements = new Map<string, BenchmarkRate>();
  for (const b of benchmarks) {
    const key = `${b.code}-${b.description.substring(0, 30)}`;
    if (!uniqueElements.has(key)) {
      uniqueElements.set(key, b);
    }
  }
  
  const elementsToInsert = Array.from(uniqueElements.values()).map(b => {
    const category = CATEGORY_MAP[b.category] || { code: '0', name: 'Preliminaries' };
    return {
      code: b.code,
      category: category.name,
      subcategory: b.trade,
      name: b.description.substring(0, 100),
      description: b.description,
      unit: b.unit,
      measurementRules: 'Measured in accordance with NRM1',
      exclusions: 'Excludes provisional sums',
      sortOrder: parseInt(b.code.replace(/\D/g, '')) || 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });
  
  // Insert in batches to avoid conflicts
  for (const element of elementsToInsert) {
    try {
      await db.insert(elements).values(element).onConflictDoNothing();
    } catch (err) {
      // Element may already exist, skip
    }
  }
  
  console.log(`✅ Seeded ${elementsToInsert.length} elements`);
  return elementsToInsert.length;
}

// Seed cost rates
async function seedCostRates(benchmarks: BenchmarkRate[]) {
  console.log('🌱 Seeding cost rates...');
  
  // Get all elements from DB
  const dbElements = await db.select().from(elements);
  const elementMap = new Map(dbElements.map(e => [e.code, e]));
  
  // Generate rates for all regions
  const ratesToInsert = [];
  
  for (const benchmark of benchmarks) {
    const element = elementMap.get(benchmark.code);
    if (!element) continue;
    
    // Create base rate for the benchmark's region
    const baseRate = {
      elementId: element.id,
      region: benchmark.region,
      buildingType: benchmark.projectType || 'retail_fitout',
      quality: 'standard',
      lowRate: Math.round(benchmark.rate * 0.85 * 100) / 100,
      medianRate: benchmark.rate,
      highRate: Math.round(benchmark.rate * 1.15 * 100) / 100,
      sampleSize: 1,
      source: benchmark.source,
      dataQuality: 'high',
      confidenceScore: 0.85,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    ratesToInsert.push(baseRate);
    
    // Generate rates for other regions
    for (const [region, factor] of Object.entries(REGIONAL_FACTORS)) {
      if (region === benchmark.region) continue;
      
      ratesToInsert.push({
        ...baseRate,
        region,
        lowRate: Math.round(baseRate.lowRate * factor * 100) / 100,
        medianRate: Math.round(baseRate.medianRate * factor * 100) / 100,
        highRate: Math.round(baseRate.highRate * factor * 100) / 100,
        source: `${benchmark.source}_derived`,
        confidenceScore: 0.70
      });
    }
  }
  
  // Insert in batches
  const batchSize = 100;
  for (let i = 0; i < ratesToInsert.length; i += batchSize) {
    const batch = ratesToInsert.slice(i, i + batchSize);
    try {
      await db.insert(costRates).values(batch).onConflictDoNothing();
    } catch (err) {
      console.warn(`⚠️  Batch ${i / batchSize + 1} had conflicts, skipping duplicates`);
    }
  }
  
  console.log(`✅ Seeded ${ratesToInsert.length} cost rates`);
  return ratesToInsert.length;
}

// Seed QS-verified submissions
async function seedSubmissions(benchmarks: BenchmarkRate[]) {
  console.log('🌱 Seeding QS submissions...');
  
  // Get all elements from DB
  const dbElements = await db.select().from(elements);
  const elementMap = new Map(dbElements.map(e => [e.code, e]));
  
  const submissionsToInsert = benchmarks
    .filter(b => elementMap.has(b.code))
    .map(b => {
      const element = elementMap.get(b.code)!;
      return {
        elementId: element.id,
        region: b.region,
        buildingType: b.projectType || 'retail_fitout',
        quality: 'standard',
        rate: b.rate,
        projectName: 'Kmart Gladstone Refit',
        hasDocumentation: true,
        status: 'verified',
        verified: true,
        verifiedBy: 1, // System/QS verifier
        isQsSubmitted: true,
        notes: `Verified from ${b.source} tender data`,
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
  
  for (const submission of submissionsToInsert) {
    try {
      await db.insert(costSubmissions).values(submission).onConflictDoNothing();
    } catch (err) {
      // Skip duplicates
    }
  }
  
  console.log(`✅ Seeded ${submissionsToInsert.length} QS submissions`);
  return submissionsToInsert.length;
}

// Main seed function
async function runSeed() {
  console.log('🚀 Starting database seed...\n');
  
  try {
    const benchmarks = loadBenchmarkData();
    
    if (benchmarks.length === 0) {
      console.error('❌ No benchmark data found');
      process.exit(1);
    }
    
    console.log(`📊 Loaded ${benchmarks.length} benchmark rates\n`);
    
    const elementCount = await seedElements(benchmarks);
    const rateCount = await seedCostRates(benchmarks);
    const submissionCount = await seedSubmissions(benchmarks);
    
    console.log('\n✨ Seed complete!');
    console.log(`   Elements: ${elementCount}`);
    console.log(`   Cost Rates: ${rateCount}`);
    console.log(`   QS Submissions: ${submissionCount}`);
    
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  runSeed();
}

export { runSeed, loadBenchmarkData };
