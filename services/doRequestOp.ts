import { transformPayload } from "@/utils/app/data";

interface opData {
    // env base api url is used if not provided
    url?: string; // used for running localhost or sending request to another url
    method: string,
    path: string;
    op: string;
    data?: any;
    queryParams?: queryParams;
    service?: string // pass in .env.local file as "LOCAL_SERVICES" to run entire service locally
}

interface queryParams {
    [key: string]: string;
}

// Interface to map services to their ports
interface ServicePortMap {
    [key: string]: string;
}

function parseServiceConfig(serviceConfigStr: string): {
    services: string[];
    servicePorts: ServicePortMap;
    serviceStages: { [key: string]: string };
} {
    const services: string[] = [];
    const servicePorts: ServicePortMap = {};
    const serviceStages: { [key: string]: string } = {};

    if (!serviceConfigStr) return { services, servicePorts, serviceStages };

    const serviceConfigs = serviceConfigStr.split(',').map(s => s.trim());

    for (const config of serviceConfigs) {
        if (!config) continue;

        const [service, port, stage] = config.split(':');
        if (service) {
            services.push(service);
            if (port) servicePorts[service] = port;
            if (stage) serviceStages[service] = stage;
        }
    }

    return { services, servicePorts, serviceStages };
}

export const doRequestOp = async (opData: opData, abortSignal: AbortSignal | null = null) => {
    const { service } = opData;
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    if (typeof service === 'string') {
        const serviceConfigStr = process.env.NEXT_PUBLIC_LOCAL_SERVICES || '';
        const { services, servicePorts, serviceStages } = parseServiceConfig(serviceConfigStr);

        if (services.includes(service)) {
            const port = servicePorts[service] || '3015';
            const stage = serviceStages[service] || 'dev';

            opData.url = `http://localhost:${port}/${stage}${opData.path}${opData.op}`;
            console.log("Function running locally at:", opData.url);
            opData.path = "";
            opData.op = "";
        }
    }

    const request = `${opData.method} - ${opData.path + opData.op}`;
    const requestUrl = opData.url || `${opData.path}${opData.op}`;
    
    // Enhanced logging for debugging
    console.log(`[${requestId}] Starting request: ${request}`);
    console.log(`[${requestId}] URL: ${requestUrl}`);
    console.log(`[${requestId}] Service: ${service || 'default'}`);
    
    // const obfuscatedPayload = transformPayload.encode(opData);
    if (opData.data) opData.data = transformPayload.encode(opData.data); // obfuscate data in payload
    if (opData.queryParams) {
        console.log(`[${requestId}] Query params:`, Object.keys(opData.queryParams));
        Object.entries(opData.queryParams).map(([k, v]) => {
            if (opData.queryParams) opData.queryParams[k] = transformPayload.encode(v)
        }); // obfuscate query params in payload
    }

    try {
        // Create timeout controller for 30 second timeout
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log(`[${requestId}] Request timeout after 30 seconds`);
            timeoutController.abort();
        }, 30000);

        // Use combined signal if external abort signal is provided
        let requestSignal;
        if (abortSignal) {
            // Create combined abort signal
            const combinedController = new AbortController();
            const abortHandler = () => combinedController.abort();
            abortSignal.addEventListener('abort', abortHandler);
            timeoutController.signal.addEventListener('abort', abortHandler);
            requestSignal = combinedController.signal;
        } else {
            requestSignal = timeoutController.signal;
        }

        const response = await fetch('/api/requestOp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: requestSignal,
            body: JSON.stringify({ data: opData }),
        });

        clearTimeout(timeoutId);

        const duration = Date.now() - startTime;
        console.log(`[${requestId}] Response received in ${duration}ms - Status: ${response.status}`);

        if (response.ok) {
            try {
                const encodedResult = await response.json();
                console.log(`[${requestId}] Raw response received:`, encodedResult);
                
                // Check if data exists and is properly encoded
                if (!encodedResult.data) {
                    console.error(`[${requestId}] Response missing 'data' field`);
                    return { 
                        success: false, 
                        message: `Invalid response format from ${request}.`,
                        error: {
                            type: 'PARSE_ERROR',
                            details: 'Response missing data field',
                            request: request,
                            requestId: requestId
                        }
                    };
                }
                
                // Decode response
                const decodedResult = transformPayload.decode(encodedResult.data);
                console.log(`[${requestId}] Request successful:`, decodedResult.success);
                return decodedResult;
            } catch (e) {
                console.error(`[${requestId}] Failed to parse response:`, e);
                return { 
                    success: false, 
                    message: `Error parsing response from ${request}.`,
                    error: {
                        type: 'PARSE_ERROR',
                        details: e instanceof Error ? e.message : 'Unknown parsing error',
                        request: request,
                        requestId: requestId
                    }
                };
            }
        } else {
            const errorText = await response.text().catch(() => response.statusText);
            console.error(`[${requestId}] Request failed with status ${response.status}:`, errorText);
            return { 
                success: false, 
                message: `Error calling ${request}: ${response.statusText}.`,
                error: {
                    type: 'HTTP_ERROR',
                    status: response.status,
                    statusText: response.statusText,
                    details: errorText,
                    request: request,
                    requestId: requestId
                }
            }
        }
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[${requestId}] Network error after ${duration}ms:`, error);
        
        // Determine error type for better user messaging
        let errorType = 'NETWORK_ERROR';
        let errorMessage = 'Network error';
        
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                if (duration >= 29000) { // Close to our 30s timeout
                    errorType = 'TIMEOUT_ERROR';
                    errorMessage = 'Request timeout - please check your connection and try again';
                } else {
                    errorType = 'REQUEST_ABORTED';
                    errorMessage = 'Request was cancelled';
                }
            } else if (error.message.includes('Failed to fetch')) {
                errorType = 'CONNECTION_ERROR';
                errorMessage = 'Unable to connect to server';
            } else {
                errorMessage = error.message;
            }
        }
        
        return { 
            success: false, 
            message: `Network Error calling ${request}: ${errorMessage}.`,
            error: {
                type: errorType,
                details: error instanceof Error ? error.message : 'Unknown network error',
                request: request,
                requestId: requestId,
                duration: duration
            }
        }
    }
}

/**
 * Parse the service:port mapping from environment variable
 * Format: "service1:3001,service2:3002,service3:3003"
 */
function parseServicePorts(portMapStr: string): ServicePortMap {
    if (!portMapStr) return {};

    const portMap: ServicePortMap = {};
    const pairs = portMapStr.split(',');

    pairs.forEach(pair => {
        const [service, port] = pair.trim().split(':');
        if (service && port) {
            portMap[service.trim()] = port.trim();
        }
    });

    return portMap;
}