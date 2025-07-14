import { NextApiRequest, NextApiResponse } from "next";
import {getServerSession} from "next-auth/next";
import {authOptions} from "@/pages/api/auth/[...nextauth]";
import { transformPayload } from "@/utils/app/data";
import mockRouter from "./mock/router";

interface reqPayload {
    method: any, 
    headers: any,
    body?: any,
}

// Check if we should use mock mode
const USE_MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' || process.env.USE_MOCK_API === 'true';

const requestOp =
    async (req: NextApiRequest, res: NextApiResponse) => {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        // Only allow POST method
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Check if authentication is disabled
        const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true';
        
        if (!AUTH_DISABLED) {
            const session = await getServerSession(req, res, authOptions);

            if (!session) {
                // Unauthorized access, no session found
                return res.status(401).json({ error: 'Unauthorized' });
            }
        }

        // Accessing itemData parameters from the request
        const reqData = req.body.data || {};

        const method = reqData.method || null;
        const payload = reqData.data ? transformPayload.decode(reqData.data) : null;

        // If in mock mode or no API_BASE_URL, use mock router
        if (USE_MOCK_MODE || !process.env.API_BASE_URL) {
            console.log('[requestOp] Using mock mode for request');
            
            // Prepare mock request
            const mockReq = {
                ...req,
                method: method,
                body: payload,
                query: {
                    path: reqData.path,
                    op: reqData.op,
                    ...reqData.queryParams
                }
            } as NextApiRequest;
            
            // Use mock router
            return mockRouter(mockReq, res);
        }

        const apiUrl = constructUrl(reqData);
        // @ts-ignore
        const { accessToken } = session;

        let reqPayload: reqPayload = {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}` 
            },
        }

        if (payload) reqPayload.body = JSON.stringify( { data: payload });

        try {
            console.log(`[requestOp] Making request to: ${apiUrl}`);
            const startTime = Date.now();

            const response = await fetch(apiUrl, reqPayload);
            const duration = Date.now() - startTime;
            
            console.log(`[requestOp] Response received in ${duration}ms - Status: ${response.status}`);

            if (!response.ok) {
                const errorBody = await response.text().catch(() => '');
                console.error(`[requestOp] Request failed:`, {
                    url: apiUrl,
                    status: response.status,
                    statusText: response.statusText,
                    body: errorBody.substring(0, 500) // Log first 500 chars
                });
                
                // Try to parse error response
                let errorDetails;
                try {
                    errorDetails = JSON.parse(errorBody);
                } catch {
                    errorDetails = { message: errorBody || response.statusText };
                }
                
                throw new Error(`Request to ${apiUrl} failed with status: ${response.status} - ${JSON.stringify(errorDetails)}`);
            }

            const responseData = await response.json();
            const encodedResponse = transformPayload.encode(responseData);

            res.status(200).json({ data: encodedResponse });
        } catch (error) {
            console.error("[requestOp] Error details:", {
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined,
                url: apiUrl,
                method: method
            });
            
            // If the backend fails, fallback to mock mode
            if (error instanceof Error && (
                error.message.includes('Failed to fetch') ||
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ETIMEDOUT') ||
                error.message.includes('ENOTFOUND')
            )) {
                console.log('[requestOp] Backend unavailable, falling back to mock mode');
                
                // Prepare mock request
                const mockReq = {
                    ...req,
                    method: method,
                    body: payload,
                    query: {
                        path: reqData.path,
                        op: reqData.op,
                        ...reqData.queryParams
                    }
                } as NextApiRequest;
                
                // Use mock router as fallback
                return mockRouter(mockReq, res);
            }
            
            // Provide more detailed error response
            const errorResponse = {
                error: 'Could not perform requestOp',
                details: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    url: apiUrl,
                    timestamp: new Date().toISOString()
                }
            };
            
            res.status(500).json(errorResponse);
        }
    };

export default requestOp;


const constructUrl = (data: any) => {  
    let apiUrl = data.url ?? (process.env.API_BASE_URL || "");

    const path: string = data.path || "";
    const op: string = data.op || "";

    apiUrl += path + op;

    const queryParams: { [key: string]: string } | undefined = data.queryParams;
  
    if (queryParams && Object.keys(queryParams).length > 0) {
      const queryString = Object.keys(queryParams)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent( transformPayload.decode(queryParams[key]) )}`)
        .join('&');
      apiUrl += `?${queryString}`;
    }
    console.log(`--- API url Request to: ${apiUrl} ---`);
    return apiUrl;
  };