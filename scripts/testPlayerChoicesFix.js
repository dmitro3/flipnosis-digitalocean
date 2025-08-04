const puppeteer = require('puppeteer');

async function testPlayerChoicesFix() {
  console.log('🧪 Testing playerChoices fix...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    console.log('🌐 Loading application...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait a bit for any JavaScript errors to appear
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check for the specific error we're fixing
    const playerChoicesError = errors.find(error => 
      error.includes('playerChoices is not defined')
    );
    
    if (playerChoicesError) {
      console.log('❌ playerChoices error still exists:');
      console.log(playerChoicesError);
      return false;
    } else {
      console.log('✅ No playerChoices errors found!');
      
      // Check for any other critical errors
      const criticalErrors = errors.filter(error => 
        error.includes('ReferenceError') || 
        error.includes('TypeError') ||
        error.includes('SyntaxError')
      );
      
      if (criticalErrors.length > 0) {
        console.log('⚠️ Other critical errors found:');
        criticalErrors.forEach(error => console.log(`  - ${error}`));
      } else {
        console.log('✅ No critical JavaScript errors found!');
      }
      
      return true;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testPlayerChoicesFix()
  .then(success => {
    console.log(success ? '🎉 Test passed!' : '💥 Test failed!');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test error:', error);
    process.exit(1);
  }); 