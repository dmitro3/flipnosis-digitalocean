import { Alchemy, Network } from 'alchemy-sdk'

const apiKey = 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'
const alchemy = new Alchemy({
  apiKey,
  network: Network.BASE_MAINNET
})

async function testContractNFTs() {
  const contractAddress = '0xd76B12D50192492ebB56bD226127eE799658fF0a'
  const walletAddress = '0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628'
  
  console.log('🔍 Testing NFT queries...')
  console.log('========================')
  console.log('Contract Address:', contractAddress)
  console.log('Wallet Address:', walletAddress)
  console.log('')
  
  try {
    // 1. Query contract NFTs directly with Alchemy
    console.log('1️⃣ Querying contract NFTs directly with Alchemy...')
    const contractNFTs = await alchemy.nft.getNftsForOwner(contractAddress)
    console.log(`📦 Contract NFTs found: ${contractNFTs.ownedNfts.length}`)
    
    if (contractNFTs.ownedNfts.length > 0) {
      console.log('Contract NFTs:')
      contractNFTs.ownedNfts.forEach((nft, index) => {
        console.log(`   ${index + 1}. ${nft.title || `NFT #${nft.tokenId}`}`)
        console.log(`      Contract: ${nft.contract.address}`)
        console.log(`      Token ID: ${nft.tokenId}`)
        console.log('')
      })
    }
    
    console.log('')
    
    // 2. Query wallet NFTs directly with Alchemy
    console.log('2️⃣ Querying wallet NFTs directly with Alchemy...')
    const walletNFTs = await alchemy.nft.getNftsForOwner(walletAddress)
    console.log(`📦 Wallet NFTs found: ${walletNFTs.ownedNfts.length}`)
    
    // Show all wallet NFTs (removed hardcoded filter)
    console.log('All NFTs in wallet:')
    walletNFTs.ownedNfts.forEach((nft, index) => {
      console.log(`   ${index + 1}. ${nft.title || `NFT #${nft.tokenId}`} (${nft.contract.address})`)
    })
    
    console.log('')
    
    // 3. Compare the results
    console.log('3️⃣ Comparison:')
    console.log(`Contract has ${contractNFTs.ownedNfts.length} NFTs`)
    console.log(`Wallet has ${walletNFTs.ownedNfts.length} total NFTs`)
    
    if (contractNFTs.ownedNfts.length === 0) {
      console.log('✅ Contract has no NFTs - this is correct after withdrawal')
    } else {
      console.log('⚠️ Contract still has NFTs - check if they were properly withdrawn')
    }
    
  } catch (error) {
    console.error('❌ Error testing NFT queries:', error)
  }
}

testContractNFTs()
