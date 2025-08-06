const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../server/flipz-clean.db');

console.log('🔧 XP Consistency Check and Fix Script');
console.log('=====================================');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

async function checkAndFixXP() {
  return new Promise((resolve, reject) => {
    console.log('\n📊 Checking profiles for XP consistency...');
    
    db.all(`
      SELECT address, name, avatar, twitter, telegram, headsImage, tailsImage, xp,
             xp_name_earned, xp_avatar_earned, xp_twitter_earned, 
             xp_telegram_earned, xp_heads_earned, xp_tails_earned
      FROM profiles
    `, [], (err, profiles) => {
      if (err) {
        reject(err);
        return;
      }

      console.log(`Found ${profiles.length} profiles to check`);
      
      let fixedCount = 0;
      let totalIssues = 0;

      profiles.forEach((profile, index) => {
        console.log(`\n👤 Profile ${index + 1}: ${profile.address}`);
        
        let issues = [];
        let updates = [];

        // Check name XP
        if (profile.name && profile.name.trim() !== '' && !profile.xp_name_earned) {
          issues.push('Name set but XP not earned');
          updates.push('xp_name_earned = TRUE');
        }

        // Check avatar XP
        if (profile.avatar && profile.avatar.trim() !== '' && !profile.xp_avatar_earned) {
          issues.push('Avatar set but XP not earned');
          updates.push('xp_avatar_earned = TRUE');
        }

        // Check twitter XP
        if (profile.twitter && profile.twitter.trim() !== '' && !profile.xp_twitter_earned) {
          issues.push('Twitter set but XP not earned');
          updates.push('xp_twitter_earned = TRUE');
        }

        // Check telegram XP
        if (profile.telegram && profile.telegram.trim() !== '' && !profile.xp_telegram_earned) {
          issues.push('Telegram set but XP not earned');
          updates.push('xp_telegram_earned = TRUE');
        }

        // Check heads image XP
        if (profile.headsImage && profile.headsImage.trim() !== '' && !profile.xp_heads_earned) {
          issues.push('Heads image set but XP not earned');
          updates.push('xp_heads_earned = TRUE');
        }

        // Check tails image XP
        if (profile.tailsImage && profile.tailsImage.trim() !== '' && !profile.xp_tails_earned) {
          issues.push('Tails image set but XP not earned');
          updates.push('xp_tails_earned = TRUE');
        }

        if (issues.length > 0) {
          totalIssues += issues.length;
          console.log(`  ❌ Issues found: ${issues.join(', ')}`);
          
          // Calculate missing XP
          const missingXP = issues.length * 250;
          const newTotalXP = profile.xp + missingXP;
          
          console.log(`  💰 Adding ${missingXP} XP (${profile.xp} → ${newTotalXP})`);
          
          // Update the profile
          const updateQuery = `
            UPDATE profiles 
            SET ${updates.join(', ')}, xp = ?, updated_at = CURRENT_TIMESTAMP
            WHERE address = ?
          `;
          
          db.run(updateQuery, [newTotalXP, profile.address], function(err) {
            if (err) {
              console.error(`  ❌ Error updating profile:`, err);
            } else {
              console.log(`  ✅ Profile updated successfully`);
              fixedCount++;
            }
          });
        } else {
          console.log(`  ✅ No issues found`);
        }
      });

      setTimeout(() => {
        console.log(`\n🎉 Summary:`);
        console.log(`  - Profiles checked: ${profiles.length}`);
        console.log(`  - Issues found: ${totalIssues}`);
        console.log(`  - Profiles fixed: ${fixedCount}`);
        resolve();
      }, 1000);
    });
  });
}

async function checkGameShares() {
  return new Promise((resolve, reject) => {
    console.log('\n📊 Checking game shares for XP consistency...');
    
    db.all(`
      SELECT game_id, player_address, share_platform, xp_awarded
      FROM game_shares
    `, [], (err, shares) => {
      if (err) {
        reject(err);
        return;
      }

      console.log(`Found ${shares.length} game shares`);
      
      let sharesWithoutXP = shares.filter(share => !share.xp_awarded);
      console.log(`Shares without XP awarded: ${sharesWithoutXP.length}`);
      
      if (sharesWithoutXP.length > 0) {
        console.log('⚠️  Found shares without XP awarded. This is normal for recent shares.');
      }
      
      resolve();
    });
  });
}

async function main() {
  try {
    await checkAndFixXP();
    await checkGameShares();
    
    console.log('\n✅ XP consistency check completed!');
  } catch (error) {
    console.error('❌ Error during XP consistency check:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
      } else {
        console.log('✅ Database connection closed');
      }
      process.exit(0);
    });
  }
}

main(); 