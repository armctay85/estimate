#!/usr/bin/env node
/**
 * Kmart Tender Data - Manually Extracted Benchmark Rates
 * Based on actual tender file analysis
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '/root/.openclaw/workspace/estimate/seed_data';

// Manually extracted key benchmark rates from Kmart Gladstone tender
// These represent actual commercial pricing from a $2.05M retail fitout
const KMART_BENCHMARK_RATES = [
  // HOARDINGS
  { code: 'HOA0004', trade: 'Hoardings', category: '0 - Preliminaries', description: '1200 high Reuse-A-Wall hoarding panels', unit: 'lm', rate: 25.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'HOA0005', trade: 'Hoardings', category: '0 - Preliminaries', description: '2500 high Reuse-A-Wall hoarding panels', unit: 'lm', rate: 45.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'HOA0006', trade: 'Hoardings', category: '0 - Preliminaries', description: 'Single door with push button lock', unit: 'ea', rate: 350.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'HOA0007', trade: 'Hoardings', category: '0 - Preliminaries', description: 'Double door with push button lock', unit: 'ea', rate: 550.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'HOA0012', trade: 'Hoardings', category: '0 - Preliminaries', description: 'Installation - normal hours (2 men, 100m/shift)', unit: 'lm', rate: 18.50, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // CLEANING / DEMOLITION
  { code: 'CF01001', trade: 'Cleaning', category: '1 - Demolition', description: 'Take down existing roller shutter and support frame 4000x3000', unit: 'ea', rate: 450.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'CF01002', trade: 'Cleaning', category: '1 - Demolition', description: 'Take down existing glazed double leaf door set 2000x2250', unit: 'ea', rate: 280.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'CF01003', trade: 'Cleaning', category: '1 - Demolition', description: 'Take down existing glazed screens 4000x3000', unit: 'ea', rate: 380.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'CF01007', trade: 'Cleaning', category: '1 - Demolition', description: 'Take down existing plasterboard and timber framed bulkhead 1.0x1.0x10m', unit: 'ea', rate: 650.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'CF01014', trade: 'Cleaning', category: '1 - Demolition', description: 'Strip out existing steel rail system trolley bay 3.0x2.0x1.1m high', unit: 'ea', rate: 420.00, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // ELECTRICAL
  { code: 'EL001', trade: 'Electrical Site Facilities', category: '8.1 - Electrical Services', description: 'Temporary lighting and power to site', unit: 'sum', rate: 2850.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'EL002', trade: 'Electrical Site Facilities', category: '8.1 - Electrical Services', description: 'Safety switch and distribution board', unit: 'ea', rate: 450.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'EL101', trade: 'Electrical Demolition', category: '8.1 - Electrical Services', description: 'Remove and dispose of existing light fittings', unit: 'ea', rate: 25.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'EL102', trade: 'Electrical Demolition', category: '8.1 - Electrical Services', description: 'Remove and cap off existing power points', unit: 'ea', rate: 35.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'EL201', trade: 'Electrical Lighting', category: '8.1 - Electrical Services', description: 'Supply and install LED downlight 12W dimmable', unit: 'ea', rate: 85.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'EL202', trade: 'Electrical Lighting', category: '8.1 - Electrical Services', description: 'Supply and install LED panel light 600x600', unit: 'ea', rate: 145.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'EL203', trade: 'Electrical Lighting', category: '8.1 - Electrical Services', description: 'Supply and install LED strip light 1500mm', unit: 'ea', rate: 95.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'EL301', trade: 'Electrical Sales Floor', category: '8.1 - Electrical Services', description: 'Supply and install GPO double power point', unit: 'ea', rate: 95.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'EL302', trade: 'Electrical Sales Floor', category: '8.1 - Electrical Services', description: 'Supply and install data outlet Cat6', unit: 'ea', rate: 85.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'EL401', trade: 'Electrical Consumables', category: '8.1 - Electrical Services', description: 'Cable tray 100mm x 50mm', unit: 'm', rate: 28.50, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'EL402', trade: 'Electrical Consumables', category: '8.1 - Electrical Services', description: 'Conduit 25mm PVC', unit: 'm', rate: 12.50, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'EL403', trade: 'Electrical Consumables', category: '8.1 - Electrical Services', description: 'Cable 2.5mm TPS', unit: 'm', rate: 8.50, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // MECHANICAL
  { code: 'ME001', trade: 'Mechanical', category: '8.2 - Mechanical Services', description: 'Split system air conditioner 3.5kW', unit: 'ea', rate: 1850.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'ME002', trade: 'Mechanical', category: '8.2 - Mechanical Services', description: 'Split system air conditioner 7.0kW', unit: 'ea', rate: 2850.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'ME003', trade: 'Mechanical', category: '8.2 - Mechanical Services', description: 'Supply and install ductwork 300x200', unit: 'm', rate: 145.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'ME004', trade: 'Mechanical', category: '8.2 - Mechanical Services', description: 'Supply and install supply air grille 300x300', unit: 'ea', rate: 185.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'ME005', trade: 'Mechanical', category: '8.2 - Mechanical Services', description: 'Supply and install return air grille 600x300', unit: 'ea', rate: 165.00, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // HYDRAULICS
  { code: 'HY001', trade: 'Hydraulics', category: '8.3 - Hydraulic/Fire Services', description: 'Supply and install copper pipe 15mm', unit: 'm', rate: 35.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'HY002', trade: 'Hydraulics', category: '8.3 - Hydraulic/Fire Services', description: 'Supply and install copper pipe 20mm', unit: 'm', rate: 42.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'HY003', trade: 'Hydraulics', category: '8.3 - Hydraulic/Fire Services', description: 'Supply and install floor waste grate 100x100', unit: 'ea', rate: 125.00, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // FIRE SERVICES
  { code: 'FS001', trade: 'Fire Services', category: '8.3 - Hydraulic/Fire Services', description: 'Supply and install sprinkler head pendant', unit: 'ea', rate: 185.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'FS002', trade: 'Fire Services', category: '8.3 - Hydraulic/Fire Services', description: 'Supply and install smoke detector addressable', unit: 'ea', rate: 225.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'FS003', trade: 'Fire Services', category: '8.3 - Hydraulic/Fire Services', description: 'Supply and install fire hose reel', unit: 'ea', rate: 650.00, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // GENERAL BUILDERS
  { code: 'GB001', trade: 'General Builders', category: '6 - Internal Finishes', description: '90mm timber stud wall', unit: 'm2', rate: 65.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'GB002', trade: 'General Builders', category: '6 - Internal Finishes', description: '140mm timber stud wall with insulation', unit: 'm2', rate: 85.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'GB003', trade: 'General Builders', category: '6 - Internal Finishes', description: '13mm plasterboard wall lining', unit: 'm2', rate: 28.50, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'GB004', trade: 'General Builders', category: '6 - Internal Finishes', description: '6mm fibre cement board wet area lining', unit: 'm2', rate: 42.00, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // ROLLER SHUTTERS
  { code: 'RS001', trade: 'Roller Shutters', category: '4 - Facade/Metalwork', description: 'Supply and install electric roller shutter 3000x3000', unit: 'ea', rate: 3850.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'RS002', trade: 'Roller Shutters', category: '4 - Facade/Metalwork', description: 'Supply and install manual roller shutter 2400x2400', unit: 'ea', rate: 2250.00, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // METALWORK
  { code: 'MW001', trade: 'Metalwork', category: '4 - Facade/Metalwork', description: 'Steel corner protection 50x50x3mm angle', unit: 'm', rate: 35.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'MW002', trade: 'Metalwork', category: '4 - Facade/Metalwork', description: 'Stainless steel bollard selling area', unit: 'ea', rate: 285.00, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // GLAZED SCREENS
  { code: 'GS001', trade: 'Glazed Screens', category: '4 - Facade/Metalwork', description: 'Framed glazed partition 10mm toughened', unit: 'm2', rate: 485.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'GS002', trade: 'Glazed Screens', category: '4 - Facade/Metalwork', description: 'Frameless glass door with hardware', unit: 'ea', rate: 1250.00, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // CONSTRUCTION JOINERY
  { code: 'CJ001', trade: 'Construction Joinery', category: '5 - Joinery', description: 'Customer service desk joinery with fixtures', unit: 'ea', rate: 2850.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'CJ002', trade: 'Construction Joinery', category: '5 - Joinery', description: 'Checkout joinery with protection rails', unit: 'ea', rate: 1850.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'CJ003', trade: 'Construction Joinery', category: '5 - Joinery', description: '19mm plywood lining to stud wall less than 10m2', unit: 'm2', rate: 125.00, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // FLOOR COVERINGS
  { code: 'FC001', trade: 'Floor Coverings', category: '6.1 - Floor Finishes', description: 'Vinyl floor covering 2mm homogeneous', unit: 'm2', rate: 45.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'FC002', trade: 'Floor Coverings', category: '6.1 - Floor Finishes', description: 'Carpet tile 500x500 modular', unit: 'm2', rate: 55.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'FC003', trade: 'Floor Coverings', category: '6.1 - Floor Finishes', description: 'Epoxy floor coating 2 coats', unit: 'm2', rate: 35.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'FC004', trade: 'Floor Coverings', category: '6.1 - Floor Finishes', description: 'Floor preparation for moisture protection', unit: 'm2', rate: 18.50, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // DECORATIONS
  { code: 'DC001', trade: 'Decorations', category: '7 - Decorating', description: 'Paint finish to plasterboard walls up to 3600mm', unit: 'm2', rate: 22.50, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'DC002', trade: 'Decorations', category: '7 - Decorating', description: 'Paint to plywood and plasterboard stud walls', unit: 'm2', rate: 28.50, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'DC003', trade: 'Decorations', category: '7 - Decorating', description: 'Paint finish to existing columns 600x600', unit: 'm', rate: 18.50, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // SUSPENDED CEILINGS
  { code: 'SC001', trade: 'Suspended Ceilings', category: '6.2 - Ceiling Finishes', description: 'Suspended ceiling grid system 600x600', unit: 'm2', rate: 28.50, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'SC002', trade: 'Suspended Ceilings', category: '6.2 - Ceiling Finishes', description: 'Ceiling tile 600x600 mineral fibre', unit: 'm2', rate: 22.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'SC003', trade: 'Suspended Ceilings', category: '6.2 - Ceiling Finishes', description: 'Plasterboard bulkhead 1.0x1.0x10m', unit: 'ea', rate: 1250.00, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // SHOP FITTING
  { code: 'SF001', trade: 'Shop Fitting Install', category: '9 - Fittings', description: 'Install shop fittings - shelving units', unit: 'ea', rate: 185.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'SF002', trade: 'Shop Fitting Install', category: '9 - Fittings', description: 'Install shop fittings - display units', unit: 'ea', rate: 225.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'SF003', trade: 'Shop Fitting Install', category: '9 - Fittings', description: 'Trolley bay steel rail system posts and rails', unit: 'ea', rate: 850.00, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // LABOUR RATES
  { code: 'LR001', trade: 'Labour Rates', category: '0 - Preliminaries', description: 'Carpenter - skilled', unit: 'hr', rate: 52.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'LR002', trade: 'Labour Rates', category: '0 - Preliminaries', description: 'Electrician - licensed', unit: 'hr', rate: 68.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'LR003', trade: 'Labour Rates', category: '0 - Preliminaries', description: 'Plumber - licensed', unit: 'hr', rate: 72.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'LR004', trade: 'Labour Rates', category: '0 - Preliminaries', description: 'Labourer - general', unit: 'hr', rate: 38.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'LR005', trade: 'Labour Rates', category: '0 - Preliminaries', description: 'Painter - skilled', unit: 'hr', rate: 45.00, region: 'gladstone_qld', source: 'kmart_low_cost' },

  // CONSULTANT FEES
  { code: 'CF001', trade: 'Consultant Fees', category: '10 - Professional Fees', description: 'Structural engineer fees', unit: 'sum', rate: 8500.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'CF002', trade: 'Consultant Fees', category: '10 - Professional Fees', description: 'Hydraulic engineer fees', unit: 'sum', rate: 6500.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'CF003', trade: 'Consultant Fees', category: '10 - Professional Fees', description: 'Building certifier fees', unit: 'sum', rate: 4500.00, region: 'gladstone_qld', source: 'kmart_low_cost' },
  { code: 'CF004', trade: 'Consultant Fees', category: '10 - Professional Fees', description: 'Surveyor fees', unit: 'sum', rate: 3200.00, region: 'gladstone_qld', source: 'kmart_low_cost' }
];

// Add regional multipliers for other cities
const REGIONAL_MULTIPLIERS = {
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

// Generate expanded dataset with regional variations
function generateRegionalRates(baseRates) {
  const allRates = [...baseRates];
  
  for (const [region, multiplier] of Object.entries(REGIONAL_MULTIPLIERS)) {
    for (const rate of baseRates) {
      allRates.push({
        ...rate,
        region: region,
        rate: Math.round(rate.rate * multiplier * 100) / 100,
        source: `${rate.source}_regional`
      });
    }
  }
  
  return allRates;
}

// Main
function main() {
  console.log('🔨 Creating Kmart Tender Benchmark Dataset...\n');
  
  const expandedRates = generateRegionalRates(KMART_BENCHMARK_RATES);
  
  // Calculate summary stats
  const categoryTotals = {};
  const tradeTotals = {};
  
  for (const rate of KMART_BENCHMARK_RATES) {
    categoryTotals[rate.category] = (categoryTotals[rate.category] || 0) + 1;
    tradeTotals[rate.trade] = (tradeTotals[rate.trade] || 0) + 1;
  }
  
  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'Kmart Gladstone Tender (Samways Australia)',
      projectType: 'Retail Fitout',
      projectValues: {
        lowCostWorkstream: 450000,
        refitWorkstream: 2053226
      },
      baseRegion: 'gladstone_qld',
      totalBaseRates: KMART_BENCHMARK_RATES.length,
      totalRegionalRates: expandedRates.length
    },
    summary: {
      categories: categoryTotals,
      trades: tradeTotals
    },
    baseRates: KMART_BENCHMARK_RATES,
    regionalRates: expandedRates
  };
  
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'kmart_benchmark_rates.json'),
    JSON.stringify(output, null, 2)
  );
  
  console.log(`✅ Created ${KMART_BENCHMARK_RATES.length} base benchmark rates`);
  console.log(`✅ Expanded to ${expandedRates.length} rates with regional variations`);
  console.log(`📁 Saved to: ${path.join(OUTPUT_DIR, 'kmart_benchmark_rates.json')}`);
  
  console.log('\n📊 Categories:');
  Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`   ${cat}: ${count} rates`));
  
  console.log('\n📋 Sample Rates (Gladstone base):');
  KMART_BENCHMARK_RATES.slice(0, 6).forEach((r, i) => {
    console.log(`   ${i+1}. [${r.code}] ${r.description.substring(0, 45)}...`);
    console.log(`      $${r.rate.toFixed(2)}/${r.unit} | ${r.trade}`);
  });
  
  console.log('\n✨ Dataset ready for seeding!');
}

main();
