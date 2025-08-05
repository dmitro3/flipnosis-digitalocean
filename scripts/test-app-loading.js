const puppeteer = require('puppeteer');

async function testAppLoading() {
  console.log('🧪 Starting application loading test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        console.error(`🚨 Browser Error: ${text}`);
      } else if (type === 'warning') {
        console.warn(`⚠️ Browser Warning: ${text}`);
      } else {
        console.log(`📝 Browser Log: ${text}`);
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.error('🚨 Page Error:', error.message);
    });
    
    // Listen for request failures
    page.on('requestfailed', request => {
      console.error('🚨 Request Failed:', request.url());
    });
    
    console.log('🌐 Navigating to application...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for application to load...');
    await page.waitForTimeout(5000);
    
    // Check if the app loaded successfully
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Check for specific elements
    try {
      await page.waitForSelector('h1', { timeout: 10000 });
      console.log('✅ Main heading found');
    } catch (error) {
      console.error('❌ Main heading not found');
    }
    
    // Check for any error messages
    const errorElements = await page.$$('[class*="error"], [class*="Error"]');
    if (errorElements.length > 0) {
      console.error(`❌ Found ${errorElements.length} error elements`);
    } else {
      console.log('✅ No error elements found');
    }
    
    console.log('✅ Application loading test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testAppLoading().catch(console.error); 