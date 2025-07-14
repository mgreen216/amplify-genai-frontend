import { NextApiRequest, NextApiResponse } from "next";

// Mock settings endpoint
const mockSettings = async (req: NextApiRequest, res: NextApiResponse) => {
  const { op } = req.query;
  
  // doRequestOp always sends POST requests to /api/requestOp
  // The actual HTTP method is in req.body (passed from mockRouter)
  const actualMethod = req.body?.method || req.method;
  
  if ((actualMethod === 'GET' || req.method === 'POST') && op === 'get') {
    // Return mock user settings
    const mockResponse = {
      success: true,
      data: {
        settings: {
          theme: "dark",
          language: "en",
          defaultModel: "gpt-3.5-turbo",
          defaultTemperature: 0.7,
          defaultMaxTokens: 2048,
          showSystemPrompt: true,
          autoSaveEnabled: true,
          notificationsEnabled: true,
          soundEnabled: false,
          enterToSend: true,
          streamResponse: true,
          showWordCount: true,
          showTokenCount: true,
          compactMode: false,
          fontSize: "medium",
          codeTheme: "vs-dark",
          markdownEnabled: true,
          syntaxHighlightingEnabled: true,
          spellCheckEnabled: true,
          autoCompleteEnabled: true,
          shortcuts: {
            newChat: "cmd+n",
            deleteChat: "cmd+d",
            toggleSidebar: "cmd+b",
            search: "cmd+k"
          },
          privacy: {
            saveHistory: true,
            shareAnalytics: false,
            allowDataCollection: false
          }
        }
      }
    };
    
    res.status(200).json(mockResponse);
  } else if (req.method === 'POST' && op === 'save') {
    // Handle settings save
    const { settings } = req.body;
    
    const mockResponse = {
      success: true,
      message: "Settings saved successfully",
      data: {
        settings: settings || {}
      }
    };
    
    res.status(200).json(mockResponse);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};

export default mockSettings;