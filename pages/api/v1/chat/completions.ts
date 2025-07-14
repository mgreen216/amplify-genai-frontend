import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from 'uuid';
import { configureCORS } from '../../cors';

// Mock chat completions endpoint for development
const mockChatCompletions = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log('[Mock Chat] Request received:', {
    method: req.method,
    headers: req.headers,
    url: req.url
  });
  
  // Handle CORS
  if (configureCORS(req, res)) {
    return;
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check if mock mode is enabled
  const USE_MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' || process.env.USE_MOCK_API === 'true';
  
  if (!USE_MOCK_MODE) {
    return res.status(404).json({ error: "Mock chat endpoint not available" });
  }

  try {
    const { messages, model, temperature, stream } = req.body;
    
    console.log('[Mock Chat] Request body:', {
      model,
      temperature,
      stream,
      messageCount: messages?.length
    });
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.content || "Hello";
    
    // Generate a mock response
    const mockResponse = generateMockResponse(userMessage, model);
    
    if (stream) {
      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      
      // Stream the response
      streamMockResponse(req, res, mockResponse, model);
    } else {
      // Return non-streaming response
      res.status(200).json({
        id: `chatcmpl-${uuidv4()}`,
        object: "chat.completion",
        created: Date.now(),
        model: model || "gpt-3.5-turbo",
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: mockResponse
          },
          finish_reason: "stop"
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      });
    }
  } catch (error) {
    console.error('Mock chat error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

function generateMockResponse(userMessage: string, model: string): string {
  // Generate contextual mock responses based on user input
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm the Holy Family University AI Assistant running in mock mode. How can I help you today?";
  } else if (lowerMessage.includes('help')) {
    return "I'm here to help! In mock mode, I can simulate conversations and demonstrate the chat interface. What would you like to know about?";
  } else if (lowerMessage.includes('test')) {
    return "This is a test response from the mock chat endpoint. The system is working correctly!";
  } else if (lowerMessage.includes('math') || lowerMessage.includes('calculate')) {
    return "I can help with mathematical calculations! For example, 2 + 2 = 4. What calculation would you like me to help with?";
  } else if (lowerMessage.includes('code') || lowerMessage.includes('program')) {
    return "I can assist with programming! Here's a simple example:\n\n```python\ndef greet(name):\n    return f'Hello, {name}!'\n\nprint(greet('HFU Student'))\n```\n\nWhat programming topic interests you?";
  } else {
    // Default response with the model name
    return `I'm the mock ${model || 'AI'} assistant. Your message was: "${userMessage}". In a production environment, I would provide more sophisticated responses based on the actual AI model's capabilities.`;
  }
}

function streamMockResponse(req: NextApiRequest, res: NextApiResponse, content: string, model: string) {
  // Split content into words for streaming
  const words = content.split(' ');
  let index = 0;
  
  const streamInterval = setInterval(() => {
    if (index < words.length) {
      const word = words[index] + (index < words.length - 1 ? ' ' : '');
      const chunk = {
        id: `chatcmpl-${uuidv4()}`,
        object: "chat.completion.chunk",
        created: Date.now(),
        model: model || "gpt-3.5-turbo",
        choices: [{
          index: 0,
          delta: {
            content: word
          },
          finish_reason: null
        }]
      };
      
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      index++;
    } else {
      // Send the final chunk
      const finalChunk = {
        id: `chatcmpl-${uuidv4()}`,
        object: "chat.completion.chunk",
        created: Date.now(),
        model: model || "gpt-3.5-turbo",
        choices: [{
          index: 0,
          delta: {},
          finish_reason: "stop"
        }]
      };
      
      res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      clearInterval(streamInterval);
    }
  }, 50); // Stream a word every 50ms
  
  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(streamInterval);
  });
}

export default mockChatCompletions;