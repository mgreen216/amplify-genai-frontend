import { NextApiRequest, NextApiResponse } from "next";

// Mock state endpoint
const mockState = async (req: NextApiRequest, res: NextApiResponse) => {
  const { op } = req.query;
  
  if (req.method === 'GET' && op === 'get') {
    // Return mock application state
    const mockResponse = {
      success: true,
      data: {
        conversations: [],
        folders: [],
        prompts: [
          {
            id: "prompt-1",
            name: "Summarize",
            description: "Summarize the following text",
            content: "Please provide a concise summary of the following text:\n\n{{text}}",
            folderId: null,
            tags: ["utility"],
            createdAt: "2024-01-01T00:00:00Z"
          },
          {
            id: "prompt-2",
            name: "Explain Code",
            description: "Explain the following code",
            content: "Please explain the following code in simple terms:\n\n{{code}}",
            folderId: null,
            tags: ["programming"],
            createdAt: "2024-01-01T00:00:00Z"
          }
        ],
        systemPrompts: [],
        selectedConversation: null,
        apiKey: null,
        pluginKeys: [],
        serverSideApiKeyIsSet: false,
        serverSidePluginKeysSet: false,
        models: {
          "gpt-3.5-turbo": {
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
            supportsReasoning: true
          },
          "gpt-4": {
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
            supportsReasoning: true
          }
        }
      }
    };
    
    res.status(200).json(mockResponse);
  } else if (req.method === 'POST' && op === 'save') {
    // Handle state save
    const mockResponse = {
      success: true,
      message: "State saved successfully"
    };
    
    res.status(200).json(mockResponse);
  } else if (req.method === 'POST' && op === 'reset') {
    // Handle state reset
    const mockResponse = {
      success: true,
      message: "State reset successfully"
    };
    
    res.status(200).json(mockResponse);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};

export default mockState;