const https = require('https');
const http = require('http');
const fs = require('fs');

console.log('🔍 Domain Issue Diagnostic Tool');
console.log('================================');

const domains = [
  '143.198.166.193',
  'www.flipnosis.fun',
  'flipnosis.fun'
];

async function testDomain(domain, useHttps = true) {
  return new Promise((resolve) => {
    const protocol = useHttps ? https : http;
    const url = `${useHttps ? 'https' : 'http'}://${domain}`;
    
    console.log(`\n🌐 Testing: ${url}`);
    
    const startTime = Date.now();
    const req = protocol.get(url, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`  ✅ Status: ${res.statusCode}`);
      console.log(`  ⏱️  Response Time: ${responseTime}ms`);
      console.log(`  📋 Headers:`, {
        'content-type': res.headers['content-type'],
        'content-length': res.headers['content-length'],
        'server': res.headers['server'],
        'x-powered-by': res.headers['x-powered-by']
      });
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`  📄 Content Length: ${data.length} bytes`);
        console.log(`  🔍 First 200 chars: ${data.substring(0, 200)}...`);
        
        // Check for common issues
        if (data.includes('ERR_SSL_PROTOCOL_ERROR')) {
          console.log(`  ❌ SSL Protocol Error detected`);
        }
        if (data.includes('ERR_CONNECTION_REFUSED')) {
          console.log(`  ❌ Connection Refused`);
        }
        if (data.includes('ERR_NAME_NOT_RESOLVED')) {
          console.log(`  ❌ DNS Resolution Error`);
        }
        
        resolve({
          domain,
          statusCode: res.statusCode,
          responseTime,
          contentLength: data.length,
          hasError: data.includes('ERR_')
        });
      });
    });
    
    req.on('error', (err) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      console.log(`  ❌ Error: ${err.message}`);
      console.log(`  ⏱️  Failed after: ${responseTime}ms`);
      resolve({
        domain,
        error: err.message,
        responseTime,
        hasError: true
      });
    });
    
    req.setTimeout(10000, () => {
      console.log(`  ⏰ Timeout after 10 seconds`);
      req.destroy();
      resolve({
        domain,
        error: 'Timeout',
        responseTime: 10000,
        hasError: true
      });
    });
  });
}

async function runDiagnostics() {
  console.log('Starting domain diagnostics...\n');
  
  const results = [];
  
  for (const domain of domains) {
    // Test HTTP first
    const httpResult = await testDomain(domain, false);
    results.push(httpResult);
    
    // Test HTTPS
    const httpsResult = await testDomain(domain, true);
    results.push(httpsResult);
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Summary:');
  console.log('===========');
  
  results.forEach(result => {
    const status = result.hasError ? '❌' : '✅';
    const protocol = result.domain.includes('https') ? 'HTTPS' : 'HTTP';
    console.log(`${status} ${protocol} ${result.domain}: ${result.statusCode || result.error}`);
  });
  
  // Check for specific issues
  const ipResults = results.filter(r => r.domain.includes('143.198.166.193'));
  const domainResults = results.filter(r => r.domain.includes('flipnosis.fun'));
  
  console.log('\n🔍 Analysis:');
  console.log('===========');
  
  if (ipResults.some(r => !r.hasError) && domainResults.some(r => r.hasError)) {
    console.log('❌ Domain-specific issue detected!');
    console.log('   - IP address works fine');
    console.log('   - Domain has problems');
    console.log('\nPossible causes:');
    console.log('1. DNS configuration issue');
    console.log('2. SSL certificate problem');
    console.log('3. Nginx configuration mismatch');
    console.log('4. Domain-specific firewall rules');
  } else if (ipResults.some(r => r.hasError) && domainResults.some(r => r.hasError)) {
    console.log('❌ Server-wide issue detected!');
    console.log('   - Both IP and domain have problems');
  } else {
    console.log('✅ All tests passed successfully');
  }
}

runDiagnostics().catch(console.error);
