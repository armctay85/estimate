import OpenAI from "openai";

// Multi-AI service manager to leverage both X AI and OpenAI when available
export class MultiAIService {
  private xai: OpenAI | null = null;
  private openai: OpenAI | null = null;

  constructor() {
    // Initialize X AI (primary)
    if (process.env.XAI_API_KEY) {
      this.xai = new OpenAI({
        apiKey: process.env.XAI_API_KEY,
        baseURL: "https://api.x.ai/v1"
      });
      console.log('X AI (Grok) service initialized');
    }

    // Initialize OpenAI (secondary for image analysis)
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('OpenAI service initialized');
    }
  }

  // Get the best AI service for text analysis (prefer X AI)
  getTextAI(): OpenAI | null {
    return this.xai || this.openai;
  }

  // Get the best AI service for image analysis (prefer OpenAI for vision)
  getVisionAI(): OpenAI | null {
    return this.openai || this.xai;
  }

  // Analyze renovation photos with detailed insights
  async analyzeRenovationPhoto(base64Image: string, roomType: 'kitchen' | 'bathroom'): Promise<any> {
    const visionAI = this.getVisionAI();
    if (!visionAI) {
      throw new Error('No vision AI service available');
    }

    try {
      const response = await visionAI.chat.completions.create({
        model: this.openai ? "gpt-4o" : "grok-2-vision-1212",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this ${roomType} photo for renovation opportunities. Identify:
                1. Current fixtures and their condition
                2. Layout optimization potential
                3. Style and design elements
                4. Renovation zones (cabinets, countertops, flooring, etc.)
                5. Estimated costs for Australian market
                
                Respond in JSON format with detailed analysis.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error('Photo analysis error:', error);
      return null;
    }
  }

  // Generate renovation recommendations using best text AI
  async generateRenovationPlan(photoAnalysis: any, budget: number, style: string): Promise<any> {
    const textAI = this.getTextAI();
    if (!textAI) {
      throw new Error('No text AI service available');
    }

    try {
      const response = await textAI.chat.completions.create({
        model: this.xai ? "grok-2-1212" : "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert Australian renovation consultant. Provide detailed renovation plans with accurate Australian pricing."
          },
          {
            role: "user",
            content: `Based on this photo analysis: ${JSON.stringify(photoAnalysis)}
            
            Create a detailed renovation plan with:
            - Budget: $${budget}
            - Style: ${style}
            - Specific recommendations for each renovation zone
            - Timeline estimates
            - Australian supplier recommendations
            - Cost breakdown
            
            Format as JSON with detailed sections.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1200
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error('Renovation plan generation error:', error);
      return null;
    }
  }

  // Enhanced BIM analysis with multi-AI approach
  async analyzeBIMWithMultiAI(fileInfo: any): Promise<any> {
    const textAI = this.getTextAI();
    if (!textAI) return null;

    try {
      const response = await textAI.chat.completions.create({
        model: this.xai ? "grok-2-1212" : "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert Australian quantity surveyor and BIM specialist. Analyze construction files with precision."
          },
          {
            role: "user",
            content: `Analyze this BIM/CAD file for quantity takeoff:
            
            File: ${fileInfo.fileName}
            Type: ${fileInfo.fileType}
            Size: ${(fileInfo.fileSize / 1048576).toFixed(2)} MB
            
            Provide detailed analysis including:
            1. Project type and complexity assessment
            2. Expected construction elements by category
            3. Quantity estimation methodology
            4. Australian construction cost ranges
            5. Timeline and resource requirements
            6. Risk factors and considerations
            
            Format as JSON with comprehensive details.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error('BIM analysis error:', error);
      return null;
    }
  }

  // Get service status for UI display
  getServiceStatus(): { xai: boolean; openai: boolean; forge: boolean } {
    return {
      xai: !!this.xai,
      openai: !!this.openai,
      forge: !!(process.env.FORGE_CLIENT_ID && process.env.FORGE_CLIENT_SECRET)
    };
  }
}

// Export singleton instance
export const multiAI = new MultiAIService();