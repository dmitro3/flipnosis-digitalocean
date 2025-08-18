const WebSocket = require('ws');

// Test WebSocket connections
async function testWebSocketConnections() {
  console.log('🔍 Testing WebSocket connections...');
  
  const urls = [
    'ws://flipnosis.fun',
    'wss://flipnosis.fun',
    'ws://159.69.242.154',
    'wss://159.69.242.154'
  ];
  
  for (const url of urls) {
    console.log(`\n🔌 Testing: ${url}`);
    
    try {
      const ws = new WebSocket(url);
      
      ws.on('open', () => {
        console.log(`✅ Connected to ${url}`);
        
        // Send a test message
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
        
        // Close after 2 seconds
        setTimeout(() => {
          ws.close();
        }, 2000);
      });
      
      ws.on('message', (data) => {
        console.log(`📨 Received: ${data.toString()}`);
      });
      
      ws.on('error', (error) => {
        console.log(`❌ Error connecting to ${url}:`, error.message);
      });
      
      ws.on('close', (code, reason) => {
        console.log(`🔌 Disconnected from ${url}: ${code} - ${reason}`);
      });
      
    } catch (error) {
      console.log(`❌ Failed to create WebSocket for ${url}:`, error.message);
    }
  }
}

testWebSocketConnections();
