import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Temporary fix - return empty data to prevent Internal Server Error
  // The actual home components are misplaced in pages/api/home/ folder
  // They should be moved to pages/ directory
  
  res.status(200).json({ 
    message: "Home API endpoint",
    data: {}
  });
}