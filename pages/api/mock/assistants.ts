import { NextApiRequest, NextApiResponse } from "next";

// Mock assistants endpoint
const mockAssistants = async (req: NextApiRequest, res: NextApiResponse) => {
  const { op } = req.query;
  
  // doRequestOp always sends POST requests to /api/requestOp
  // All requests come as POST from doRequestOp
  const actualMethod = req.method;
  
  if (op === 'create') {
    // Handle assistant creation
    const assistantData = req.body;
    
    const mockResponse = {
      success: true,
      data: {
        id: `ast-${Date.now()}`,
        assistantId: `assistant-${Date.now()}`,
        provider: assistantData.provider || 'amplify',
        name: assistantData.name || 'New Assistant',
        description: assistantData.description || '',
        createdAt: new Date().toISOString()
      }
    };
    
    res.status(200).json(mockResponse);
  } else if (op === 'list') {
    // Return list of assistants
    const mockResponse = {
      success: true,
      data: {
        assistants: [
          {
            id: "ast-1",
            assistantId: "assistant-1",
            name: "General Assistant",
            description: "A helpful general-purpose assistant",
            provider: "amplify",
            model: "gpt-3.5-turbo",
            instructions: "You are a helpful assistant.",
            tools: ["web_search", "calculator"],
            dataSources: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z"
          },
          {
            id: "ast-2",
            assistantId: "assistant-2",
            name: "Code Helper",
            description: "Specialized in programming and code review",
            provider: "amplify",
            model: "gpt-4",
            instructions: "You are an expert programmer. Help users with coding questions.",
            tools: ["code_interpreter"],
            dataSources: [],
            createdAt: "2024-01-02T00:00:00Z",
            updatedAt: "2024-01-02T00:00:00Z"
          },
          {
            id: "ast-3",
            assistantId: "assistant-3",
            name: "Research Assistant",
            description: "Helps with research and data analysis",
            provider: "amplify",
            model: "gpt-4",
            instructions: "You are a research assistant. Help users find and analyze information.",
            tools: ["web_search", "file_browser"],
            dataSources: [],
            createdAt: "2024-01-03T00:00:00Z",
            updatedAt: "2024-01-03T00:00:00Z"
          }
        ]
      }
    };
    
    res.status(200).json(mockResponse);
  } else if (op === 'update') {
    // Handle assistant update
    const mockResponse = {
      success: true,
      message: "Assistant updated successfully",
      data: {
        ...req.body,
        updatedAt: new Date().toISOString()
      }
    };
    
    res.status(200).json(mockResponse);
  } else if (op === 'delete') {
    // Handle assistant deletion
    const mockResponse = {
      success: true,
      message: "Assistant deleted successfully"
    };
    
    res.status(200).json(mockResponse);
  } else if (op === 'get') {
    // Get single assistant
    const mockResponse = {
      success: true,
      data: {
        id: "ast-1",
        assistantId: "assistant-1",
        name: "General Assistant",
        description: "A helpful general-purpose assistant",
        provider: "amplify",
        model: "gpt-3.5-turbo",
        instructions: "You are a helpful assistant.",
        tools: ["web_search", "calculator"],
        dataSources: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
      }
    };
    
    res.status(200).json(mockResponse);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};

export default mockAssistants;