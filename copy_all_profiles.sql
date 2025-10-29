-- Copy all profiles from old database
INSERT OR REPLACE INTO profiles (
  address, name, xp, avatar, headsImage, tailsImage, twitter, telegram,
  xp_name_earned, xp_avatar_earned, xp_twitter_earned, xp_telegram_earned,
  xp_heads_earned, xp_tails_earned
) VALUES 
('0xdd6377919ef1ad4babbead667efe3f6607558628', 'KOda', 750, '', '', '', '', '', 0, 0, 0, 0, 0, 0),
('0xf51d1e69b6857de81432d0d628c45b27dbce97b6', 'Lola', 500, '', '', '', '', '', 0, 0, 0, 0, 0, 0);

