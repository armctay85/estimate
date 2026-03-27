// Quote Analysis Service - Calculates trust scores and identifies red flags

import { AUSTRALIAN_RATES, MATERIALS } from "@shared/schema";

export interface QuoteItem {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface AnalyzedItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  quoteRate: number;
  marketRate: number;
  variance: number;
  variancePercent: string;
  flag: 'ok' | 'warning' | 'critical';
  element?: string;
  category: string;
  notes?: string;
}

export interface QuoteAnalysis {
  trustScore: number;
  verdict: string;
  items: AnalyzedItem[];
  summaryFlags: string[];
  laborPercentage: number;
  materialPercentage: number;
  hasContingency: boolean;
  contingencyAmount: number;
  totalQuoteAmount: number;
  estimatedMarketTotal: number;
  potentialSavings: number;
}

// Element mapping for classification
const ELEMENT_CATEGORIES: Record<string, { code: string; category: string; marketRate: number; unit: string }> = {
  'concrete': { code: '1.2.1', category: 'Substructure', marketRate: 285, unit: 'm³' },
  'slab': { code: '1.2.1', category: 'Substructure', marketRate: 95, unit: 'm²' },
  'reinforcing': { code: '1.2.2', category: 'Substructure', marketRate: 15, unit: 'm²' },
  'steel mesh': { code: '1.2.2', category: 'Substructure', marketRate: 15, unit: 'm²' },
  'footing': { code: '1.1.1', category: 'Substructure', marketRate: 185, unit: 'm³' },
  'electrical': { code: '5.1.1', category: 'Services', marketRate: 145, unit: 'm²' },
  'plumbing': { code: '5.2.1', category: 'Plumbing', marketRate: 125, unit: 'm²' },
  'wall framing': { code: '2.1.1', category: 'Superstructure', marketRate: 115, unit: 'm²' },
  'ceiling framing': { code: '2.2.1', category: 'Superstructure', marketRate: 42, unit: 'm²' },
  'roof framing': { code: '2.3.1', category: 'Superstructure', marketRate: 95, unit: 'm²' },
  'joinery': { code: '3.1.1', category: 'Finishes', marketRate: 850, unit: 'm²' },
  'kitchen': { code: '3.1.2', category: 'Finishes', marketRate: 15000, unit: 'each' },
  'tiling': { code: '3.2.1', category: 'Finishes', marketRate: 155, unit: 'm²' },
  'painting': { code: '3.3.1', category: 'Finishes', marketRate: 32, unit: 'm²' },
  'flooring': { code: '3.4.1', category: 'Finishes', marketRate: 125, unit: 'm²' },
  'air conditioning': { code: '5.3.1', category: 'Services', marketRate: 165, unit: 'm²' },
  'hvac': { code: '5.3.1', category: 'Services', marketRate: 165, unit: 'm²' },
  'fire services': { code: '5.4.1', category: 'Services', marketRate: 65, unit: 'm²' },
  'security': { code: '5.5.1', category: 'Services', marketRate: 125, unit: 'm²' },
  'landscaping': { code: '6.1.1', category: 'External Works', marketRate: 85, unit: 'm²' },
  'paving': { code: '6.2.1', category: 'External Works', marketRate: 95, unit: 'm²' },
  'driveway': { code: '6.2.2', category: 'External Works', marketRate: 125, unit: 'm²' },
  'fence': { code: '6.3.1', category: 'External Works', marketRate: 185, unit: 'lm' },
  'gate': { code: '6.3.2', category: 'External Works', marketRate: 2500, unit: 'each' },
};

// Keyword matching for element identification
function identifyElement(description: string): { code: string; category: string; marketRate: number; unit: string } | null {
  const lowerDesc = description.toLowerCase();
  
  for (const [keyword, element] of Object.entries(ELEMENT_CATEGORIES)) {
    if (lowerDesc.includes(keyword)) {
      return element;
    }
  }
  
  return null;
}

