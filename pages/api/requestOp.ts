import { NextApiRequest, NextApiResponse } from "next";
import {getServerSession} from "next-auth/next";
import {authOptions} from "@/pages/api/auth/[...nextauth]";
import { transformPayload } from "@/utils/app/data";
import { lzwCompress } from "@/utils/app/lzwCompression";
import {
    constructRequestOpUrl,
    normalizeRequestOpMethod,
    RequestOpPolicyError,
} from "@/utils/server/requestOpPolicy";

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb' // Increased limit for large conversations
        }
    }
}

interface reqPayload {
    method: string,
    headers: Record<string, string>,
    body?: any,
    redirect: 'manual',
}

// Paths that should not be compressed
const NO_COMPRESSION_PATHS = ['/billing', '/se', "/amp", '/vu-agent', "/user-data", "/data-disclosure", "/integrations"];


const requestOp =
    async (req: NextApiRequest, res: NextApiResponse) => {

        if (req.method !== 'POST') {
            res.setHeader('Allow', 'POST');
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const session = await getServerSession(req, res, authOptions);

        if (!session) {
            // Unauthorized access, no session found
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        // Accessing itemData parameters from the request
        const reqData = req.body.data || {};
        if (!reqData || typeof reqData !== 'object' || Array.isArray(reqData)) {
            return res.status(400).json({ error: 'Invalid request data' });
        }
        const pollRequestId = req.body.pollRequestId;  // Extract pollRequestId at top level

        let method: string;
        let payload: any;
        let apiUrl: string;
        try {
            method = normalizeRequestOpMethod(reqData.method);
            payload = reqData.data ? transformPayload.decode(reqData.data) : null;
            apiUrl = constructRequestOpUrl(reqData, transformPayload.decode);
        } catch (error) {
            if (error instanceof RequestOpPolicyError) {
                if (error.statusCode === 500) {
                    console.error('Request proxy configuration is invalid:', error.message);
                    return res.status(500).json({ error: 'Request proxy is not configured' });
                }
                return res.status(400).json({ error: error.message });
            }

            console.error('Error validating requestOp input:', error);
            return res.status(400).json({ error: 'Invalid request' });
        }

        // @ts-ignore
        const accessToken = (session as any).accessToken || (session as any).token?.accessToken || "";

        let reqPayload: reqPayload = {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}` 
            },
            // Never forward the Cognito bearer through an upstream redirect.
            redirect: 'manual',
        }

        if (payload) {
            // Use originalPath if available (set when running locally), otherwise use path
            const pathToCheck = reqData.originalPath || reqData.path;
            const shouldCompress = !NO_COMPRESSION_PATHS.includes(pathToCheck);
            
            if (shouldCompress) {
                try {
                    if (typeof payload === 'object') {
                        payload = lzwCompress(JSON.stringify(payload));   
                        console.log("Compressed payload");
                    } else if (typeof payload === 'string' && payload.length > 1000) {
                        // Compress large strings
                        payload = lzwCompress(payload);
                        console.log("Compressed payload");
                    }
                } catch (e) {
                    console.error("Error in requestOp: ", e);
                    console.log("Sending uncompressed payload");
                }
            } else {
                console.log(`Skipping compression for path: ${reqData.path}`);
            }

            // Include pollRequestId if present (for polling support)
            const bodyData: any = { data: payload };
            if (pollRequestId) {
                bodyData.pollRequestId = pollRequestId;
                console.log(`Including pollRequestId in backend request: ${pollRequestId}`);
            }
            reqPayload.body = JSON.stringify(bodyData);

        }

        try {

            const response = await fetch(apiUrl, reqPayload);

            if (!response.ok) throw new Error(`Upstream request failed with status: ${response.status}`);

            const responseData = await response.json();
            const encodedResponse = transformPayload.encode(responseData);

            res.status(200).json({ data: encodedResponse });
        } catch (error) {
            console.error("Error in requestOp: ", error);
            res.status(500).json({ error: `Could not perform requestOp` });
        }
    };

export default requestOp;
