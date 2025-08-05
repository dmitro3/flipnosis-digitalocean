const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001'; // Adjust if your server runs on a different port

async function testProfileEndpoint() {
  console.log('Testing profile endpoints...');
  
  const testAddress = '0x1234567890123456789012345678901234567890';
  
  try {
    // Test GET profile
    console.log('\n1. Testing GET /api/profile/:address');
    const getResponse = await fetch(`${BASE_URL}/api/profile/${testAddress}`);
    console.log('GET Status:', getResponse.status);
    
    if (getResponse.ok) {
      const profile = await getResponse.json();
      console.log('GET Response:', JSON.stringify(profile, null, 2));
    } else {
      const error = await getResponse.text();
      console.log('GET Error:', error);
    }
    
    // Test PUT profile
    console.log('\n2. Testing PUT /api/profile/:address');
    const putResponse = await fetch(`${BASE_URL}/api/profile/${testAddress}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        avatar: '',
        headsImage: '',
        tailsImage: '',
        twitter: '@testuser',
        telegram: '@testuser'
      })
    });
    console.log('PUT Status:', putResponse.status);
    
    if (putResponse.ok) {
      const result = await putResponse.json();
      console.log('PUT Response:', JSON.stringify(result, null, 2));
    } else {
      const error = await putResponse.text();
      console.log('PUT Error:', error);
    }
    
  } catch (error) {
    console.error('Error testing profile endpoints:', error.message);
  }
}

async function testOffersEndpoint() {
  console.log('\nTesting offers endpoint...');
  
  const testAddress = '0x1234567890123456789012345678901234567890';
  
  try {
    console.log('\n3. Testing GET /api/users/:address/offers');
    const response = await fetch(`${BASE_URL}/api/users/${testAddress}/offers`);
    console.log('Offers Status:', response.status);
    
    if (response.ok) {
      const offers = await response.json();
      console.log('Offers Response:', JSON.stringify(offers, null, 2));
    } else {
      const error = await response.text();
      console.log('Offers Error:', error);
    }
    
  } catch (error) {
    console.error('Error testing offers endpoint:', error.message);
  }
}

async function runTests() {
  console.log('Starting API endpoint tests...');
  
  await testProfileEndpoint();
  await testOffersEndpoint();
  
  console.log('\nTests completed!');
}

runTests().catch(console.error); 