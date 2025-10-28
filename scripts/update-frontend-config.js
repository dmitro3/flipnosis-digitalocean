const fs = require('fs');
const path = require('path');

async function updateFrontendConfig(newContractAddress) {
  console.log('🔄 Updating frontend configuration with new contract address...');
  console.log(`📍 New Contract Address: ${newContractAddress}`);
  
  const filesToUpdate = [
    'src/services/ContractService.js',
    '.env',
    '.env.local',
    'env-template.txt'
  ];
  
  const updates = [];
  
  for (const filePath of filesToUpdate) {
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;
        
        // Update various contract address patterns
        const patterns = [
          /CONTRACT_ADDRESS\s*=\s*["']?0x[a-fA-F0-9]{40}["']?/g,
          /contractAddress\s*:\s*["']?0x[a-fA-F0-9]{40}["']?/g,
          /0xDE5B1D7Aa9913089710184da2Ba6980D661FDedb/g,
          /0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628/g
        ];
        
        for (const pattern of patterns) {
          if (pattern.test(content)) {
            content = content.replace(pattern, (match) => {
              if (match.includes('CONTRACT_ADDRESS') || match.includes('contractAddress')) {
                return match.replace(/0x[a-fA-F0-9]{40}/, newContractAddress);
              }
              return newContractAddress;
            });
            updated = true;
          }
        }
        
        if (updated) {
          fs.writeFileSync(filePath, content);
          updates.push(`✅ Updated ${filePath}`);
        } else {
          updates.push(`⚪ No changes needed in ${filePath}`);
        }
      } catch (error) {
        updates.push(`❌ Error updating ${filePath}: ${error.message}`);
      }
    } else {
      updates.push(`⚪ File not found: ${filePath}`);
    }
  }
  
  // Update package.json if it has contract address
  const packageJsonPath = 'package.json';
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.contractAddress) {
        packageJson.contractAddress = newContractAddress;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        updates.push('✅ Updated package.json');
      }
    } catch (error) {
      updates.push(`❌ Error updating package.json: ${error.message}`);
    }
  }
  
  console.log('\n📋 Update Results:');
  updates.forEach(update => console.log(`   ${update}`));
  
  console.log('\n🎉 Frontend configuration update complete!');
  console.log('💡 Make sure to restart your development server');
  console.log('💡 Test the admin panel with your new wallet');
}

// If called directly with contract address
if (process.argv[2]) {
  updateFrontendConfig(process.argv[2]);
}

module.exports = { updateFrontendConfig };
