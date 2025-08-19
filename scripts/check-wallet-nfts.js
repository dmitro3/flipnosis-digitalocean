import { Alchemy, Network } from 'alchemy-sdk'

const apiKey = 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'
const alchemy = new Alchemy({
  apiKey,
  network: Network.BASE_MAINNET
})

async function checkWalletNFTs() {
  const walletAddress = '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28'
  
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
    
    // Check specifically for BASE APE TEAM NFTs
    const baseApeNFTs = nfts.ownedNfts.filter(nft => 
      nft.contract.address.toLowerCase() === '0x035003062428fd92384317d7a853d8b4dff9888a'
    )
    
    if (baseApeNFTs.length > 0) {
      console.log('🐵 BASE APE TEAM NFTs in wallet:')
      baseApeNFTs.forEach(nft => {
        console.log(`   Token ID: ${nft.tokenId}`)
      })
    } else {
      console.log('🐵 No BASE APE TEAM NFTs found in wallet')
    }
    
  } catch (error) {
    console.error('❌ Error checking wallet NFTs:', error)
  }
}

checkWalletNFTs()
