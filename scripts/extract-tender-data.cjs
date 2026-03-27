#!/usr/bin/env node
/**
 * Excel XML Parser - Kmart Tender Data Extraction
 * Uses regex to parse Excel XML structure
 */

const fs = require('fs');
const path = require('path');

const TENDER_DIR = '/tmp/tender_data';
const OUTPUT_DIR = '/root/.openclaw/workspace/estimate/seed_data';

const LOW_COST_SHEETS = {
  'sheet6.xml': 'Tender Summary',
  'sheet7.xml': 'OH&P',
  'sheet8.xml': 'Turnover Discount',
  'sheet9.xml': 'Site Facilities',
  'sheet10.xml': 'Labour Rates',
  'sheet11.xml': 'Hoardings',
  'sheet12.xml': 'Cleaning',
  'sheet13.xml': 'Electrical Site Facilities',
  'sheet14.xml': 'Electrical Demolition',
  'sheet15.xml': 'Electrical Lighting Install',
  'sheet16.xml': 'Electrical Sales Floor',
  'sheet17.xml': 'Electrical Consumables',
  'sheet18.xml': 'Mechanical',
  'sheet19.xml': 'Hydraulics',
  'sheet20.xml': 'Fire Services',
  'sheet21.xml': 'General Builders',
  'sheet22.xml': 'Roller Shutters',
  'sheet23.xml': 'Metalwork',
  'sheet24.xml': 'Glazed Screens',
  'sheet25.xml': 'Construction Joinery',
  'sheet26.xml': 'Floor Coverings',
  'sheet27.xml': 'Decorations',
  'sheet28.xml': 'Suspended Ceilings',
  'sheet29.xml': 'Shop Fitting Install',
  'sheet30.xml': 'Consultant Fees'
};

// Parse shared strings
function parseSharedStrings(xlDir) {
  const xmlPath = path.join(xlDir, 'sharedStrings.xml');
  if (!fs.existsSync(xmlPath)) return [];
  
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const strings = [];
  
  // Extract text between <t> tags (handles multi-line)
  const regex = /<t(?:\s+xml:space="preserve")?\s*\u003e([\s\S]*?)\u003c\/t\u003e/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    strings.push(match[1]
      .replace(/\s+/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()
    );
  }
  
  return strings;
}

// Parse a single worksheet
function parseWorksheet(sheetPath, sharedStrings) {
  if (!fs.existsSync(sheetPath)) return null;
  
  const xml = fs.readFileSync(sheetPath, 'utf8');
  const rows = [];
  
  // Find sheetData section
  const sheetDataMatch = xml.match(/<sheetData\u003e([\s\S]*?)<\/sheetData\u003e/);
  if (!sheetDataMatch) return rows;
  
  const sheetData = sheetDataMatch[1];
  
  // Extract rows
  const rowRegex = /<row\s+r="(\d+)"[^\u003e]*\u003e([\s\S]*?)\u003c\/row\u003e/g;
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(sheetData)) !== null) {
    const rowNum = parseInt(rowMatch[1], 10);
    const rowContent = rowMatch[2];
    const cells = {};
    
    // Extract cells
    const cellRegex = /<c\s+r="([A-Z]+)\d+"[^\u003e]*?(?:t="(s)")?[^\u003e]*?\u003e(?:\u003cf\u003e[^\u003c]*\u003c\/f\u003e)?(?:\u003cv\u003e([\s\S]*?)\u003c\/v\u003e)?\u003c\/c\u003e/g;
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const col = cellMatch[1];
      const isString = cellMatch[2] === 's';
      const value = cellMatch[3]?.trim();
      
      if (value !== undefined) {
        if (isString) {
          const strIndex = parseInt(value, 10);
          cells[col] = sharedStrings[strIndex] || '';
        } else {
          cells[col] = value;
        }
      }
    }
    
    if (Object.keys(cells).length > 0) {
      rows.push({ rowNum, cells });
    }
  }
  
  return rows;
}

// Extract line items from sheet rows
function extractLineItems(sheetName, rows) {
  const items = [];
  
  for (const row of rows) {
    const cells = row.cells;
    
    // Look for item code pattern in column A
    const colA = cells['A'] || '';
    const codeMatch = colA.match(/^[A-Z]{2,4}\d{3,5}$/);
    
    if (codeMatch) {
      const description = cells['B'] || '';
      if (!description || description.length < 5) continue;
      
      // Try different column patterns for quantity/unit/rate
      let qty = 0, unit = 'ea', rate = 0, total = 0;
      
      // Pattern 1: C=qty, D=unit, E=rate, F=total
      if (cells['C'] && !isNaN(parseFloat(cells['C']))) {
        qty = parseFloat(cells['C']);
        unit = cells['D'] || 'ea';
        rate = parseFloat(cells['E']) || 0;
        total = parseFloat(cells['F']) || (qty * rate);
      }
      // Pattern 2: D=qty, E=unit, F=rate, G=total
      else if (cells['D'] && !isNaN(parseFloat(cells['D']))) {
        qty = parseFloat(cells['D']);
        unit = cells['E'] || 'ea';
        rate = parseFloat(cells['F']) || 0;
        total = parseFloat(cells['G']) || (qty * rate);
      }
      // Pattern 3: C=qty, D=rate, E=total (no unit)
      else if (cells['C'] && cells['D']) {
        qty = parseFloat(cells['C']) || 1;
        rate = parseFloat(cells['D']) || 0;
        total = parseFloat(cells['E']) || (qty * rate);
      }
      
      // Normalize unit
      const validUnits = ['m', 'm2', 'm3', 'ea', 'nr', 'item', 'sum', 'no', 'no.', 'hr', '%', 'week', 'each', 'lm', 'l/s', 'l.m'];
      unit = validUnits.find(u => unit.toLowerCase().startsWith(u)) || 'ea';
      
      items.push({
        code: colA,
        trade: sheetName,
        description: description.substring(0, 300),
        quantity: qty || 1,
        unit: unit,
        rate: Math.abs(rate),
        total: Math.abs(total),
        row: row.rowNum
      });
    }
  }
  
  return items;
}

