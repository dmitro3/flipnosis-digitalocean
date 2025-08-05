const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3001;

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

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

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEndpoints() {
  const testAddress = '0x1234567890123456789012345678901234567890';
  
  console.log('Testing API endpoints...\n');
  
  try {
    // Test GET profile
    console.log('1. Testing GET /api/profile/:address');
    const getProfile = await makeRequest(`/api/profile/${testAddress}`);
    console.log('Status:', getProfile.status);
    console.log('Response:', JSON.stringify(getProfile.data, null, 2));
    console.log('');
    
    // Test PUT profile
    console.log('2. Testing PUT /api/profile/:address');
    const putProfile = await makeRequest(`/api/profile/${testAddress}`, 'PUT', {
      name: 'Test User',
      avatar: '',
      headsImage: '',
      tailsImage: '',
      twitter: '@testuser',
      telegram: '@testuser'
    });
    console.log('Status:', putProfile.status);
    console.log('Response:', JSON.stringify(putProfile.data, null, 2));
    console.log('');
    
    // Test GET offers
    console.log('3. Testing GET /api/users/:address/offers');
    const getOffers = await makeRequest(`/api/users/${testAddress}/offers`);
    console.log('Status:', getOffers.status);
    console.log('Response:', JSON.stringify(getOffers.data, null, 2));
    console.log('');
    
  } catch (error) {
    console.error('Error testing endpoints:', error.message);
  }
}

testEndpoints(); 