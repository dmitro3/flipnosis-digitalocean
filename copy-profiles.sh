#!/bin/bash
# Copy player profiles from old database to new database

OLD_DB="/opt/flipnosis/app/database-legacy/backups/flipz_backup_20251026_062501.db"
NEW_DB="/opt/flipnosis/app/server/flipz.db"

echo "Copying profiles from old database to new database..."

# Get all profiles from old database
sqlite3 "$OLD_DB" <<EOF | while IFS='|' read -r address name xp avatar headsImage tailsImage twitter telegram xp_name_earned xp_avatar_earned xp_twitter_earned xp_telegram_earned xp_heads_earned xp_tails_earned; do
  SELECT address, name, xp, avatar, headsImage, tailsImage, twitter, telegram, 
         xp_name_earned, xp_avatar_earned, xp_twitter_earned, xp_telegram_earned, 
         xp_heads_earned, xp_tails_earned 
  FROM profiles;
EOF

  # Insert or update profile in new database
  sqlite3 "$NEW_DB" <<SQL
  INSERT OR REPLACE INTO profiles (
    address, name, xp, avatar, headsImage, tailsImage, twitter, telegram,
    xp_name_earned, xp_avatar_earned, xp_twitter_earned, xp_telegram_earned,
    xp_heads_earned, xp_tails_earned
  ) VALUES (
    '$address', '$name', $xp, '$avatar', '$headsImage', '$tailsImage', '$twitter', '$telegram',
    $xp_name_earned, $xp_avatar_earned, $xp_twitter_earned, $xp_telegram_earned,
    $xp_heads_earned, $xp_tails_earned
  );
SQL

done

echo "Profile copy complete!"


