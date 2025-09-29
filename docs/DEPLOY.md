# FLIPNOSIS DEPLOYMENT GUIDE

## Quick Deploy
```powershell
.\deployment\deploy-hetzner-git-fixed.ps1 "your commit message"
.\deployment\check-hetzner-status-fixed.ps1 -ServerIP 159.69.242.154
```

## Server Architecture
- **Production Server**: `159.69.242.154` (Flipnosis App)

## Environment Variables
- `CONTRACT_ADDRESS`: NFT Flip Game contract
- `PRIVATE_KEY`: Contract owner private key
- `RPC_URL`: Base network RPC endpoint
