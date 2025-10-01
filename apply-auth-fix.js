// Script to manually apply authentication fixes
// This updates all API endpoints to use authOptions(req)

const fs = require('fs');
const path = require('path');

const fixes = [
  'pages/api/direct/models.ts',
  'pages/api/direct/chat.ts', 
  'pages/api/requestOp.ts',
  'pages/api/state.ts',
  'pages/api/proxy/llm-stream.ts',
  'pages/api/models/available.ts',
  'pages/api/files/upload.ts',
  'pages/api/market/op.ts',
  'pages/api/pdb/op.ts',
  'pages/api/share/delete.ts',
  'pages/api/share/deleteyoushared.ts',
  'pages/api/share/youshared.ts'
];

fixes.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix the authOptions call
    content = content.replace(
      /authOptions as any/g,
      'authOptions(req) as any'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✓ Fixed ${file}`);
  }
});

console.log('\nAuthentication fixes applied!');
console.log('Now build and deploy the application.');
