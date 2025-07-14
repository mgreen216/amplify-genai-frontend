import { NextApiRequest, NextApiResponse } from "next";

// Mock Amplify groups endpoint
const mockAmplifyGroups = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    // Return mock Amplify groups
    const mockResponse = {
      success: true,
      data: {
        groups: {
          "All": {
            id: "group-all",
            name: "All",
            description: "All users",
            memberCount: 500,
            permissions: ["read", "write", "chat"]
          },
          "Administrators": {
            id: "group-admin",
            name: "Administrators",
            description: "System administrators with full access",
            memberCount: 5,
            permissions: ["read", "write", "chat", "admin", "delete"]
          },
          "Developers": {
            id: "group-dev",
            name: "Developers",
            description: "Development team members",
            memberCount: 25,
            permissions: ["read", "write", "chat", "code_interpreter", "api_access"]
          },
          "PowerUsers": {
            id: "group-power",
            name: "PowerUsers",
            description: "Advanced users with extended features",
            memberCount: 50,
            permissions: ["read", "write", "chat", "workflows", "integrations"]
          },
          "Marketing": {
            id: "group-marketing",
            name: "Marketing",
            description: "Marketing team members",
            memberCount: 30,
            permissions: ["read", "write", "chat", "artifacts", "sharing"]
          },
          "Researchers": {
            id: "group-research",
            name: "Researchers",
            description: "Research team members",
            memberCount: 20,
            permissions: ["read", "write", "chat", "rag", "memory"]
          },
          "Students": {
            id: "group-students",
            name: "Students",
            description: "Student users",
            memberCount: 200,
            permissions: ["read", "chat"]
          },
          "Designers": {
            id: "group-design",
            name: "Designers",
            description: "Design team members",
            memberCount: 15,
            permissions: ["read", "write", "chat", "artifacts"]
          },
          "Users": {
            id: "group-users",
            name: "Users",
            description: "Standard users",
            memberCount: 300,
            permissions: ["read", "write", "chat"]
          },
          "Standard": {
            id: "group-standard",
            name: "Standard",
            description: "Standard access group",
            memberCount: 250,
            permissions: ["read", "write", "chat", "sharing"]
          }
        },
        userGroups: ["Users", "Standard"] // Groups the current user belongs to
      }
    };
    
    res.status(200).json(mockResponse);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};

export default mockAmplifyGroups;