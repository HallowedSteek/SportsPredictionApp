// Simple backend connectivity test
// Run with: node test-backend.js

const axios = require('axios');

async function testBackend() {
  const urls = [
    'http://localhost:3000',
    'http://10.0.2.2:3000',
    'http://127.0.0.1:3000'
  ];

  console.log('🔍 Testing backend connectivity...\n');

  for (const url of urls) {
    try {
      console.log(`Testing ${url}...`);
      const response = await axios.get(`${url}/games`, { timeout: 3000 });
      console.log(`✅ SUCCESS! Backend is reachable at ${url}`);
      console.log(`   Found ${response.data.length} games`);
      console.log(`   Update your config.ts to use: '${url}/'`);
      return; // Exit after first successful connection
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ Connection refused - backend not running at ${url}`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`❌ Host not found - ${url}`);
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  }

  console.log('\n💡 Troubleshooting:');
  console.log('1. Make sure your backend is running: npm start');
  console.log('2. Check the backend is on port 3000');
  console.log('3. Try starting backend with: npm start --host 0.0.0.0');
  console.log('4. If using physical device, run: node get-ip.js');
}

testBackend(); 