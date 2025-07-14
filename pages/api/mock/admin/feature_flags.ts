import { NextApiRequest, NextApiResponse } from "next";

// Mock feature flags endpoint
const mockFeatureFlags = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    // Return mock feature flags
    const mockResponse = {
      success: true,
      data: {
        chatEnabled: {
          enabled: true,
          userExceptions: [],
          amplifyGroupExceptions: []
        },
        artifactsEnabled: {
          enabled: true,
          userExceptions: [],
          amplifyGroupExceptions: []
        },
        assistantsEnabled: {
          enabled: true,
          userExceptions: [],
          amplifyGroupExceptions: []
        },
        integrationsEnabled: {
          enabled: true,
          userExceptions: [],
          amplifyGroupExceptions: []
        },
        adminPanelEnabled: {
          enabled: true,
          userExceptions: ["demo@example.com"],
          amplifyGroupExceptions: ["Administrators"]
        },
        codeInterpreterEnabled: {
          enabled: false,
          userExceptions: ["developer@example.com"],
          amplifyGroupExceptions: ["Developers"]
        },
        ragEnabled: {
          enabled: true,
          userExceptions: [],
          amplifyGroupExceptions: []
        },
        memoryEnabled: {
          enabled: true,
          userExceptions: [],
          amplifyGroupExceptions: []
        },
        workflowsEnabled: {
          enabled: false,
          userExceptions: ["advanced@example.com"],
          amplifyGroupExceptions: ["PowerUsers"]
        },
        marketplaceEnabled: {
          enabled: true,
          userExceptions: [],
          amplifyGroupExceptions: []
        },
        sharingEnabled: {
          enabled: true,
          userExceptions: [],
          amplifyGroupExceptions: []
        },
        apiKeysEnabled: {
          enabled: true,
          userExceptions: [],
          amplifyGroupExceptions: []
        }
      }
    };
    
    res.status(200).json(mockResponse);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};

export default mockFeatureFlags;