// Categorize to elemental
function getCategory(trade) {
  const t = trade.toLowerCase();
  if (t.includes('consultant') || t.includes('fee')) return '10 - Professional Fees';
  if (t.includes('site') || t.includes('hoarding') || t.includes('prelim')) return '0 - Preliminaries';
  if (t.includes('cleaning') || t.includes('demo')) return '1 - Demolition';
  if (t.includes('electrical')) return '8.1 - Electrical Services';
  if (t.includes('mechanical')) return '8.2 - Mechanical Services';
  if (t.includes('hydraulic') || t.includes('fire')) return '8.3 - Hydraulic/Fire Services';
  if (t.includes('builder') || t.includes('general')) return '6 - Internal Finishes';
  if (t.includes('joinery')) return '5 - Joinery';
  if (t.includes('floor')) return '6.1 - Floor Finishes';
  if (t.includes('ceiling') || t.includes('suspended')) return '6.2 - Ceiling Finishes';
  if (t.includes('decoration') || t.includes('paint')) return '7 - Decorating';
  if (t.includes('glazed') || t.includes('roller') || t.includes('metalwork')) return '4 - Facade/Metalwork';
  if (t.includes('shop') || t.includes('fitting')) return '9 - Fittings';
  return '0 - Preliminaries';
}

// Main extraction
function extractAll() {
  console.log('🔍 Extracting Kmart Tender Data...\n');
  
  const allItems = [];
  const tradeSummary = {};
  
  // Process Low Cost
  console.log('📄 Processing Low Cost Workstream...');
  const lowCostXl = path.join(TENDER_DIR, 'low_cost', 'xl');
  const lowCostStrings = parseSharedStrings(lowCostXl);
  console.log(`   Found ${lowCostStrings.length} shared strings`);
  
  for (const [sheetFile, sheetName] of Object.entries(LOW_COST_SHEETS)) {
    const sheetPath = path.join(lowCostXl, 'worksheets', sheetFile);
    const rows = parseWorksheet(sheetPath, lowCostStrings);
    
    if (rows?.length > 0) {
      const items = extractLineItems(sheetName, rows);
      if (items.length > 0) {
        console.log(`   ✅ ${sheetName}: ${items.length} items`);
        items.forEach(i => {
          i.source = 'kmart_low_cost';
          i.category = getCategory(sheetName);
          i.projectType = 'retail_fitout';
          i.region = 'gladstone_qld';
          i.projectValue = 450000;
        });
        allItems.push(...items);
        tradeSummary[sheetName] = items.length;
      }
    }
  }
  
  // Process Refit
  console.log('\n📄 Processing Refit Workstream...');
  const refitXl = path.join(TENDER_DIR, 'refit', 'xl');
  const refitStrings = parseSharedStrings(refitXl);
  console.log(`   Found ${refitStrings.length} shared strings`);
  
  for (const [sheetFile, sheetName] of Object.entries(LOW_COST_SHEETS)) {
    const sheetPath = path.join(refitXl, 'worksheets', sheetFile);
    const rows = parseWorksheet(sheetPath, refitStrings);
    
    if (rows?.length > 0) {
      const items = extractLineItems(sheetName, rows);
      if (items.length > 0) {
        console.log(`   ✅ ${sheetName} (Refit): ${items.length} items`);
        items.forEach(i => {
          i.source = 'kmart_refit';
          i.category = getCategory(sheetName);
          i.projectType = 'retail_fitout';
          i.region = 'gladstone_qld';
          i.projectValue = 2053226;
        });
        allItems.push(...items);
        tradeSummary[sheetName + ' (Refit)'] = items.length;
      }
    }
  }
  
  // Calculate category totals
  const catTotals = {};
  allItems.forEach(i => {
    catTotals[i.category] = catTotals[i.category] || { count: 0, total: 0 };
    catTotals[i.category].count++;
    catTotals[i.category].total += i.total;
  });
  
  // Save
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const output = {
    extractedAt: new Date().toISOString(),
    summary: {
      totalLineItems: allItems.length,
      totalValue: allItems.reduce((s, i) => s + i.total, 0),
      uniqueTrades: Object.keys(tradeSummary).length,
      categories: catTotals
    },
    tradeSummary,
    items: allItems
  };
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'kmart_tender_extracted.json'), JSON.stringify(output, null, 2));
  
  console.log(`\n✅ Extracted ${allItems.length} line items`);
  console.log(`💰 Total value: $${output.summary.totalValue.toLocaleString()}`);
  
  console.log('\n📊 By Category:');
  Object.entries(catTotals)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([cat, d]) => console.log(`   ${cat}: ${d.count} items, $${d.total.toLocaleString()}`));
  
  console.log('\n📋 Sample Items:');
  allItems.slice(0, 5).forEach((it, i) => {
    console.log(`   ${i+1}. [${it.code}] ${it.description.substring(0, 55)}...`);
    console.log(`      $${it.rate.toFixed(2)}/${it.unit} × ${it.quantity} = $${it.total.toFixed(2)}`);
  });
}

extractAll();
console.log('\n✨ Done!');
