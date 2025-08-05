const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3001;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

async function testHealth() {
  console.log('Testing server health...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing GET /health');
    const health = await makeRequest('/health');
    console.log('Status:', health.status);
    console.log('Response:', JSON.stringify(health.data, null, 2));
    console.log('');
    
    // Test API health endpoint
    console.log('2. Testing GET /api/health');
    const apiHealth = await makeRequest('/api/health');
    console.log('Status:', apiHealth.status);
    console.log('Response:', JSON.stringify(apiHealth.data, null, 2));
    console.log('');
    
  } catch (error) {
    console.error('Error testing health endpoints:', error.message);
  }
}

testHealth(); 