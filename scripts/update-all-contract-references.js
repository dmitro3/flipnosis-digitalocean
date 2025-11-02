const fs = require('fs');
const path = require('path');

/**
 * Updates all contract address references throughout the codebase
 * Run this after deploying a new contract
 */
async function main() {
  const newContractAddress = process.argv[2];
  
  if (!newContractAddress || !newContractAddress.startsWith('0x')) {
    console.log('❌ Please provide the new contract address as an argument');
    console.log('Usage: node scripts/update-all-contract-references.js 0xYourNewContractAddress');
    process.exit(1);
  }

  console.log('🔄 Updating all contract address references...');
  console.log(`📍 New Contract Address: ${newContractAddress}`);
  console.log('='.repeat(60));

  const oldAddress = '0xa90abBDE769BC2901A8E68E6C9758B1Cd6699A5F';
  
  const filesToUpdate = [
    {
      path: 'src/services/ContractService.js',
      patterns: [
        /0xa90abBDE769BC2901A8E68E6C9758B1Cd6699A5F/g,
        /contractAddress\s*=\s*['"]0x[a-fA-F0-9]{40}['"]/g
      ],
      description: 'ContractService - Main contract service'
    },
    {
      path: 'src/components/AdminPanel.jsx',
      patterns: [
        /'base':\s*['"]0x[a-fA-F0-9]{40}['"]/g,
        /0xa90abBDE769BC2901A8E68E6C9758B1Cd6699A5F/g
      ],
      description: 'AdminPanel - Contract address for admin panel'
    },
    {
      path: 'server/server.js',
      patterns: [
        /CONTRACT_ADDRESS\s*=\s*process\.env\.CONTRACT_ADDRESS\s*\|\|\s*['"]0x[a-fA-F0-9]{40}['"]/g,
        /0xa90abBDE769BC2901A8E68E6C9758B1Cd6699A5F/g
      ],
      description: 'Server - Server contract configuration'
    },
    {
      path: 'ecosystem.config.js',
      patterns: [
        /CONTRACT_ADDRESS:\s*['"]0x[a-fA-F0-9]{40}['"]/g,
        /0xa90abBDE769BC2901A8E68E6C9758B1Cd6699A5F/g
      ],
      description: 'PM2 Config - Ecosystem config contract address'
    },
    {
      path: 'scripts/update-fee-receiver.js',
      patterns: [
        /const contractAddress = ['"]0x[a-fA-F0-9]{40}['"]/g,
        /0xa90abBDE769BC2901A8E68E6C9758B1Cd6699A5F/g
      ],
      description: 'Update Fee Receiver Script'
    },
    {
      path: 'scripts/check-current-fee-receiver.js',
      patterns: [
        /const contractAddress = ['"]0x[a-fA-F0-9]{40}['"]/g,
        /0xa90abBDE769BC2901A8E68E6C9758B1Cd6699A5F/g
      ],
      description: 'Check Fee Receiver Script'
    },
    {
      path: 'env-template.txt',
      patterns: [
        /CONTRACT_ADDRESS=0x[a-fA-F0-9]{40}/g,
        /0xa90abBDE769BC2901A8E68E6C9758B1Cd6699A5F/g
      ],
      description: 'Environment Template'
    }
  ];

  let updatedCount = 0;
  let errorCount = 0;

  for (const fileInfo of filesToUpdate) {
    const filePath = fileInfo.path;
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚪ Skipping ${filePath} (not found)`);
      continue;
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;
      const originalContent = content;

      for (const pattern of fileInfo.patterns) {
        if (pattern.test(content)) {
          if (pattern.source.includes('contractAddress')) {
            // Handle contractAddress assignment patterns
            content = content.replace(pattern, (match) => {
              return match.replace(/0x[a-fA-F0-9]{40}/, newContractAddress);
            });
          } else {
            // Direct address replacement
            content = content.replace(oldAddress, newContractAddress);
          }
          updated = true;
        }
      }

      if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated: ${fileInfo.description}`);
        updatedCount++;
      } else {
        console.log(`⚪ No changes: ${fileInfo.description}`);
      }
    } catch (error) {
      console.log(`❌ Error updating ${filePath}: ${error.message}`);
      errorCount++;
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(`✅ Updated ${updatedCount} files`);
  if (errorCount > 0) {
    console.log(`❌ ${errorCount} errors`);
  }
  console.log('');
  console.log('📝 Next steps:');
  console.log('1. Update .env file with: CONTRACT_ADDRESS=' + newContractAddress);
  console.log('2. Update server .env file (use update-server-env script)');
  console.log('3. Restart your server');
  console.log('4. Test the application with the new contract');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

