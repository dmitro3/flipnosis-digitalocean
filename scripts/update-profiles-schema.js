const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function updateProfilesSchema() {
  console.log('🔧 Updating profiles table schema...\n');
  
  const dbPath = '/opt/flipnosis/app/server/flipz.db';
  
  // Connect to the database
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err);
      process.exit(1);
    }
    console.log('✅ Connected to database:', dbPath);
  });

  try {
    // Check current schema
    console.log('📋 Current profiles table schema:');
    const currentSchema = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(profiles)", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    currentSchema.forEach(col => {
      console.log(`  ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });

    // Check which columns are missing
    const expectedColumns = [
      'name',
      'avatar', 
      'headsImage',
      'tailsImage',
      'twitter',
      'telegram',
      'xp',
      'xp_name_earned',
      'xp_avatar_earned',
      'xp_twitter_earned',
      'xp_telegram_earned',
      'xp_heads_earned',
      'xp_tails_earned'
    ];

    const existingColumns = currentSchema.map(col => col.name);
    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));

    console.log('\n🔍 Missing columns:', missingColumns);

    if (missingColumns.length === 0) {
      console.log('✅ All expected columns already exist!');
      return;
    }

    // Add missing columns
    console.log('\n🔧 Adding missing columns...');
    
    for (const column of missingColumns) {
      let columnType = 'TEXT';
      let defaultValue = "''";
      
      if (column === 'xp') {
        columnType = 'INTEGER';
        defaultValue = '0';
      } else if (column.startsWith('xp_') && column.endsWith('_earned')) {
        columnType = 'BOOLEAN';
        defaultValue = 'FALSE';
      }
      
      const alterQuery = `ALTER TABLE profiles ADD COLUMN ${column} ${columnType} DEFAULT ${defaultValue}`;
      
      try {
        await new Promise((resolve, reject) => {
          db.run(alterQuery, [], function(err) {
            if (err) {
              // Column might already exist
              console.log(`⚠️ Column ${column} might already exist:`, err.message);
              resolve();
            } else {
              console.log(`✅ Added column: ${column}`);
              resolve();
            }
          });
        });
      } catch (error) {
        console.log(`⚠️ Error adding column ${column}:`, error.message);
      }
    }

    // Rename existing columns if needed
    console.log('\n🔄 Checking for column renames...');
    
    // Check if username exists and name doesn't
    const hasUsername = existingColumns.includes('username');
    const hasName = existingColumns.includes('name');
    
    if (hasUsername && !hasName) {
      console.log('🔄 Renaming username to name...');
      await new Promise((resolve, reject) => {
        db.run("ALTER TABLE profiles ADD COLUMN name TEXT DEFAULT ''", [], function(err) {
          if (err) {
            console.log('⚠️ Error adding name column:', err.message);
          } else {
            console.log('✅ Added name column');
          }
          resolve();
        });
      });
      
      // Copy data from username to name
      await new Promise((resolve, reject) => {
        db.run("UPDATE profiles SET name = username WHERE name = '' OR name IS NULL", [], function(err) {
          if (err) {
            console.log('⚠️ Error copying username to name:', err.message);
          } else {
            console.log('✅ Copied username data to name');
          }
          resolve();
        });
      });
    }

    // Check if profile_picture exists and avatar doesn't
    const hasProfilePicture = existingColumns.includes('profile_picture');
    const hasAvatar = existingColumns.includes('avatar');
    
    if (hasProfilePicture && !hasAvatar) {
      console.log('🔄 Renaming profile_picture to avatar...');
      await new Promise((resolve, reject) => {
        db.run("ALTER TABLE profiles ADD COLUMN avatar TEXT DEFAULT ''", [], function(err) {
          if (err) {
            console.log('⚠️ Error adding avatar column:', err.message);
          } else {
            console.log('✅ Added avatar column');
          }
          resolve();
        });
      });
      
      // Copy data from profile_picture to avatar
      await new Promise((resolve, reject) => {
        db.run("UPDATE profiles SET avatar = profile_picture WHERE avatar = '' OR avatar IS NULL", [], function(err) {
          if (err) {
            console.log('⚠️ Error copying profile_picture to avatar:', err.message);
          } else {
            console.log('✅ Copied profile_picture data to avatar');
          }
          resolve();
        });
      });
    }

    // Show final schema
    console.log('\n📋 Final profiles table schema:');
    const finalSchema = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(profiles)", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    finalSchema.forEach(col => {
      console.log(`  ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });

    // Show sample data
    console.log('\n📊 Sample profile data:');
    const sampleData = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM profiles LIMIT 1", [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (sampleData) {
      Object.keys(sampleData).forEach(key => {
        console.log(`  ${key}: ${sampleData[key]}`);
      });
    } else {
      console.log('  No profile data found');
    }

    console.log('\n✅ Database schema update completed!');

  } catch (error) {
    console.error('❌ Error updating schema:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('\n✅ Database connection closed');
      }
    });
  }
}

// Run the script
updateProfilesSchema().catch(console.error); 