// Calculate variance and flag
function analyzeItem(item: QuoteItem, element: { code: string; category: string; marketRate: number; unit: string } | null): AnalyzedItem {
  const marketRate = element?.marketRate || item.rate;
  const variance = ((item.rate - marketRate) / marketRate) * 100;
  
  let flag: 'ok' | 'warning' | 'critical' = 'ok';
  if (variance > 25) flag = 'critical';
  else if (variance > 10) flag = 'warning';
  
  // Check for vague descriptions
  let notes: string | undefined;
  const vagueTerms = ['works as required', 'as necessary', 'etc', 'miscellaneous', 'allowance'];
  if (vagueTerms.some(term => item.description.toLowerCase().includes(term))) {
    flag = 'warning';
    notes = 'Vague description - request detailed breakdown';
  }
  
  return {
    id: `item-${Math.random().toString(36).substr(2, 9)}`,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    quoteRate: item.rate,
    marketRate,
    variance,
    variancePercent: `${variance > 0 ? '+' : ''}${variance.toFixed(0)}%`,
    flag,
    element: element?.code,
    category: element?.category || 'Other',
    notes,
  };
}

// Calculate labor percentage estimate
function estimateLaborPercentage(items: AnalyzedItem[]): number {
  // Simplified labor estimation based on categories
  const laborHeavyCategories = ['Substructure', 'Superstructure', 'Services', 'Plumbing'];
  let laborEstimate = 0;
  let totalEstimate = 0;
  
  items.forEach(item => {
    const amount = item.quantity * item.quoteRate;
    const laborRatio = laborHeavyCategories.includes(item.category) ? 0.35 : 0.25;
    laborEstimate += amount * laborRatio;
    totalEstimate += amount;
  });
  
  return totalEstimate > 0 ? (laborEstimate / totalEstimate) * 100 : 30;
}

// Detect contingency line
function detectContingency(items: QuoteItem[]): { hasContingency: boolean; amount: number } {
  const contingencyKeywords = ['contingency', 'provisional sum', 'allowance', 'pc sum'];
  
  let contingencyAmount = 0;
  let hasContingency = false;
  
  items.forEach(item => {
    const lowerDesc = item.description.toLowerCase();
    if (contingencyKeywords.some(kw => lowerDesc.includes(kw))) {
      hasContingency = true;
      contingencyAmount += item.amount;
    }
  });
  
  return { hasContingency, amount: contingencyAmount };
}

// Generate summary flags
function generateSummaryFlags(analysis: QuoteAnalysis, items: AnalyzedItem[]): string[] {
  const flags: string[] = [];
  
  // Check for high variance items
  const highVarianceCount = items.filter(i => i.flag === 'critical').length;
  if (highVarianceCount > 0) {
    flags.push(`${highVarianceCount} item(s) significantly above market rates (>25%)`);
  }
  
  // Check labor percentage
  if (analysis.laborPercentage > 35) {
    flags.push(`Labor at ${analysis.laborPercentage.toFixed(1)}% - higher than typical (25-30%)`);
  }
  
  // Check contingency
  if (!analysis.hasContingency) {
    flags.push('No contingency line item - recommend adding 5-10%');
  } else {
    const contingencyPercent = (analysis.contingencyAmount / analysis.totalQuoteAmount) * 100;
    if (contingencyPercent < 5) {
      flags.push(`Contingency low at ${contingencyPercent.toFixed(1)}% - recommend 5-10%`);
    }
  }
  
  // Check for vague descriptions
  const vagueCount = items.filter(i => i.notes?.includes('Vague')).length;
  if (vagueCount > 0) {
    flags.push(`${vagueCount} item(s) with vague descriptions - request breakdowns`);
  }
  
  // Check overall variance
  const overallVariance = ((analysis.totalQuoteAmount - analysis.estimatedMarketTotal) / analysis.estimatedMarketTotal) * 100;
  if (overallVariance > 20) {
    flags.push(`Quote ${overallVariance.toFixed(0)}% above market estimate`);
  }
  
  return flags;
}

