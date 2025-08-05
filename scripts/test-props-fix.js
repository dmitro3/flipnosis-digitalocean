const puppeteer = require('puppeteer');

async function testPropsFix() {
  console.log('🧪 Testing props error fixes...');
  
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
        // Check if it's a props error
        if (text.includes('props is not defined')) {
          console.error(`❌ Props error still occurring: ${text}`);
        } else if (text.includes('Cannot read properties of null') && text.includes('inpage.js')) {
          console.warn(`⚠️ Chrome extension error (expected): ${text}`);
        } else {
          console.error(`🚨 Other error: ${text}`);
        }
      } else if (type === 'warning') {
        console.warn(`⚠️ Warning: ${text}`);
      } else {
        console.log(`📝 Log: ${text}`);
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      if (error.message.includes('props is not defined')) {
        console.error('❌ Props error detected:', error.message);
      } else if (error.message.includes('Cannot read properties of null') && error.stack.includes('inpage.js')) {
        console.warn('⚠️ Chrome extension error (expected):', error.message);
      } else {
        console.error('🚨 Page error:', error.message);
      }
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
    
    // Check for specific elements that use styled-components
    try {
      await page.waitForSelector('h1', { timeout: 10000 });
      console.log('✅ Main heading found');
    } catch (error) {
      console.error('❌ Main heading not found');
    }
    
    // Check for styled-components elements
    try {
      await page.waitForSelector('[class*="css-"]', { timeout: 10000 });
      console.log('✅ Styled-components detected');
    } catch (error) {
      console.warn('⚠️ No styled-components classes found');
    }
    
    // Check for any error messages
    const errorElements = await page.$$('[class*="error"], [class*="Error"]');
    if (errorElements.length > 0) {
      console.error(`❌ Found ${errorElements.length} error elements`);
    } else {
      console.log('✅ No error elements found');
    }
    
    // Test theme access by checking if styled-components are rendering
    const styledElements = await page.$$('div, button, span');
    console.log(`📊 Found ${styledElements.length} potential styled elements`);
    
    // Check for specific theme colors in computed styles
    const sampleElement = await page.$('h1');
    if (sampleElement) {
      const color = await page.evaluate(el => getComputedStyle(el).color, sampleElement);
      console.log('🎨 Sample element color:', color);
    }
    
    console.log('✅ Props error fix test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testPropsFix().catch(console.error); 