const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔄 Updating contract address in application...");
  console.log("=" .repeat(60));

  // Get the new contract address from the most recent deployment file
  const deploymentsDir = './deployments';
  const files = fs.readdirSync(deploymentsDir)
    .filter(file => file.startsWith('new-contract-deployment-'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log("❌ No new contract deployment files found!");
    console.log("💡 Please deploy a new contract first using:");
    console.log("   npx hardhat run scripts/deploy-new-contract.js --network base");
    return;
  }

  const latestDeploymentFile = path.join(deploymentsDir, files[0]);
  const deploymentInfo = JSON.parse(fs.readFileSync(latestDeploymentFile, 'utf8'));
  const newContractAddress = deploymentInfo.contractAddress;

  console.log(`📍 New Contract Address: ${newContractAddress}`);
  console.log(`📁 From deployment file: ${latestDeploymentFile}`);

  // Files to update
  const filesToUpdate = [
    {
      path: 'src/services/ContractService.js',
      search: "this.contractAddress = '0x415BBd5933EaDc0570403c65114B7c5a1c7FADb7'",
      replace: `this.contractAddress = '${newContractAddress}'`
    },
    {
      path: 'deployments/base-deployment.json',
      search: '"contractAddress": "0xd76B12D50192492ebB56bD226127eE799658fF0a"',
      replace: `"contractAddress": "${newContractAddress}"`
    }
  ];

  let updatedCount = 0;

  for (const fileInfo of filesToUpdate) {
    try {
      if (fs.existsSync(fileInfo.path)) {
        let content = fs.readFileSync(fileInfo.path, 'utf8');
        
        if (content.includes(fileInfo.search)) {
          content = content.replace(fileInfo.search, fileInfo.replace);
          fs.writeFileSync(fileInfo.path, content);
          console.log(`✅ Updated: ${fileInfo.path}`);
          updatedCount++;
        } else {
          console.log(`⚠️  No match found in: ${fileInfo.path}`);
        }
      } else {
        console.log(`⚠️  File not found: ${fileInfo.path}`);
      }
    } catch (error) {
      console.log(`❌ Error updating ${fileInfo.path}:`, error.message);
    }
  }

  console.log(`\n📊 Summary: Updated ${updatedCount} files`);
  
  if (updatedCount > 0) {
    console.log("\n🎉 Contract address update complete!");
    console.log("💡 Your application is now configured to use the new contract.");
    console.log("💡 You can now test the admin panel with your new wallet.");
  } else {
    console.log("\n⚠️  No files were updated. You may need to manually update the contract address.");
  }

  // Show the files that need manual checking
  console.log("\n📝 Files to check manually:");
  console.log("- Any environment files (.env) that might contain the contract address");
  console.log("- Any configuration files that reference the old contract address");
  console.log("- Any documentation that mentions the contract address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
