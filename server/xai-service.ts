import OpenAI from "openai";

// Initialize X AI client using OpenAI SDK with X AI base URL
const xai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY 
});

// Cost prediction using X AI's Grok model
export async function predictConstructionCost(projectData: {
  type: string;
  area: number;
  location: string;
  complexity: string;
  timeline: string;
}) {
  try {
    const prompt = `As an expert Australian quantity surveyor, analyze this construction project and provide a detailed cost prediction:

Project Details:
- Type: ${projectData.type}
- Area: ${projectData.area} m²
- Location: ${projectData.location}, Australia
- Complexity: ${projectData.complexity}
- Timeline: ${projectData.timeline}

Provide a JSON response with:
1. predictedCost: Total estimated cost in AUD
2. minCost: Minimum likely cost (15% below predicted)
3. maxCost: Maximum likely cost (20% above predicted)
4. confidence: Your confidence level (Low/Medium/High)
5. breakdown: Cost breakdown by major categories
6. factors: Key factors affecting the cost
7. risks: Major cost risks to consider

Format: { "predictedCost": number, "minCost": number, "maxCost": number, "confidence": string, "breakdown": object, "factors": object, "risks": array }`;

    const response = await xai.chat.completions.create({
      model: "grok-beta", // Updated to confirmed real model
      messages: [
        {
          role: "system",
          content: "You are an expert Australian quantity surveyor with 20+ years experience. Provide cost estimates based on current Australian construction rates. Note: Estimates are AI-generated and should be verified by professional QS."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      success: true,
      data: {
        predictedCost: result.predictedCost || 0,
        minCost: result.minCost || 0,
        maxCost: result.maxCost || 0,
        confidence: result.confidence || "Medium",
        breakdown: result.breakdown || {},
        factors: result.factors || {},
        risks: result.risks || []
      }
    };
  } catch (error) {
    console.error("X AI prediction error:", error);
    return {
      success: false,
      error: "Failed to generate cost prediction"
    };
  }
}

// Analyze uploaded BIM/CAD file description
export async function analyzeBIMFile(fileInfo: {
  fileName: string;
  fileType: string;
  fileSize: number;
}) {
  try {
    const prompt = `Analyze this construction file and provide insights:

File: ${fileInfo.fileName}
Type: ${fileInfo.fileType}
Size: ${(fileInfo.fileSize / 1048576).toFixed(2)} MB

Based on the filename and type, provide:
1. Likely project type and scope
2. Expected element categories (structural, architectural, MEP, etc.)
3. Estimated complexity level
4. Typical cost range for similar projects in Australia
5. Key items to review in the model

Note: Estimates are AI-generated and accuracy varies - consult professional QS for validation.
Respond in JSON format.`;

    const response = await xai.chat.completions.create({
      model: "grok-beta", // Updated to confirmed real model
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 800
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("X AI BIM analysis error:", error);
    return null;
  }
}

// Generate professional QS report content
export async function generateQSReport(projectData: any) {
  try {
    const prompt = `Generate a professional quantity surveyor report summary for:

Project: ${projectData.name}
Type: ${projectData.type}
Total Cost: $${projectData.totalCost?.toLocaleString() || 0}
Area: ${projectData.area || 0} m²

Create an executive summary including:
1. Project overview
2. Cost breakdown analysis
3. Value engineering opportunities
4. Risk assessment
5. Recommendations

Note: This is an AI-generated report summary. Professional QS review recommended.
Keep it professional and concise.`;

    const response = await xai.chat.completions.create({
      model: "grok-beta", // Updated to confirmed real model
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 600
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("X AI report generation error:", error);
    return "Report generation unavailable";
  }
}

// Construction-specific chat assistance
export async function getConstructionAdvice(query: string, context?: any) {
  try {
    const response = await xai.chat.completions.create({
      model: "grok-beta", // Updated to confirmed real model
      messages: [
        {
          role: "system",
          content: "You are an AI assistant for EstiMate, a professional construction cost estimation platform. Provide helpful, accurate advice about Australian construction, quantity surveying, and cost estimation. Note: AI estimates should be professionally verified."
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("X AI advice error:", error);
    return "Unable to provide advice at this time.";
  }
}