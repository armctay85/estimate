import { Router } from "express";
import { eq, and, like, desc, asc, sql, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  elements,
  costRates,
  costSubmissions,
  regionalFactors,
  costIndexHistory,
  buildingTypes,
  qualityLevels,
  elementCategories,
  insertCostSubmissionSchema,
  type InsertCostSubmission,
  REGIONS,
  BUILDING_TYPES,
  QUALITY_LEVELS,
} from "@shared/schema";
import { requireAuth, requireQS } from "../auth";

const router = Router();

// ============================================
// ELEMENTS API
// ============================================

/**
 * GET /api/elements
 * Get all elements with optional filtering
 */
router.get("/elements", async (req, res) => {
  try {
    const { category, search, unit, includeInactive } = req.query;
    
    let query = db.query.elements.findMany({
      orderBy: [asc(elements.sortOrder), asc(elements.code)],
    });
    
    // Build conditions
    const conditions = [];
    
    if (category) {
      conditions.push(eq(elements.category, category as string));
    }
    
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        sql`(${elements.name} ILIKE ${searchTerm} OR ${elements.code} ILIKE ${searchTerm} OR ${elements.description} ILIKE ${searchTerm})`
      );
    }
    
    if (!includeInactive || includeInactive !== "true") {
      conditions.push(eq(elements.isActive, true));
    }
    
    if (conditions.length > 0) {
      // Apply all conditions
      const result = await db.select().from(elements)
        .where(and(...conditions))
        .orderBy(asc(elements.sortOrder), asc(elements.code));
      
      return res.json(result);
    }
    
    const result = await db.select().from(elements)
      .orderBy(asc(elements.sortOrder), asc(elements.code));
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching elements:", error);
    res.status(500).json({ error: "Failed to fetch elements" });
  }
});

/**
 * GET /api/elements/:id
 * Get single element by ID
 */
router.get("/elements/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const element = await db.query.elements.findFirst({
      where: eq(elements.id, id),
    });
    
    if (!element) {
      return res.status(404).json({ error: "Element not found" });
    }
    
    // Get cost rates for this element
    const rates = await db.select().from(costRates)
      .where(eq(costRates.elementId, id))
      .orderBy(desc(costRates.lastUpdated));
    
    res.json({ ...element, rates });
  } catch (error) {
    console.error("Error fetching element:", error);
    res.status(500).json({ error: "Failed to fetch element" });
  }
});

/**
 * GET /api/elements/categories
 * Get all element categories
 */
