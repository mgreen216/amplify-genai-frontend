import { NextApiRequest, NextApiResponse } from "next";

// Mock PowerPoint templates endpoint
const mockPptxTemplates = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    // Return mock PowerPoint templates
    const mockResponse = {
      success: true,
      data: {
        templates: [
          {
            id: "template-1",
            name: "Corporate Blue",
            fileName: "corporate_blue.pptx",
            description: "Professional corporate template with blue theme",
            isAvailable: true,
            amplifyGroups: ["All"],
            thumbnailUrl: "/api/mock/pptx/thumbnail/corporate_blue.png",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z"
          },
          {
            id: "template-2",
            name: "Modern Minimal",
            fileName: "modern_minimal.pptx",
            description: "Clean and minimalist design template",
            isAvailable: true,
            amplifyGroups: ["All"],
            thumbnailUrl: "/api/mock/pptx/thumbnail/modern_minimal.png",
            createdAt: "2024-01-02T00:00:00Z",
            updatedAt: "2024-01-02T00:00:00Z"
          },
          {
            id: "template-3",
            name: "Creative Colors",
            fileName: "creative_colors.pptx",
            description: "Vibrant and colorful presentation template",
            isAvailable: true,
            amplifyGroups: ["Designers", "Marketing"],
            thumbnailUrl: "/api/mock/pptx/thumbnail/creative_colors.png",
            createdAt: "2024-01-03T00:00:00Z",
            updatedAt: "2024-01-03T00:00:00Z"
          },
          {
            id: "template-4",
            name: "Academic Research",
            fileName: "academic_research.pptx",
            description: "Template for academic and research presentations",
            isAvailable: true,
            amplifyGroups: ["Researchers", "Students"],
            thumbnailUrl: "/api/mock/pptx/thumbnail/academic_research.png",
            createdAt: "2024-01-04T00:00:00Z",
            updatedAt: "2024-01-04T00:00:00Z"
          }
        ],
        defaultTemplate: "template-1"
      }
    };
    
    res.status(200).json(mockResponse);
  } else if (req.method === 'POST') {
    // Handle template upload
    const mockResponse = {
      success: true,
      message: "Template uploaded successfully",
      data: {
        id: `template-${Date.now()}`,
        uploadUrl: "/api/mock/upload/pptx",
        expires: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      }
    };
    
    res.status(200).json(mockResponse);
  } else if (req.method === 'DELETE') {
    // Handle template deletion
    const mockResponse = {
      success: true,
      message: "Template deleted successfully"
    };
    
    res.status(200).json(mockResponse);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};

export default mockPptxTemplates;