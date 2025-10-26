const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔍 Deep Search of Hetzner Server for All Data...');
console.log('================================================');

async function deepSearch() {
  try {
    // First, let's check what's actually in the profiles tables
    console.log('\n📊 Checking Profile Data Structure...');
    
    const { stdout: profileStructure } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '/opt/flipnosis/app/flipz.db' '.schema profiles' 2>/dev/null || echo 'No profiles table'"`);
    console.log('Profile table structure:');
    console.log(profileStructure);
    
    // Get all data from profiles table
    console.log('\n👥 All Profile Data:');
    const { stdout: allProfileData } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '/opt/flipnosis/app/flipz.db' 'SELECT * FROM profiles;' 2>/dev/null || echo 'No data'"`);
    console.log(allProfileData);
    
    // Check if there are other tables that might contain player data
    console.log('\n📋 All Tables in Main Database:');
    const { stdout: allTables } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '/opt/flipnosis/app/flipz.db' '.tables' 2>/dev/null || echo 'No tables'"`);
    console.log(allTables);
    
    // Check for any tables that might contain player names or addresses
    const tables = allTables.trim().split(/\s+/).filter(t => t.trim());
    console.log(`\n🔍 Checking ${tables.length} tables for player data...`);
    
    for (const table of tables) {
      if (table === 'profiles') continue; // Already checked
      
      try {
        console.log(`\n📊 Checking table: ${table}`);
        const { stdout: tableData } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '/opt/flipnosis/app/flipz.db' 'SELECT * FROM ${table} LIMIT 5;' 2>/dev/null || echo 'No data'"`);
        
        if (tableData.trim() && !tableData.includes('No data')) {
          console.log(`Sample data from ${table}:`);
          console.log(tableData);
          
          // Check if this table has name/address columns
          const { stdout: tableSchema } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '/opt/flipnosis/app/flipz.db' 'PRAGMA table_info(${table});' 2>/dev/null || echo 'No schema'"`);
          console.log(`Schema for ${table}:`);
          console.log(tableSchema);
        }
      } catch (error) {
        console.log(`   Error checking ${table}: ${error.message}`);
      }
    }
    
    // Check the clean database too
    console.log('\n📊 Checking Clean Database...');
    const { stdout: cleanProfileData } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '/opt/flipnosis/shared/flipz-clean.db' 'SELECT * FROM profiles;' 2>/dev/null || echo 'No data'"`);
    console.log('Clean database profiles:');
    console.log(cleanProfileData);
    
    // Search for any files that might contain the player names
    console.log('\n🔍 Searching for files containing player names...');
    const targetPlayers = ['Koda', 'Lola', 'Moba', 'Banana'];
    
    for (const player of targetPlayers) {
      try {
        const { stdout: grepResult } = await execAsync(`ssh root@159.69.242.154 "grep -r -i '${player}' /opt/flipnosis/ 2>/dev/null | head -10 || echo 'Not found'"`);
        if (grepResult.trim() && !grepResult.includes('Not found')) {
          console.log(`\nFound references to ${player}:`);
          console.log(grepResult);
        } else {
          console.log(`❌ No references to ${player} found`);
        }
      } catch (error) {
        console.log(`Error searching for ${player}: ${error.message}`);
      }
    }
    
    // Check if there are any other database files we missed
    console.log('\n🔍 Searching for more database files...');
    const { stdout: moreDbs } = await execAsync(`ssh root@159.69.242.154 "find /opt -name '*.db' -o -name '*.sqlite' -o -name '*.sqlite3' 2>/dev/null | grep -v backup"`);
    console.log('Additional database files:');
    console.log(moreDbs);
    
  } catch (error) {
    console.error('❌ Error in deep search:', error.message);
  }
}

// Run the deep search
deepSearch().catch(console.error);
