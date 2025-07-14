import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    method: req.method,
    env: {
      USE_MOCK_API: process.env.USE_MOCK_API,
      NEXT_PUBLIC_USE_MOCK_API: process.env.NEXT_PUBLIC_USE_MOCK_API,
      NEXT_PUBLIC_AUTH_DISABLED: process.env.NEXT_PUBLIC_AUTH_DISABLED,
      NODE_ENV: process.env.NODE_ENV,
      API_BASE_URL: process.env.API_BASE_URL,
      CHAT_ENDPOINT: process.env.CHAT_ENDPOINT,
      NEXT_PUBLIC_CHAT_ENDPOINT: process.env.NEXT_PUBLIC_CHAT_ENDPOINT,
    },
    timestamp: new Date().toISOString(),
    message: "Debug endpoint working"
  });
}