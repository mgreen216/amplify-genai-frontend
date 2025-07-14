import { NextApiRequest, NextApiResponse } from "next";

// Mock user app configurations endpoint
const mockUserAppConfigs = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    // Return mock user app configurations
    const mockResponse = {
      success: true,
      data: {
        user: {
          id: "mock-user-123",
          email: "user@example.com",
          name: "Mock User",
          role: "user",
          amplifyGroups: ["Users", "Standard"]
        },
        preferences: {
          theme: "dark",
          language: "en",
          defaultModel: "gpt-3.5-turbo",
          showSystemPrompt: true,
          autoSaveEnabled: true,
          notificationsEnabled: true
        },
        limits: {
          maxTokensPerRequest: 4096,
          maxRequestsPerDay: 1000,
          maxFileUploadSize: 10485760, // 10MB
          maxConversationLength: 100
        },
        features: {
          chat: true,
          artifacts: true,
          assistants: true,
          integrations: true,
          adminPanel: false,
          codeInterpreter: false,
          rag: true,
          memory: true,
          workflows: false,
          marketplace: true,
          sharing: true,
          apiKeys: true
        },
        integrations: {
          google: {
            enabled: false,
            connected: false
          },
          github: {
            enabled: true,
            connected: false
          },
          slack: {
            enabled: false,
            connected: false
          }
        },
        quotas: {
          tokensUsedToday: 15234,
          requestsUsedToday: 42,
          storageUsed: 2456789,
          storageLimit: 104857600 // 100MB
        }
      }
    };
    
    res.status(200).json(mockResponse);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};

export default mockUserAppConfigs;