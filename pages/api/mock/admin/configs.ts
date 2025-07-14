import { NextApiRequest, NextApiResponse } from "next";

// Mock admin configurations endpoint
const mockAdminConfigs = async (req: NextApiRequest, res: NextApiResponse) => {
  // Handle both GET and POST requests
  if (req.method === 'GET') {
    // Return mock admin configurations
    const mockResponse = {
      success: true,
      data: {
        configurations: [
          {
            type: "model_settings",
            data: {
              default_model: "gpt-3.5-turbo",
              advanced_model: "gpt-4",
              cheapest_model: "gpt-3.5-turbo",
              available_models: ["gpt-3.5-turbo", "gpt-4", "text-embedding-ada-002"]
            }
          },
          {
            type: "feature_settings",
            data: {
              chat_enabled: true,
              artifacts_enabled: true,
              assistants_enabled: true,
              integrations_enabled: true,
              admin_panel_enabled: true
            }
          },
          {
            type: "api_settings",
            data: {
              openai_endpoint: "https://api.openai.com/v1",
              anthropic_endpoint: "https://api.anthropic.com/v1",
              google_endpoint: "https://generativelanguage.googleapis.com/v1"
            }
          },
          {
            type: "system_settings",
            data: {
              max_tokens_default: 2048,
              temperature_default: 0.7,
              rate_limit_requests_per_minute: 60,
              rate_limit_tokens_per_minute: 40000
            }
          }
        ]
      }
    };
    
    res.status(200).json(mockResponse);
  } else if (req.method === 'POST') {
    // Handle configuration updates
    const { configurations } = req.body;
    
    // Mock successful update
    const mockResponse = {
      success: true,
      message: "Configurations updated successfully",
      data: {
        updated_count: configurations?.length || 0
      }
    };
    
    res.status(200).json(mockResponse);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};

export default mockAdminConfigs;