router.get("/elements/categories/list", async (req, res) => {
  try {
    const categories = await db.select().from(elementCategories)
      .orderBy(asc(elementCategories.sortOrder));
    
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ============================================
// COST ESTIMATION API
// ============================================

/**
 * POST /api/costs/estimate
 * Get cost estimate for an element
 */
router.post("/costs/estimate", async (req, res) => {
  try {
    const { elementId, region, buildingType, quality, quantity } = req.body;
    
    // Validate inputs
    if (!elementId || !region || !buildingType || !quality) {
      return res.status(400).json({
        error: "Missing required fields: elementId, region, buildingType, quality",
      });
    }
    
    const qty = quantity || 1;
    
    // Get the element
    const element = await db.query.elements.findFirst({
      where: eq(elements.id, elementId),
    });
    
    if (!element) {
      return res.status(404).json({ error: "Element not found" });
    }
    
    // Get the base cost rate for Sydney
    const baseRate = await db.query.costRates.findFirst({
      where: and(
        eq(costRates.elementId, elementId),
        eq(costRates.region, "Sydney"),
        eq(costRates.buildingType, buildingType),
        eq(costRates.quality, quality)
      ),
    });
    
    if (!baseRate) {
      // Try to find any rate for this element as fallback
      const anyRate = await db.query.costRates.findFirst({
        where: eq(costRates.elementId, elementId),
      });
      
      if (!anyRate) {
        return res.status(404).json({
          error: "No cost rate available for this element",
          element,
          confidence: "low",
        });
      }
      
      // Return estimated rate based on available data
      const estimatedRate = {
        low: parseFloat(anyRate.lowRate?.toString() || "0") * qty,
        median: parseFloat(anyRate.medianRate.toString()) * qty,
        high: parseFloat(anyRate.highRate?.toString() || "0") * qty,
        confidence: "low",
        note: "Rate estimated from different region/type/quality",
        sourceRate: anyRate,
      };
      
      return res.json(estimatedRate);
    }
    
    // Get regional factor
    let regionalFactor = 1.0;
    if (region !== "Sydney") {
      const factor = await db.query.regionalFactors.findFirst({
        where: eq(regionalFactors.region, region),
      });
      
      if (factor) {
        regionalFactor = parseFloat(factor.overallFactor.toString());
      }
    }
    
    // Calculate adjusted rates
    const low = parseFloat(baseRate.lowRate?.toString() || baseRate.medianRate.toString()) * regionalFactor * qty;
    const median = parseFloat(baseRate.medianRate.toString()) * regionalFactor * qty;
    const high = parseFloat(baseRate.highRate?.toString() || baseRate.medianRate.toString()) * regionalFactor * qty;
    
    // Determine confidence based on sample size and data quality
    let confidence: "high" | "medium" | "low" = "medium";
    if (baseRate.sampleSize >= 30 && baseRate.dataQuality === "high") {
      confidence = "high";
    } else if (baseRate.sampleSize < 10 || baseRate.dataQuality === "low") {
      confidence = "low";
    }
    
    // Adjust confidence for regional adjustments
    if (region !== "Sydney" && confidence === "high") {
      confidence = "medium";
    }
    
    res.json({
      element,
      low: Math.round(low * 100) / 100,
      median: Math.round(median * 100) / 100,
      high: Math.round(high * 100) / 100,
      unit: element.unit,
      quantity: qty,
      regionalFactor,
      confidence,
      source: baseRate.source,
      dataQuality: baseRate.dataQuality,
      sampleSize: baseRate.sampleSize,
      lastUpdated: baseRate.lastUpdated,
    });
  } catch (error) {
    console.error("Error calculating estimate:", error);
    res.status(500).json({ error: "Failed to calculate estimate" });
  }
});

/**
 * POST /api/costs/estimate-bulk
 * Get bulk cost estimates for multiple elements
 */
router.post("/costs/estimate-bulk", async (req, res) => {
  try {
    const { items, region, buildingType, quality } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array required" });
    }
    
    const results = [];
    let totalLow = 0;
    let totalMedian = 0;
    let totalHigh = 0;
    
    for (const item of items) {
      const elementId = item.elementId;
      const quantity = item.quantity || 1;
      
      // Get element and rate
      const element = await db.query.elements.findFirst({
        where: eq(elements.id, elementId),
      });
      
      if (!element) {
        results.push({
          elementId,
          error: "Element not found",
          confidence: "low",
        });
        continue;
      }
      
      const rate = await db.query.costRates.findFirst({
        where: and(
          eq(costRates.elementId, elementId),
          eq(costRates.region, "Sydney"),
          eq(costRates.buildingType, buildingType),
          eq(costRates.quality, quality)
        ),
      });
      
      if (!rate) {
        results.push({
          elementId,
          element,
          error: "No rate available",
          confidence: "low",
        });
        continue;
      }
      
      // Get regional factor
      let regionalFactor = 1.0;
      if (region !== "Sydney") {
        const factor = await db.query.regionalFactors.findFirst({
          where: eq(regionalFactors.region, region),
        });
        if (factor) {
          regionalFactor = parseFloat(factor.overallFactor.toString());
        }
      }
      
      const low = parseFloat(rate.lowRate?.toString() || rate.medianRate.toString()) * regionalFactor * quantity;
      const median = parseFloat(rate.medianRate.toString()) * regionalFactor * quantity;
      const high = parseFloat(rate.highRate?.toString() || rate.medianRate.toString()) * regionalFactor * quantity;
      
      let confidence: "high" | "medium" | "low" = "medium";
      if (rate.sampleSize >= 30 && rate.dataQuality === "high") {
        confidence = "high";
      } else if (rate.sampleSize < 10 || rate.dataQuality === "low") {
        confidence = "low";
      }
      
      if (region !== "Sydney" && confidence === "high") {
        confidence = "medium";
      }
      
      totalLow += low;
      totalMedian += median;
      totalHigh += high;
      
      results.push({
        elementId,
        element,
        quantity,
        low: Math.round(low * 100) / 100,
        median: Math.round(median * 100) / 100,
        high: Math.round(high * 100) / 100,
        confidence,
      });
    }
    
    res.json({
      items: results,
      summary: {
        totalLow: Math.round(totalLow * 100) / 100,
        totalMedian: Math.round(totalMedian * 100) / 100,
        totalHigh: Math.round(totalHigh * 100) / 100,
        region,
        buildingType,
        quality,
      },
    });
  } catch (error) {
    console.error("Error calculating bulk estimate:", error);
    res.status(500).json({ error: "Failed to calculate bulk estimate" });
  }
});

/**
 * GET /api/costs/regions
 * Get regional comparison for an element
 */
router.get("/costs/regions", async (req, res) => {
  try {
    const { elementId, buildingType, quality } = req.query;
    
    if (!elementId || !buildingType || !quality) {
      return res.status(400).json({
        error: "Missing required parameters: elementId, buildingType, quality",
      });
    }
    
    // Get the element
    const element = await db.query.elements.findFirst({
      where: eq(elements.id, parseInt(elementId as string)),
    });
    
    if (!element) {
      return res.status(404).json({ error: "Element not found" });
    }
    
    // Get all regional factors
    const factors = await db.select().from(regionalFactors)
      .orderBy(asc(regionalFactors.region));
    
    // Get base rate from Sydney
    const baseRate = await db.query.costRates.findFirst({
      where: and(
        eq(costRates.elementId, parseInt(elementId as string)),
        eq(costRates.region, "Sydney"),
        eq(costRates.buildingType, buildingType as string),
        eq(costRates.quality, quality as string)
      ),
    });
    
    if (!baseRate) {
      return res.status(404).json({ error: "No Sydney base rate available" });
    }
    
    const baseMedian = parseFloat(baseRate.medianRate.toString());
    
    // Calculate regional comparisons
    const comparisons = factors.map((factor) => {
      const factorValue = parseFloat(factor.overallFactor.toString());
      const adjustedRate = baseMedian * factorValue;
      
      return {
        region: factor.region,
        state: factor.state,
        factor: factorValue,
        adjustedRate: Math.round(adjustedRate * 100) / 100,
        marketCondition: factor.marketCondition,
        laborFactor: parseFloat(factor.laborFactor.toString()),
        materialFactor: parseFloat(factor.materialFactor.toString()),
      };
    });
    
    res.json({
      element,
      baseRate: baseMedian,
      baseRegion: "Sydney",
      comparisons,
    });
  } catch (error) {
    console.error("Error fetching regional comparison:", error);
    res.status(500).json({ error: "Failed to fetch regional comparison" });
  }
});

/**
 * GET /api/costs/search
 * Search for cost rates
 */
router.get("/costs/search", async (req, res) => {
  try {
    const { elementId, region, buildingType, quality, minSampleSize } = req.query;
    
    let query = db.select().from(costRates);
    const conditions = [];
    
    if (elementId) {
      conditions.push(eq(costRates.elementId, parseInt(elementId as string)));
    }
    
    if (region) {
      conditions.push(eq(costRates.region, region as string));
    }
    
    if (buildingType) {
      conditions.push(eq(costRates.buildingType, buildingType as string));
    }
    
    if (quality) {
      conditions.push(eq(costRates.quality, quality as string));
    }
    
    if (minSampleSize) {
      conditions.push(sql`${costRates.sampleSize} >= ${parseInt(minSampleSize as string)}`);
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query.orderBy(desc(costRates.lastUpdated));
    
    res.json(results);
  } catch (error) {
    console.error("Error searching cost rates:", error);
    res.status(500).json({ error: "Failed to search cost rates" });
  }
});

// ============================================
// COST SUBMISSIONS API (CROWDSOURCING)
// ============================================

/**
 * POST /api/costs/submit
 * Submit new cost data
 */
router.post("/costs/submit", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Validate submission
    const parsed = insertCostSubmissionSchema.safeParse({
      ...req.body,
      submittedBy: userId,
    });
    
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid submission data",
        details: parsed.error.errors,
      });
    }
    
    // Check if user is verified QS
    const isQS = req.user!.isVerifiedQS || false;
    
    const submission = await db.insert(costSubmissions).values({
      ...parsed.data,
      isQsSubmitted: isQS,
      status: isQS ? "verified" : "pending",
      verified: isQS,
      verifiedAt: isQS ? new Date() : null,
      verifiedBy: isQS ? userId : null,
    }).returning();
    
    res.status(201).json({
      message: isQS ? "Cost data submitted and verified" : "Cost data submitted for review",
      submission: submission[0],
    });
  } catch (error) {
    console.error("Error submitting cost data:", error);
    res.status(500).json({ error: "Failed to submit cost data" });
  }
});