// Calculate trust score (0-100)
function calculateTrustScore(items: AnalyzedItem[], laborPercentage: number, hasContingency: boolean): number {
  let score = 100;
  
  // Deduct for critical items
  const criticalCount = items.filter(i => i.flag === 'critical').length;
  score -= criticalCount * 15;
  
  // Deduct for warning items
  const warningCount = items.filter(i => i.flag === 'warning').length;
  score -= warningCount * 5;
  
  // Deduct for high labor percentage
  if (laborPercentage > 35) {
    score -= 10;
  } else if (laborPercentage > 30) {
    score -= 5;
  }
  
  // Deduct for no contingency
  if (!hasContingency) {
    score -= 5;
  }
  
  // Ensure score is within bounds
  return Math.max(0, Math.min(100, score));
}

// Get verdict based on score
function getVerdict(score: number): string {
  if (score >= 90) return 'Fair Quote - Proceed with Confidence';
  if (score >= 70) return 'Minor Issues - Negotiate Specific Items';
  if (score >= 50) return 'Major Concerns - Get Second Quote';
  return 'Likely Inflated - Demand Breakdown or Walk';
}

// Main analysis function
export function analyzeQuote(items: QuoteItem[]): QuoteAnalysis {
  // Analyze each item
  const analyzedItems = items.map(item => {
    const element = identifyElement(item.description);
    return analyzeItem(item, element);
  });
  
  // Calculate totals
  const totalQuoteAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const estimatedMarketTotal = analyzedItems.reduce((sum, item) => 
    sum + (item.quantity * item.marketRate), 0
  );
  
  // Calculate percentages
  const laborPercentage = estimateLaborPercentage(analyzedItems);
  const materialPercentage = 100 - laborPercentage;
  
  // Detect contingency
  const { hasContingency, amount: contingencyAmount } = detectContingency(items);
  
  // Calculate trust score
  const trustScore = calculateTrustScore(analyzedItems, laborPercentage, hasContingency);
  
  // Generate verdict
  const verdict = getVerdict(trustScore);
  
  // Create initial analysis object
  const analysis: QuoteAnalysis = {
    trustScore,
    verdict,
    items: analyzedItems,
    summaryFlags: [], // Will be populated next
    laborPercentage,
    materialPercentage,
    hasContingency,
    contingencyAmount,
    totalQuoteAmount,
    estimatedMarketTotal,
    potentialSavings: Math.max(0, totalQuoteAmount - estimatedMarketTotal),
  };
  
  // Generate summary flags
  analysis.summaryFlags = generateSummaryFlags(analysis, analyzedItems);
  
  return analysis;
}

// Generate negotiation points
export interface NegotiationPoint {
  id: string;
  item: string;
  issue: string;
  suggestion: string;
  question: string;
  priority: 'high' | 'medium' | 'low';
  category: 'price' | 'scope' | 'terms' | 'timing';
}

