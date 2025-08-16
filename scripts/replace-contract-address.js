const fs = require('fs');
const path = require('path');

const OLD_CONTRACT_ADDRESS = '0x6527c1e6b12cd0F6d354B15CF7935Dc5516DEcaf';
const NEW_CONTRACT_ADDRESS = '0x6527c1e6b12cd0F6d354B15CF7935Dc5516DEcaf';

// Directories to search
const SEARCH_DIRECTORIES = [
  'src',
  'server',
  'scripts',
  'deployments',
  'cleanup'
];

// Files to search
const SEARCH_FILES = [
  'env-template.txt',
  'SINGLE_SERVER_SETUP.md',
  'setup-159-server.sh'
];

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace the old address with the new one
    content = content.replace(new RegExp(OLD_CONTRACT_ADDRESS, 'g'), NEW_CONTRACT_ADDRESS);
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.log(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    let updatedCount = 0;
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        updatedCount += processDirectory(fullPath);
      } else if (stat.isFile()) {
        // Check if it's a text file we should process
        const ext = path.extname(item).toLowerCase();
        const shouldProcess = [
          '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.sh', '.ps1'
        ].includes(ext) || item.includes('template') || item.includes('setup');
        
        if (shouldProcess) {
          if (replaceInFile(fullPath)) {
            updatedCount++;
          }
        }
      }
    }
    
    return updatedCount;
  } catch (error) {
    console.log(`❌ Error processing directory ${dirPath}:`, error.message);
    return 0;
  }
}

function main() {
  console.log('🔄 Replacing contract addresses...');
  console.log(`Old: ${OLD_CONTRACT_ADDRESS}`);
  console.log(`New: ${NEW_CONTRACT_ADDRESS}`);
  console.log('');
  
  let totalUpdated = 0;
  
  // Process directories
  for (const dir of SEARCH_DIRECTORIES) {
    if (fs.existsSync(dir)) {
      console.log(`📁 Processing directory: ${dir}`);
      totalUpdated += processDirectory(dir);
    }
  }
  
  // Process individual files
  for (const file of SEARCH_FILES) {
    if (fs.existsSync(file)) {
      console.log(`📄 Processing file: ${file}`);
      if (replaceInFile(file)) {
        totalUpdated++;
      }
    }
  }
  
  console.log('');
  console.log(`🎉 Completed! Updated ${totalUpdated} files.`);
  console.log('');
  console.log('📋 Summary of changes:');
  console.log(`  - Old contract address: ${OLD_CONTRACT_ADDRESS}`);
  console.log(`  - New contract address: ${NEW_CONTRACT_ADDRESS}`);
  console.log(`  - Files updated: ${totalUpdated}`);
  console.log('');
  console.log('🔍 The new contract has:');
  console.log('  - 3.5% platform fee (350 basis points)');
  console.log('  - 2-minute deposit timeout');
  console.log('  - Simplified escrow mechanism');
}

main();