/**
 * GET /api/costs/submissions
 * Get cost submissions (with filtering)
 */
router.get("/costs/submissions", async (req, res) => {
  try {
    const { status, elementId, region, verified, limit = "50" } = req.query;
    
    let query = db.select().from(costSubmissions);
    const conditions = [];
    
    if (status) {
      conditions.push(eq(costSubmissions.status, status as string));
    }
    
    if (elementId) {
      conditions.push(eq(costSubmissions.elementId, parseInt(elementId as string)));
    }
    
    if (region) {
      conditions.push(eq(costSubmissions.region, region as string));
    }
    
    if (verified === "true") {
      conditions.push(eq(costSubmissions.verified, true));
    } else if (verified === "false") {
      conditions.push(eq(costSubmissions.verified, false));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query
      .orderBy(desc(costSubmissions.submittedAt))
      .limit(parseInt(limit as string));
    
    res.json(results);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

/**
 * POST /api/costs/submissions/:id/verify
 * Verify a cost submission (QS only)
 */
router.post("/costs/submissions/:id/verify", requireQS, async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    const userId = req.user!.id;
    const { notes, reject } = req.body;
    
    const submission = await db.query.costSubmissions.findFirst({
      where: eq(costSubmissions.id, submissionId),
    });
    
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }
    
    const updateData = {
      verified: !reject,
      status: reject ? "rejected" : "verified",
      verifiedBy: userId,
      verifiedAt: new Date(),
      verificationNotes: notes || null,
    };
    
    const updated = await db.update(costSubmissions)
      .set(updateData)
      .where(eq(costSubmissions.id, submissionId))
      .returning();
    
    // If verified, potentially update the cost rate
    if (!reject) {
      // Logic to update cost rate based on verified submission
      // This could trigger a recalculation of the median rate
    }
    
    res.json({
      message: reject ? "Submission rejected" : "Submission verified",
      submission: updated[0],
    });
  } catch (error) {
    console.error("Error verifying submission:", error);
    res.status(500).json({ error: "Failed to verify submission" });
  }
});

// ============================================
// REGIONAL FACTORS API
// ============================================

/**
 * GET /api/regions
 * Get all regional factors
 */
router.get("/regions", async (req, res) => {
  try {
    const { state } = req.query;
    
    let query = db.select().from(regionalFactors)
      .orderBy(asc(regionalFactors.region));
    
    if (state) {
      query = query.where(eq(regionalFactors.state, state as string));
    }
    
    const results = await query;
    res.json(results);
  } catch (error) {
    console.error("Error fetching regions:", error);
    res.status(500).json({ error: "Failed to fetch regions" });
  }
});

/**
 * GET /api/regions/:region
 * Get specific regional factor
 */
router.get("/regions/:region", async (req, res) => {
  try {
    const region = req.params.region;
    
    const factor = await db.query.regionalFactors.findFirst({
      where: eq(regionalFactors.region, region),
    });
    
    if (!factor) {
      return res.status(404).json({ error: "Region not found" });
    }
    
    res.json(factor);
  } catch (error) {
    console.error("Error fetching region:", error);
    res.status(500).json({ error: "Failed to fetch region" });
  }
});

// ============================================
// BUILDING TYPES & QUALITY LEVELS API
// ============================================

/**
 * GET /api/building-types
 * Get all building types
 */
router.get("/building-types", async (req, res) => {
  try {
    const results = await db.select().from(buildingTypes)
      .orderBy(asc(buildingTypes.sortOrder));
    
    res.json(results);
  } catch (error) {
    console.error("Error fetching building types:", error);
    res.status(500).json({ error: "Failed to fetch building types" });
  }
});

/**
 * GET /api/quality-levels
 * Get all quality levels
 */
router.get("/quality-levels", async (req, res) => {
  try {
    const results = await db.select().from(qualityLevels)
      .orderBy(asc(qualityLevels.sortOrder));
    
    res.json(results);
  } catch (error) {
    console.error("Error fetching quality levels:", error);
    res.status(500).json({ error: "Failed to fetch quality levels" });
  }
});

// ============================================
// COST INDEX API
// ============================================

/**
 * GET /api/cost-index
 * Get cost index history
 */
router.get("/cost-index", async (req, res) => {
  try {
    const { region, buildingType, limit = "24" } = req.query;
    
    let query = db.select().from(costIndexHistory);
    const conditions = [];
    
    if (region) {
      conditions.push(eq(costIndexHistory.region, region as string));
    }
    
    if (buildingType) {
      conditions.push(eq(costIndexHistory.buildingType, buildingType as string));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query
      .orderBy(desc(costIndexHistory.indexDate))
      .limit(parseInt(limit as string));
    
    res.json(results);
  } catch (error) {
    console.error("Error fetching cost index:", error);
    res.status(500).json({ error: "Failed to fetch cost index" });
  }
});

// ============================================
// REFERENCE DATA API
// ============================================

/**
 * GET /api/costs/reference
 * Get all reference data (regions, types, qualities)
 */
router.get("/costs/reference", async (req, res) => {
  try {
    const [regions, types, qualities, categories] = await Promise.all([
      db.select().from(regionalFactors).orderBy(asc(regionalFactors.region)),
      db.select().from(buildingTypes).orderBy(asc(buildingTypes.sortOrder)),
      db.select().from(qualityLevels).orderBy(asc(qualityLevels.sortOrder)),
      db.select().from(elementCategories).orderBy(asc(elementCategories.sortOrder)),
    ]);
    
    res.json({
      regions,
      buildingTypes: types,
      qualityLevels: qualities,
      elementCategories: categories,
    });
  } catch (error) {
    console.error("Error fetching reference data:", error);
    res.status(500).json({ error: "Failed to fetch reference data" });
  }
});

export default router;
