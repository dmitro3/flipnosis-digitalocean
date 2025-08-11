# Flipnosis - Digital Ocean

## 🚀 Quick Deploy

**One command to deploy and backup:**

```powershell
.\deploy-and-backup.ps1 "Your commit message"
```

**Or just deploy (no git backup):**

```powershell
.\deploy-simple.ps1
```

## 📁 Clean Project Structure

- `src/` - React frontend code
- `server/` - Node.js backend
- `digitalocean-deploy/` - Server deployment files
- `contracts/` - Smart contracts
- `scripts/` - Database and utility scripts
- `deploy-and-backup.ps1` - **Main deployment script** (deploy + git backup)
- `deploy-simple.ps1` - Simple deployment only
- `setup-server.ps1` - Initial server setup (run once)

## 🌐 Live Site

- **Domain**: https://flipnosis.fun
- **IP**: http://143.198.166.196

## 📦 Cleanup Folder

Old documentation and unused files moved to `cleanup/` folder for later review.

## ⚡ How It Works

1. **Local Build**: Builds your app locally (no more canvas issues!)
2. **Package**: Creates a tar.gz with everything needed
3. **Upload**: Sends to DigitalOcean server
4. **Deploy**: Extracts, installs, and restarts services
5. **Backup**: Commits and pushes to git (optional)

**No more Docker issues - everything builds locally!**
