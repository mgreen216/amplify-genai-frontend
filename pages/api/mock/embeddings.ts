import { NextApiRequest, NextApiResponse } from "next";

// Mock embeddings endpoint
const mockEmbeddings = async (req: NextApiRequest, res: NextApiResponse) => {
  const { op } = req.query;
  
  if (req.method === 'GET' && op === 'sqs/get') {
    // Return mock in-flight embeddings
    const mockResponse = {
      success: true,
      body: JSON.stringify({
        success: true,
        messages: [
          {
            id: "embedding-1",
            object_key: "doc-123",
            status: "processing",
            progress: 45,
            documentName: "Research Paper.pdf",
            startTime: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            estimatedCompletion: new Date(Date.now() + 300000).toISOString() // 5 minutes from now
          },
          {
            id: "embedding-2",
            object_key: "doc-456",
            status: "processing",
            progress: 78,
            documentName: "Product Manual.docx",
            startTime: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
            estimatedCompletion: new Date(Date.now() + 120000).toISOString() // 2 minutes from now
          }
        ]
      })
    };
    
    res.status(200).json(mockResponse);
  } else if (req.method === 'POST' && op === 'terminate') {
    // Handle embedding termination
    const { object_key } = req.body;
    
    const mockResponse = {
      success: true,
      message: `Embedding process for ${object_key} terminated successfully`
    };
    
    res.status(200).json(mockResponse);
  } else if (req.method === 'POST') {
    // Handle new embedding request
    const mockResponse = {
      success: true,
      data: {
        id: `embedding-${Date.now()}`,
        object_key: `doc-${Date.now()}`,
        status: "queued",
        message: "Embedding process queued successfully"
      }
    };
    
    res.status(200).json(mockResponse);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};

export default mockEmbeddings;