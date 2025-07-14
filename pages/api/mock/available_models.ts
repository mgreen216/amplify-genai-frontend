import { NextApiRequest, NextApiResponse } from "next";

// Mock available models endpoint for development
const mockAvailableModels = async (req: NextApiRequest, res: NextApiResponse) => {
  // Return mock model data
  const mockResponse = {
    success: true,
    data: {
      models: [
        {
          id: "gpt-3.5-turbo",
          name: "GPT-3.5 Turbo",
          provider: "OpenAI",
          inputContextWindow: 4096,
          outputTokenLimit: 4096,
          outputTokenCost: 0.002,
          inputTokenCost: 0.001,
          cachedTokenCost: 0.0005,
          description: "Fast, efficient model for most tasks",
          supportsImages: false,
          supportsReasoning: true,
          supportsSystemPrompts: true,
          isAvailable: true,
          isBuiltIn: true
        },
        {
          id: "gpt-4",
          name: "GPT-4",
          provider: "OpenAI",
          inputContextWindow: 8192,
          outputTokenLimit: 4096,
          outputTokenCost: 0.06,
          inputTokenCost: 0.03,
          cachedTokenCost: 0.015,
          description: "Advanced model with better reasoning",
          supportsImages: true,
          supportsReasoning: true,
          supportsSystemPrompts: true,
          isAvailable: true,
          isBuiltIn: true
        },
        {
          id: "text-embedding-ada-002",
          name: "Text Embedding Ada",
          provider: "OpenAI",
          inputContextWindow: 8191,
          outputTokenLimit: 0,
          outputTokenCost: 0,
          inputTokenCost: 0.0001,
          cachedTokenCost: 0,
          description: "Embedding model for semantic search",
          supportsImages: false,
          supportsReasoning: false,
          supportsSystemPrompts: false,
          isAvailable: true,
          isBuiltIn: true
        }
      ],
      default: {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        provider: "OpenAI",
        inputContextWindow: 4096,
        outputTokenLimit: 4096,
        outputTokenCost: 0.002,
        inputTokenCost: 0.001,
        cachedTokenCost: 0.0005,
        description: "Fast, efficient model for most tasks",
        supportsImages: false,
        supportsReasoning: true,
        supportsSystemPrompts: true,
        isAvailable: true,
        isBuiltIn: true
      },
      cheapest: {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        provider: "OpenAI",
        inputContextWindow: 4096,
        outputTokenLimit: 4096,
        outputTokenCost: 0.002,
        inputTokenCost: 0.001,
        cachedTokenCost: 0.0005,
        description: "Fast, efficient model for most tasks",
        supportsImages: false,
        supportsReasoning: true,
        supportsSystemPrompts: true,
        isAvailable: true,
        isBuiltIn: true
      },
      advanced: {
        id: "gpt-4",
        name: "GPT-4", 
        provider: "OpenAI",
        inputContextWindow: 8192,
        outputTokenLimit: 4096,
        outputTokenCost: 0.06,
        inputTokenCost: 0.03,
        cachedTokenCost: 0.015,
        description: "Advanced model with better reasoning",
        supportsImages: true,
        supportsReasoning: true,
        supportsSystemPrompts: true,
        isAvailable: true,
        isBuiltIn: true
      }
    }
  };

  res.status(200).json(mockResponse);
};

export default mockAvailableModels;