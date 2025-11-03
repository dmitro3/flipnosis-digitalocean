# Solana Implementation Plan - Following EVM Architecture

## 🎯 Your Vision (Perfectly Doable)

**EVM First → Solana Second**

Users connect wallet at top → System detects chain → Routes to correct contract → Same gameplay, different backend.

---

## 🏗️ Architecture Pattern (Smart Wrapper Approach)

### **Current Structure:**
```
User → WalletContext (Rainbow Kit) → ContractService → EVM Contract
```

### **New Structure:**
```
User → WalletSelector (Choose Chain)
     ├→ EVM → Rainbow Kit → ContractService → EVM Contract
     └→ Solana → Phantom → SolanaService → Solana Program
```

---

## 📦 Implementation Overview

### **Phase 1: Infrastructure Setup** (Days 1-3)

**1.1: Create Unified Contract Service**
```javascript
// src/services/UnifiedContractService.js
class UnifiedContractService {
  constructor() {
    this.chainType = null // 'evm' or 'solana'
    this.evmService = null
    this.solanaService = null
  }
  
  // Detect which chain user is on
  async initialize(context) {
    if (context.chainType === 'evm') {
      this.chainType = 'evm'
      this.evmService = contractService // Your existing service
      await this.evmService.initialize(context.evmWallet, context.evmPublic)
    } else if (context.chainType === 'solana') {
      this.chainType = 'solana'
      this.solanaService = new SolanaContractService()
      await this.solanaService.initialize(context.solanaWallet)
    }
  }
  
  // All your game functions route automatically
  async depositNFT(gameId, nftContract, tokenId) {
    if (this.chainType === 'evm') {
      return this.evmService.depositNFT(gameId, nftContract, tokenId)
    } else {
      return this.solanaService.depositNFT(gameId, nftMint)
    }
  }
  
  // Same for ALL functions
  async createBattleRoyale(...)
  async joinBattleRoyale(...)
  async withdrawWinnerNFT(...)
  // etc.
}
```

**1.2: Chain Selector UI**
```javascript
// src/components/ChainSelector.jsx
<ChainSelector>
  <EVMChainButton onClick={handleEVMSelect}>
    EVM Chains (Base, Ethereum, etc.)
  </EVMChainButton>
  <SolanaChainButton onClick={handleSolanaSelect}>
    Solana
  </SolanaChainButton>
</ChainSelector>
```

**1.3: Solana Wallet Setup**
```javascript
// src/contexts/SolanaWalletContext.jsx
import { useWallet, ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'

function SolanaWalletContext({ children }) {
  const network = WalletAdapterNetwork.Mainnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      // Add more Solana wallets if needed
    ],
    []
  )
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
```

---

### **Phase 2: Solana Service Layer** (Days 4-7)

**2.1: Create SolanaContractService.js**

Following your EVM structure:

```javascript
// src/services/SolanaContractService.js
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { WalletContext } from '@solana/wallet-adapter-react'

class SolanaContractService {
  constructor() {
    this.program = null
    this.wallet = null
    this.connection = null
    this.programId = null // Your deployed program ID
    
    // Mirror your ContractService structure
    this.contractAddresses = {
      mainnet: 'YourProgramIdHere'
    }
  }
  
  async initialize(wallet) {
    this.wallet = wallet
    this.connection = new Connection(clusterApiUrl('mainnet-beta'))
    
    // Initialize Anchor program
    const provider = new AnchorProvider(
      this.connection,
      wallet,
      { commitment: 'confirmed' }
    )
    
    // Load IDL (like ABI for Solana)
    const idl = await fetch('/path/to/your-program-idl.json')
    this.program = new Program(JSON.parse(await idl.text()), provider)
    
    console.log('✅ Solana service initialized')
  }
  
  // Mirror your EVM functions
  
  async depositNFT(gameId, nftMint) {
    // Convert bytes32 gameId to Solana format
    const gameSeed = this.generateGameSeed(gameId)
    
    // Find PDA for this game
    const [gamePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('game'), Buffer.from(gameSeed)],
      this.program.programId
    )
    
    // Build transaction
    const tx = await this.program.methods
      .depositNft(gameSeed)
      .accounts({
        depositor: this.wallet.publicKey,
        gameAccount: gamePDA,
        nftMint: new PublicKey(nftMint),
        // ... other accounts
      })
      .rpc()
    
    return { success: true, transactionHash: tx }
  }
  
  async createBattleRoyale(gameId, nftMint, entryFee, serviceFee, isUnder20, minUnder20Lamports, creatorParticipates) {
    const gameSeed = this.generateGameSeed(gameId)
    
    const tx = await this.program.methods
      .createBattleRoyale(
        gameSeed,
        entryFee,
        serviceFee,
        isUnder20,
        minUnder20Lamports,
        creatorParticipates
      )
      .accounts({
        creator: this.wallet.publicKey,
        nftMint: new PublicKey(nftMint),
        // ... other accounts
      })
      .rpc()
    
    return { success: true, transactionHash: tx }
  }
  
  async joinBattleRoyale(gameId) {
    const gameSeed = this.generateGameSeed(gameId)
    
    // Similar pattern...
  }
  
  // Helper to convert EVM bytes32 to Solana format
  generateGameSeed(bytes32String) {
    // Remove 0x prefix if present
    const hex = bytes32String.startsWith('0x') 
      ? bytes32String.slice(2) 
      : bytes32String
    
    return Buffer.from(hex, 'hex')
  }
}
```

