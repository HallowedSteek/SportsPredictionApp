// Helper script to find your computer's IP address for mobile device testing
// Run with: node get-ip.js

const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip over non-IPv4 and internal addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        addresses.push({
          name: name,
          address: interface.address
        });
      }
    }
  }

  return addresses;
}

console.log('🔍 Finding your computer\'s IP addresses for mobile device testing...\n');

const addresses = getLocalIPAddress();

if (addresses.length === 0) {
  console.log('❌ No external IP addresses found.');
  console.log('💡 Make sure you\'re connected to WiFi or Ethernet.');
} else {
  console.log('📱 Use one of these IP addresses for physical device testing:\n');
  
  addresses.forEach((addr, index) => {
    console.log(`${index + 1}. ${addr.name}: ${addr.address}`);
    console.log(`   Frontend URL: http://${addr.address}:3000/`);
    console.log(`   Update config.ts: return 'http://${addr.address}:3000/';`);
    console.log();
  });

  console.log('🔧 To use with physical device:');
  console.log('1. Choose the IP address from your main network interface (usually WiFi)');
  console.log('2. Update the baseURL in api/config.ts');
  console.log('3. Make sure your backend is running and accessible on that IP');
  console.log('4. Ensure your phone and computer are on the same network');
}

console.log('\n📖 Quick Reference:');
console.log('• Android Emulator: http://10.0.2.2:3000/');
console.log('• iOS Simulator: http://localhost:3000/');
console.log('• Physical Device: http://[YOUR_IP]:3000/'); 