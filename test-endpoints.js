// Test script to verify endpoints are working
const fetch = require('node-fetch');

async function testEndpoints() {
  console.log('Testing endpoints...\n');
  
  // Test 1: requestOp endpoint
  console.log('1. Testing /api/requestOp:');
  try {
    const response = await fetch('http://localhost:3006/api/requestOp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          method: 'GET',
          path: '/assistant/',
          op: 'list'
        }
      })
    });
    console.log(`   Status: ${response.status}`);
    if (!response.ok) {
      const text = await response.text();
      console.log(`   Response: ${text}`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: Chat endpoint
  console.log('\n2. Testing /api/v1/chat/completions:');
  try {
    const response = await fetch('http://localhost:3006/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' }
        ],
        stream: false
      })
    });
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.log('Installing node-fetch...');
  console.log('Run: npm install node-fetch@2');
  console.log('Then run: node test-endpoints.js');
} else {
  testEndpoints();
}