---

### **Phase 3: Solana Contract (Rust/Anchor)** (Days 8-12)

**Following your EVM contract structure:**

```rust
// contracts/solana/NFTFlipGame.sol (but in Rust)

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

declare_id!("YourProgramIdHere");

#[program]
pub mod nft_flip_game {
    use super::*;

    // ===== GAME DEPOSIT FUNCTIONS =====
    
    pub fn deposit_nft(ctx: Context<DepositNft>, game_seed: [u8; 32]) -> Result<()> {
        let game_account = &mut ctx.accounts.game_account;
        let clock = Clock::get()?;
        
        // Verify NFT transfer (Metaplex standard)
        // ... transfer logic
        
        // Store deposit info
        game_account.nft_mint = ctx.accounts.nft_mint.key();
        game_account.depositor = ctx.accounts.depositor.key();
        game_account.claimed = false;
        game_account.deposit_time = clock.unix_timestamp;
        
        msg!("NFT deposited for game {:?}", game_seed);
        Ok(())
    }
    
    pub fn deposit_sol(ctx: Context<DepositSol>, game_seed: [u8; 32], amount: u64) -> Result<()> {
        let game_account = &mut ctx.accounts.game_account;
        
        // Transfer SOL (similar to ETH)
        // ... transfer logic
        
        game_account.sol_amount = amount;
        game_account.depositor = ctx.accounts.depositor.key();
        game_account.claimed = false;
        
        msg!("SOL deposited for game {:?}", game_seed);
        Ok(())
    }
    
    pub fn deposit_usdc(ctx: Context<DepositUsdc>, game_seed: [u8; 32], amount: u64) -> Result<()> {
        let game_account = &mut ctx.accounts.game_account;
        
        // Transfer USDC (same as EVM)
        // ... transfer logic
        
        game_account.usdc_amount = amount;
        game_account.depositor = ctx.accounts.depositor.key();
        game_account.claimed = false;
        
        msg!("USDC deposited for game {:?}", game_seed);
        Ok(())
    }

    // ===== BATTLE ROYALE FUNCTIONS =====
    
    pub fn create_battle_royale(
        ctx: Context<CreateBattleRoyale>,
        game_seed: [u8; 32],
        entry_fee: u64,
        service_fee: u64,
        is_under_20: bool,
        min_under_20_lamports: u64,
        creator_participates: bool
    ) -> Result<()> {
        let br_game = &mut ctx.accounts.battle_royale_game;
        let clock = Clock::get()?;
        
        // Initialize game state
        br_game.creator = ctx.accounts.creator.key();
        br_game.nft_mint = ctx.accounts.nft_mint.key();
        br_game.entry_fee = entry_fee;
        br_game.service_fee = service_fee;
        br_game.max_players = 4;
        br_game.current_players = if creator_participates { 1 } else { 0 };
        br_game.completed = false;
        br_game.creator_paid = false;
        br_game.nft_claimed = false;
        br_game.total_pool = 0;
        br_game.created_at = clock.unix_timestamp;
        br_game.is_under_20 = is_under_20;
        br_game.min_under_20_lamports = min_under_20_lamports;
        
        msg!("Battle Royale created for game {:?}", game_seed);
        Ok(())
    }
    
    pub fn join_battle_royale(ctx: Context<JoinBattleRoyale>, game_seed: [u8; 32]) -> Result<()> {
        let br_game = &mut ctx.accounts.battle_royale_game;
        
        require!(!br_game.completed, CustomError::GameCompleted);
        require!(br_game.current_players < br_game.max_players, CustomError::GameFull);
        
        // Process entry fee + service fee
        // ...
        
        br_game.current_players += 1;
        br_game.total_pool += br_game.entry_fee;
        
        msg!("Player joined Battle Royale {:?}", game_seed);
        Ok(())
    }
    
    pub fn complete_battle_royale(
        ctx: Context<CompleteBattleRoyale>,
        game_seed: [u8; 32],
        winner: Pubkey
    ) -> Result<()> {
        // Only owner/backend can call (using PDA authority)
        require!(
            ctx.accounts.authority.key() == ctx.program_id,
            CustomError::Unauthorized
        );
        
        let br_game = &mut ctx.accounts.battle_royale_game;
        br_game.winner = winner;
        br_game.completed = true;
        
        msg!("Battle Royale completed, winner: {}", winner);
        Ok(())
    }
    
    pub fn withdraw_winner_nft(ctx: Context<WithdrawWinnerNft>, game_seed: [u8; 32]) -> Result<()> {
        let br_game = &ctx.accounts.battle_royale_game;
        let winner = ctx.accounts.winner.key();
        
        require!(br_game.completed, CustomError::GameNotCompleted);
        require!(br_game.winner == winner, CustomError::NotWinner);
        require!(!br_game.nft_claimed, CustomError::AlreadyClaimed);
        
        // Transfer NFT to winner
        // ... transfer logic
        
        msg!("Winner withdrew NFT");
        Ok(())
    }
    
    // ... All your other functions mirrored

    // ===== ADMIN FUNCTIONS =====
    // Mirror your emergency withdraw functions, etc.
}

// Account structures (like your structs in Solidity)
#[account]
pub struct GameAccount {
    pub nft_mint: Pubkey,
    pub depositor: Pubkey,
    pub claimed: bool,
    pub deposit_time: i64,
}

#[account]
pub struct BattleRoyaleGame {
    pub creator: Pubkey,
    pub nft_mint: Pubkey,
    pub entry_fee: u64,
    pub service_fee: u64,
    pub max_players: u8,
    pub current_players: u8,
    pub winner: Pubkey,
    pub completed: bool,
    pub creator_paid: bool,
    pub nft_claimed: bool,
    pub total_pool: u64,
    pub created_at: i64,
    pub is_under_20: bool,
    pub min_under_20_lamports: u64,
}

// Contexts (like your function parameters)
#[derive(Accounts)]
pub struct DepositNft<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    
    #[account(
        init_if_needed,
        payer = depositor,
        space = 8 + GameAccount::LEN,
        seeds = [b"game", game_seed.as_ref()],
        bump
    )]
    pub game_account: Account<'info, GameAccount>,
    
    pub nft_mint: Account<'info, Mint>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}
```

