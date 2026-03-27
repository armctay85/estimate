import { Express, Request, Response } from "express";
import { analyzeQuote, generateNegotiationPoints, generateElementalBreakdown } from "../client/src/lib/quote-analysis";
import { QuoteItem } from "../client/src/lib/quote-analysis";

// In-memory storage for quotes (in production, use database)
const quoteStore = new Map<number, any>();
let quoteIdCounter = 1;

export function setupQuoteRoutes(app: Express) {
  // Analyze a quote
  app.post("/api/quotes/analyze", async (req: Request, res: Response) => {
    try {
      const { projectId, items, builderName, date } = req.body;

      if (!projectId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Project ID and at least one item are required"
        });
      }

      // Validate items
      const validItems: QuoteItem[] = items
        .filter((item: any) => item.description && item.quantity && item.rate)
        .map((item: any) => ({
          description: item.description,
          quantity: Number(item.quantity) || 0,
          unit: item.unit || 'each',
          rate: Number(item.rate) || 0,
          amount: (Number(item.quantity) || 0) * (Number(item.rate) || 0)
        }));

      if (validItems.length === 0) {
        return res.status(400).json({
          error: "Invalid request",
          message: "No valid items found"
        });
      }

      // Perform analysis
      const analysis = analyzeQuote(validItems);
      
      // Generate additional data
      const negotiationPoints = generateNegotiationPoints(analysis);
      const elementalBreakdown = generateElementalBreakdown(analysis);

      // Store quote for later retrieval
      const quoteId = quoteIdCounter++;
      const quoteData = {
        id: quoteId,
        projectId,
        builderName: builderName || 'Unknown Builder',
        date: date || new Date().toISOString().split('T')[0],
        items: validItems,
        analysis,
        negotiationPoints,
        elementalBreakdown,
        createdAt: new Date().toISOString()
      };
      quoteStore.set(quoteId, quoteData);

      res.json({
        quoteId,
        ...analysis,
        negotiationPoints,
        elementalBreakdown
      });
    } catch (error) {
      console.error("Error analyzing quote:", error);
      res.status(500).json({
        error: "Analysis failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get quote by ID
  app.get("/api/quotes/:id", async (req: Request, res: Response) => {
    try {
      const quoteId = parseInt(req.params.id);
      
      if (isNaN(quoteId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Quote ID must be a number"
        });
      }

      const quote = quoteStore.get(quoteId);
      
      if (!quote) {
        return res.status(404).json({
          error: "Not found",
          message: "Quote not found"
        });
      }

      res.json(quote);
    } catch (error) {
      console.error("Error retrieving quote:", error);
      res.status(500).json({
        error: "Retrieval failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get negotiation tips for a quote
  app.get("/api/quotes/:id/negotiation-tips", async (req: Request, res: Response) => {
    try {
      const quoteId = parseInt(req.params.id);
      
      if (isNaN(quoteId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Quote ID must be a number"
        });
      }

      const quote = quoteStore.get(quoteId);
      
      if (!quote) {
        return res.status(404).json({
          error: "Not found",
          message: "Quote not found"
        });
      }

      res.json({
        quoteId,
        trustScore: quote.analysis.trustScore,
        points: quote.negotiationPoints,
        builderName: quote.builderName,
        quoteTotal: quote.analysis.totalQuoteAmount,
        marketTotal: quote.analysis.estimatedMarketTotal
      });
    } catch (error) {
      console.error("Error retrieving negotiation tips:", error);
      res.status(500).json({
        error: "Retrieval failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get quotes by project ID
  app.get("/api/projects/:projectId/quotes", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (isNaN(projectId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Project ID must be a number"
        });
      }

      const projectQuotes = Array.from(quoteStore.values())
        .filter(q => q.projectId === projectId)
        .map(q => ({
          id: q.id,
          builderName: q.builderName,
          date: q.date,
          totalAmount: q.analysis.totalQuoteAmount,
          trustScore: q.analysis.trustScore,
          verdict: q.analysis.verdict,
          createdAt: q.createdAt
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(projectQuotes);
    } catch (error) {
      console.error("Error retrieving project quotes:", error);
      res.status(500).json({
        error: "Retrieval failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Delete a quote
  app.delete("/api/quotes/:id", async (req: Request, res: Response) => {
    try {
      const quoteId = parseInt(req.params.id);
      
      if (isNaN(quoteId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Quote ID must be a number"
        });
      }

      if (!quoteStore.has(quoteId)) {
        return res.status(404).json({
          error: "Not found",
          message: "Quote not found"
        });
      }

      quoteStore.delete(quoteId);
      res.json({ success: true, message: "Quote deleted" });
    } catch (error) {
      console.error("Error deleting quote:", error);
      res.status(500).json({
        error: "Deletion failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}
