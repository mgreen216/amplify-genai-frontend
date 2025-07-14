import { NextApiRequest, NextApiResponse } from "next";
import mockRouter from "./pages/api/mock/router";

// Test helper to create mock request/response objects
const createMockReqRes = (method: string, path: string, op?: string, body?: any) => {
  const req = {
    method,
    body,
    query: { path, op }
  } as unknown as NextApiRequest;

  let responseData: any = null;
  let statusCode: number = 0;

  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      responseData = data;
      return res;
    }
  } as unknown as NextApiResponse;

  return { req, res, getResponse: () => ({ statusCode, responseData }) };
};

// Test all mock endpoints
async function testMockEndpoints() {
  console.log("=== Testing Mock Endpoints ===\n");

  const testCases = [
    // Available Models
    {
      name: "GET /available_models",
      method: "GET",
      path: "/available_models",
      expectedFields: ["success", "data"]
    },
    
    // Admin Configs
    {
      name: "GET /amplifymin/configs",
      method: "GET",
      path: "/amplifymin/configs",
      expectedFields: ["success", "data"]
    },
    
    // Feature Flags
    {
      name: "GET /amplifymin/feature_flags",
      method: "GET",
      path: "/amplifymin/feature_flags",
      expectedFields: ["success", "data"]
    },
    
    // User App Configs
    {
      name: "GET /amplifymin/user_app_configs",
      method: "GET",
      path: "/amplifymin/user_app_configs",
      expectedFields: ["success", "data"]
    },
    
    // Settings
    {
      name: "GET /state/settings/get",
      method: "GET",
      path: "/state/settings",
      op: "/get",
      expectedFields: ["success", "data"]
    },
    
    // Assistants List
    {
      name: "GET /assistant/list",
      method: "GET",
      path: "/assistant",
      op: "/list",
      expectedFields: ["success", "data"]
    },
    
    // State
    {
      name: "GET /state/get",
      method: "GET",
      path: "/state",
      op: "/get",
      expectedFields: ["success", "data"]
    }
  ];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    
    const { req, res, getResponse } = createMockReqRes(
      testCase.method,
      testCase.path,
      testCase.op
    );

    try {
      await mockRouter(req, res);
      const { statusCode, responseData } = getResponse();
      
      console.log(`  Status: ${statusCode}`);
      console.log(`  Response structure:`, Object.keys(responseData || {}));
      
      // Verify expected fields
      if (testCase.expectedFields && responseData) {
        const missingFields = testCase.expectedFields.filter(
          field => !(field in responseData)
        );
        
        if (missingFields.length > 0) {
          console.log(`  ❌ Missing fields: ${missingFields.join(", ")}`);
        } else {
          console.log(`  ✅ All expected fields present`);
        }
      }
      
      // Check if data needs decoding
      if (responseData?.data && typeof responseData.data === 'string') {
        console.log(`  ⚠️  Data is encoded (string), length: ${responseData.data.length}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
    }
    
    console.log("");
  }
  
  console.log("=== Testing Complete ===");
}

// Run tests
testMockEndpoints().catch(console.error);