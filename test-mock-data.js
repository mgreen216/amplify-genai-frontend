const { transformPayload } = require('./utils/app/data');

// Test encoding/decoding roundtrip
console.log('=== Testing transformPayload encoding/decoding ===\n');

// Test 1: Simple object
const simpleData = { message: 'Hello', value: 123 };
console.log('1. Simple object test:');
console.log('Original:', simpleData);
const encoded1 = transformPayload.encode(simpleData);
console.log('Encoded:', encoded1);
const decoded1 = transformPayload.decode(encoded1);
console.log('Decoded:', decoded1);
console.log('Match:', JSON.stringify(simpleData) === JSON.stringify(decoded1));

// Test 2: Complex nested structure (like API responses)
const complexData = {
  success: true,
  data: {
    models: [
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        settings: {
          temperature: 0.7,
          maxTokens: 2048
        }
      }
    ],
    metadata: {
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    }
  }
};

console.log('\n2. Complex nested structure test:');
console.log('Original:', JSON.stringify(complexData, null, 2));
const encoded2 = transformPayload.encode(complexData);
console.log('Encoded length:', encoded2.length);
const decoded2 = transformPayload.decode(encoded2);
console.log('Decoded:', JSON.stringify(decoded2, null, 2));
console.log('Match:', JSON.stringify(complexData) === JSON.stringify(decoded2));

// Test 3: Arrays and special characters
const specialData = {
  items: ["item1", "item2", "special chars: éñ©"],
  unicode: "Hello 世界 🌍",
  nested: {
    array: [1, 2, { key: "value" }]
  }
};

console.log('\n3. Arrays and special characters test:');
console.log('Original:', specialData);
const encoded3 = transformPayload.encode(specialData);
console.log('Encoded:', encoded3);
const decoded3 = transformPayload.decode(encoded3);
console.log('Decoded:', decoded3);
console.log('Match:', JSON.stringify(specialData) === JSON.stringify(decoded3));

// Test 4: Error handling
console.log('\n4. Error handling test:');
try {
  transformPayload.decode('invalid-base64!!!');
} catch (error) {
  console.log('Expected error caught:', error.message);
}

// Test 5: Mock response structure
const mockResponseStructure = {
  data: transformPayload.encode({
    success: true,
    data: {
      models: [
        { id: "model1", name: "Model 1" }
      ]
    }
  })
};

console.log('\n5. Mock response structure test:');
console.log('Mock response:', mockResponseStructure);
const innerData = transformPayload.decode(mockResponseStructure.data);
console.log('Decoded inner data:', innerData);

console.log('\n=== All tests completed ===');