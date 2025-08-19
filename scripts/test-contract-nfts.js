import { Alchemy, Network } from 'alchemy-sdk'

const apiKey = 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'
const alchemy = new Alchemy({
  apiKey,
  network: Network.BASE_MAINNET
})

async function testContractNFTs() {
  const contractAddress = '0x6cB1E31F2A3df57A7265ED2eE26dcF8D02CE1B69'
  const walletAddress = '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28'
  
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
    
    // Filter for BASE APE TEAM NFTs
    const baseApeNFTs = walletNFTs.ownedNfts.filter(nft => 
      nft.contract.address.toLowerCase() === '0x035003062428fd92384317d7a853d8b4dff9888a'
    )
    
    if (baseApeNFTs.length > 0) {
      console.log('BASE APE TEAM NFTs in wallet:')
      baseApeNFTs.forEach((nft, index) => {
        console.log(`   ${index + 1}. Token ID: ${nft.tokenId}`)
      })
    }
    
    console.log('')
    
    // 3. Compare the results
    console.log('3️⃣ Comparison:')
    console.log(`Contract has ${contractNFTs.ownedNfts.length} NFTs`)
    console.log(`Wallet has ${baseApeNFTs.length} BASE APE TEAM NFTs`)
    
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
