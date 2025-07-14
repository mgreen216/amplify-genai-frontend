import { NextApiRequest, NextApiResponse } from "next";
import { transformPayload } from "@/utils/app/data";
import mockAvailableModels from "./available_models";
import mockAdminConfigs from "./admin/configs";
import mockFeatureFlags from "./admin/feature_flags";
import mockUserAppConfigs from "./admin/user_app_configs";
import mockPptxTemplates from "./admin/pptx_templates";
import mockAmplifyGroups from "./admin/amplify_groups";
import mockEmbeddings from "./embeddings";
import mockSettings from "./settings";
import mockAssistants from "./assistants";
import mockState from "./state";

// Mock API router that handles all mock endpoints
const mockRouter = async (req: NextApiRequest, res: NextApiResponse) => {
  const { path, op } = req.query;
  
  // Construct the full path from query parameters
  const fullPath = `${path || ''}${op || ''}`;
  
  console.log('[Mock Router] Handling request:', {
    method: req.method,
    path: fullPath,
    query: req.query
  });
  
  // Create a wrapper to intercept and encode responses
  const originalJson = res.json.bind(res);
  
  // Override the json method to encode responses
  res.json = (data: any) => {
    // Encode the response data for compatibility with doRequestOp
    const encodedData = transformPayload.encode(data);
    return originalJson({ data: encodedData });
  };
  
  const mockRes = res;
  
  // Route to appropriate mock handler based on path
  switch (fullPath) {
    case '/available_models':
    case '/available_models/':
      return mockAvailableModels(req, mockRes);
      
    case '/amplifymin/configs':
    case '/amplifymin/configs/':
    case '/amplifymin/configs/update':
      return mockAdminConfigs(req, mockRes);
      
    case '/amplifymin/feature_flags':
    case '/amplifymin/feature_flags/':
      return mockFeatureFlags(req, mockRes);
      
    case '/amplifymin/user_app_configs':
    case '/amplifymin/user_app_configs/':
      return mockUserAppConfigs(req, mockRes);
      
    case '/amplifymin/pptx_templates':
    case '/amplifymin/pptx_templates/':
    case '/amplifymin/pptx_templates/upload':
    case '/amplifymin/pptx_templates/delete':
      return mockPptxTemplates(req, mockRes);
      
    case '/amplifymin/amplify_groups/list':
    case '/amplifymin/amplify_groups':
      return mockAmplifyGroups(req, mockRes);
      
    case '/embedding':
    case '/embedding/sqs/get':
    case '/embedding/terminate':
      // Pass the operation as a query param to the handler
      req.query.op = op as string;
      return mockEmbeddings(req, mockRes);
      
    case '/state/settings/get':
    case '/state/settings/save':
      req.query.op = op as string;
      return mockSettings(req, mockRes);
      
    case '/assistant/create':
    case '/assistant/list':
    case '/assistant/update':
    case '/assistant/delete':
    case '/assistant/get':
      req.query.op = op as string;
      return mockAssistants(req, mockRes);
      
    case '/state/get':
    case '/state/save':
    case '/state/reset':
      req.query.op = op as string;
      return mockState(req, mockRes);
      
    case '/state/accounts/get':
      return mockRes.status(200).json({
        success: true,
        data: [{
          id: "default-account",
          name: "Default Account",
          isDefault: true,
          rateLimit: {
            maxRequests: 100,
            windowMs: 60000
          }
        }]
      });
      
    case '/utilities/emails':
      return mockRes.status(200).json({
        success: true,
        data: [
          "user1@holyfamily.edu",
          "user2@holyfamily.edu",
          "admin@holyfamily.edu"
        ]
      });
      
    case '/state/share':
      return mockRes.status(200).json({
        success: true,
        data: []
      });
      
    case '/groups/list':
      return mockRes.status(200).json({
        success: true,
        data: []
      });
      
    default:
      console.log('[Mock Router] No handler found for path:', fullPath);
      
      // Return a generic success response for unhandled endpoints
      const genericResponse = {
        success: true,
        message: `Mock response for ${fullPath}`,
        data: {},
        timestamp: new Date().toISOString()
      };
      
      return mockRes.status(200).json(genericResponse);
  }
};

export default mockRouter;