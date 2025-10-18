Flipnosis Server Recovery Guide
What Went Wrong
The Problem Chain:
Previous Chat 1: Modified server files (xpService.js, api.js, socketio.js) causing server crashes (68+ restarts)
Previous Chat 2: Deployed new code that overwrote existing server files and changed database configuration
Database Mismatch: Server was looking for games in the wrong database file
Process Name Change: PM2 process name changed from "flipnosis" to "flipnosis-app" during deployments
Root Cause:
Multiple deployments overwrote the working configuration, and the server was pointing to an empty database instead of the one containing all the games.
How I Found Your Games
The Key Discovery:
I used a comprehensive search to find ALL database files on your server:
Why This Worked (vs Previous Chats):
Previous chats focused on specific directories - only looked in /root/flipnosis-digitalocean/
This time I searched the ENTIRE server - found databases in /opt/flipnosis/app/
Sorted by file size - the largest database (1.3MB) was your original one
Verified game count - confirmed /opt/flipnosis/app/server/flipz.db had 235 games
The Winning Database:
Location: /opt/flipnosis/app/server/flipz.db
Size: 1.3MB (largest on server)
Games: 235 Battle Royale games
Date: Last updated October 17th (when it was working)
The Fix
Step 1: Found the Original Database
Step 2: Restored the Working Database
Step 3: Restarted Server
Key Lessons
Why Previous Chats Failed:
Limited scope: Only searched in /root/flipnosis-digitalocean/
Assumed wrong location: Didn't check /opt/flipnosis/app/
Database confusion: Multiple databases with similar names
Why This Time Worked:
Comprehensive search: Checked entire server filesystem
Size-based prioritization: Largest database = most data
Verification: Confirmed game count before proceeding
Git restoration: Used working commit from yesterday as baseline
Prevention for Future
Always backup before deployments
Check database locations before changing configurations
Use comprehensive searches when looking for data
Verify file sizes and contents before assuming they're empty
Keep track of process names and configurations
The key was finding that your original database was in /opt/flipnosis/app/server/ not in /root/flipnosis-digitalocean/server/ where the server was looking.