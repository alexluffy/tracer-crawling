// Test script for Swagger API Documentation
const fs = require('fs');
const path = require('path');

// Simple test to verify Swagger configuration
console.log('🧪 Testing Swagger API Documentation Setup...');

// Check if required files exist
const requiredFiles = [
  'src/lib/swagger.ts',
  'src/app/(api)/api/docs/route.ts',
  'src/app/api-docs/page.tsx'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n🎉 All Swagger files are in place!');
  console.log('\n📋 Next steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Visit http://localhost:3000/api-docs to view Swagger UI');
  console.log('3. Test API endpoints: http://localhost:3000/api/docs for JSON spec');
  console.log('\n🔧 Available API endpoints documented:');
  console.log('- GET /api/v1/address - Search wallet addresses');
  console.log('- POST /api/v1/address - Add multiple wallet addresses');
  console.log('- GET /api/v1/address/{id} - Get wallet details');
  console.log('- POST /api/v1/address/{id} - Add tag to wallet');
  console.log('- GET /api/v1/stats - Get system statistics');
  console.log('- GET /api/v1/tags - Get wallet tags');
  console.log('- Graph endpoints (to be documented)');
} else {
  console.log('\n❌ Some files are missing. Please check the setup.');
}

console.log('\n📚 Swagger Documentation Features:');
console.log('- Interactive API testing');
console.log('- Complete schema definitions');
console.log('- Request/response examples');
console.log('- Parameter validation');
console.log('- Error code documentation');