export function generateNegotiationPoints(analysis: QuoteAnalysis): NegotiationPoint[] {
  const points: NegotiationPoint[] = [];
  
  // Add points for critical/warning items
  analysis.items
    .filter(item => item.flag === 'critical' || item.flag === 'warning')
    .forEach(item => {
      points.push({
        id: `price-${item.id}`,
        item: item.description,
        issue: `Rate of $${item.quoteRate}/${item.unit} is ${item.variancePercent} above market rate of $${item.marketRate}/${item.unit}`,
        suggestion: `Request breakdown of costs. Consider sourcing materials independently or requesting alternative specifications.`,
        question: `Can you provide a detailed breakdown for the ${item.description}? The rate of $${item.quoteRate}/${item.unit} seems higher than current market rates of around $${item.marketRate}/${item.unit}.`,
        priority: item.flag === 'critical' ? 'high' : 'medium',
        category: 'price',
      });
    });
  
  // Add point for labor if high
  if (analysis.laborPercentage > 35) {
    points.push({
      id: 'labor-overall',
      item: 'Labor Component',
      issue: `Labor at ${analysis.laborPercentage.toFixed(1)}% is above typical 25-30%`,
      suggestion: 'Request detailed labor schedule and hourly rates. Consider fixed-price labor component.',
      question: `I notice labor represents ${analysis.laborPercentage.toFixed(1)}% of the total, which is higher than the typical 25-30%. Can you provide a detailed labor schedule with hours and rates?`,
      priority: 'high',
      category: 'price',
    });
  }
  
  // Add point for contingency if missing
  if (!analysis.hasContingency) {
    points.push({
      id: 'contingency-missing',
      item: 'Contingency Allowance',
      issue: 'No contingency line item included',
      suggestion: 'Request 5-10% provisional sum for unforeseen works.',
      question: `I don't see a contingency allowance in the quote. Would you recommend adding a 5-10% provisional sum for unforeseen works?`,
      priority: 'medium',
      category: 'scope',
    });
  }
  
  // Add point for vague descriptions
  analysis.items
    .filter(item => item.notes?.includes('Vague'))
    .forEach(item => {
      points.push({
        id: `vague-${item.id}`,
        item: item.description,
        issue: 'Vague description without specific scope',
        suggestion: 'Request detailed scope of works with quantities and specifications.',
        question: `The description "${item.description}" is quite broad. Could you provide a detailed scope of works with specific quantities, materials, and finishes?`,
        priority: 'medium',
        category: 'scope',
      });
    });
  
  // Add point for payment terms
  points.push({
    id: 'payment-terms',
    item: 'Payment Schedule',
    issue: 'Payment terms not specified',
    suggestion: 'Request milestone-based payments. Avoid large upfront deposits.',
    question: `What payment schedule do you propose? I'd prefer milestone-based payments tied to completed stages rather than time-based progress payments.`,
    priority: 'medium',
    category: 'terms',
  });
  
  // Add point for timeline
  points.push({
    id: 'timeline',
    item: 'Project Timeline',
    issue: 'Completion date not specified',
    suggestion: 'Request firm completion date with liquidated damages clause.',
    question: `What is the proposed timeline for completion? Can we include a liquidated damages clause for delays beyond the agreed completion date?`,
    priority: 'low',
    category: 'timing',
  });
  
  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  points.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return points;
}

// Export for elemental breakdown
export interface ElementalItem {
  elementCode: string;
  elementName: string;
  category: string;
  quoteAmount: number;
  marketAmount: number;
  variance: number;
  variancePercent: string;
  flag: 'ok' | 'warning' | 'critical';
  percentOfTotal: number;
}

export function generateElementalBreakdown(analysis: QuoteAnalysis): ElementalItem[] {
  const categoryTotals: Record<string, { quote: number; market: number; items: AnalyzedItem[] }> = {};
  
  // Group by element code
  analysis.items.forEach(item => {
    const code = item.element || '9.9.9';
    if (!categoryTotals[code]) {
      categoryTotals[code] = { quote: 0, market: 0, items: [] };
    }
    categoryTotals[code].quote += item.quantity * item.quoteRate;
    categoryTotals[code].market += item.quantity * item.marketRate;
    categoryTotals[code].items.push(item);
  });
  
  // Convert to array
  return Object.entries(categoryTotals).map(([code, data]) => {
    const variance = ((data.quote - data.market) / data.market) * 100;
    let flag: 'ok' | 'warning' | 'critical' = 'ok';
    if (variance > 25) flag = 'critical';
    else if (variance > 10) flag = 'warning';
    
    const firstItem = data.items[0];
    
    return {
      elementCode: code,
      elementName: firstItem?.description || 'Other Works',
      category: firstItem?.category || 'Other',
      quoteAmount: data.quote,
      marketAmount: data.market,
      variance,
      variancePercent: `${variance > 0 ? '+' : ''}${variance.toFixed(0)}%`,
      flag,
      percentOfTotal: (data.quote / analysis.totalQuoteAmount) * 100,
    };
  }).sort((a, b) => b.quoteAmount - a.quoteAmount);
}
