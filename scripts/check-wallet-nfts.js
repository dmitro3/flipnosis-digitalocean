import { Alchemy, Network } from 'alchemy-sdk'

const apiKey = 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'
const alchemy = new Alchemy({
  apiKey,
  network: Network.BASE_MAINNET
})

async function checkWalletNFTs() {
  const walletAddress = '0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628'
  
  console.log('🔍 Checking NFTs in wallet:', walletAddress)
  console.log('========================')
  
  try {
    const nfts = await alchemy.nft.getNftsForOwner(walletAddress)
    
    console.log(`📦 Found ${nfts.ownedNfts.length} NFTs in wallet`)
    console.log('')
    
    nfts.ownedNfts.forEach((nft, index) => {
      console.log(`${index + 1}. ${nft.title || `NFT #${nft.tokenId}`}`)
      console.log(`   Contract: ${nft.contract.address}`)
      console.log(`   Token ID: ${nft.tokenId}`)
      console.log(`   Collection: ${nft.contract.name || 'Unknown'}`)
      console.log('')
    })
    
    // Check for any NFTs (removed hardcoded contract filter)
    console.log('📋 All NFTs in wallet:')
    nfts.ownedNfts.forEach(nft => {
      console.log(`   ${nft.title || `NFT #${nft.tokenId}`} (${nft.contract.address})`)
    })
    
  } catch (error) {
    console.error('❌ Error checking wallet NFTs:', error)
  }
}

checkWalletNFTs()