---

### **Phase 4: Testing & Integration** (Days 13-15)

**4.1: Test Each Function**
- Mirror your EVM test cases
- Use Solana local validator for local testing
- Mainnet deployment

**4.2: NFT Integration**
```javascript
// Handle Metaplex NFTs
async fetchSolanaNFTs(walletAddress) {
  // Use Metaplex to fetch NFTs
  const nfts = await metaplex.nfts().findAllByOwner(new PublicKey(walletAddress))
  return nfts
}
```

**4.3: Game State Sync**
- Make sure your Socket.io logic works with Solana
- Events from Solana program → Frontend updates

---

## 🎮 User Experience Flow

### **EVM Game:**
1. User connects MetaMask/Rainbow Kit
2. Selects "EVM Chains" 
3. Picks chain (Base, Ethereum, etc.)
4. Creates/joins game
5. Everything works as it does now ✅

### **Solana Game:**
1. User selects "Solana" tab
2. Connects Phantom wallet
3. Approves if needed
4. Same game UI, but backed by Solana
5. Uses their Solana NFTs

**Your game code doesn't change!** The wrapper handles routing.

---

## 📊 Timeline Reality Check

| Phase | My Time | Your Time | Status |
|-------|---------|-----------|--------|
| Phase 1: Setup | 3 days | 0 | I do it |
| Phase 2: Solana Service | 4 days | 0 | I do it |
| Phase 3: Rust Contract | 5 days | 0 | I do it |
| Phase 4: Testing | 3 days | 0 | I do it |
| **TOTAL** | **15 days** | **0** | **Doable** |

---

## ✅ Why This Works

**1. Clear separation**
- EVM code stays EVM
- Solana code stays Solana
- Wrapper connects them

**2. No refactors**
- Your game logic unchanged
- UI unchanged
- Just add routing

**3. Familiar patterns**
- Solana service mirrors EVM service
- Rust contract mirrors Solidity contract
- Same concepts, different syntax

**4. Tested in isolation**
- Deploy Solana separately
- Test each chain independently
- Debug without breaking other chains

---

## 🚦 Conclusion

**Yes, absolutely doable and not a pain!**

You have:
- ✅ Clear architecture to follow (your EVM code)
- ✅ Phantom wallet requirement (simple)
- ✅ Chain separation at UI level (clean UX)
- ✅ Someone doing the coding (me 😊)

**The key insight:** You're not rewriting your game. You're **extending** it with a parallel Solana backend. Same game, different blockchain.

**Ready when you are!** 🚀


