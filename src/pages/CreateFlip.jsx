import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import NFTSelector from '../components/NFTSelector'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import { PaymentToken } from '../services/ContractService'
import {
  Container,
  ContentWrapper,
  FormContainer,
  FormTitle,
  FormSection,
  SectionTitle,
  NFTPreview,
  NFTImage,
  NFTInfo,
  NFTName,
  NFTCollection,
  SelectNFTButton,
  InputWrapper,
  Input,
  CurrencyLabel,
  RoundsContainer,
  RoundButton,
  SubmitButton,
  ConnectWalletPrompt,
  PromptTitle,
  PromptText,
  Button,
  ErrorMessage,
  LoadingSpinner
} from '../styles/components'

const CreateFlip = () => {
  const navigate = useNavigate()
  const { isConnected, connectEVM, chain, chains, nfts, loading: nftsLoading, listNFT, isListing, listingError } = useWallet()
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false)
  const [priceUSD, setPriceUSD] = useState('')
  const [rounds, setRounds] = useState(3)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateFlip = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (!selectedNFT) {
        throw new Error('Please select an NFT')
      }

      if (!priceUSD || isNaN(priceUSD) || parseFloat(priceUSD) <= 0) {
        throw new Error('Please enter a valid price in USD')
      }

      const result = await listNFT(
        selectedNFT.contractAddress,
        selectedNFT.tokenId,
        parseFloat(priceUSD),
        rounds,
        0 // ETH payment type
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to create flip')
      }

      // Reset form
      setSelectedNFT(null)
      setPriceUSD('')
      setRounds(3)
      setIsNFTSelectorOpen(false)
    } catch (err) {
      console.error('Failed to create flip:', err)
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isConnected) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <ConnectWalletPrompt>
              <PromptTitle>Connect Your Wallet</PromptTitle>
              <PromptText>Please connect your wallet to create a new flip game.</PromptText>
              <Button onClick={connectEVM}>Connect Wallet</Button>
            </ConnectWalletPrompt>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <ContentWrapper>
          <FormContainer>
            <FormTitle>Create New Flip</FormTitle>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {listingError && <ErrorMessage>{listingError}</ErrorMessage>}
            
            <form onSubmit={handleCreateFlip}>
              <FormSection>
                <SectionTitle>Select NFT</SectionTitle>
                {selectedNFT ? (
                  <NFTPreview>
                    <NFTImage src={selectedNFT.image} alt={selectedNFT.name} />
                    <NFTInfo>
                      <NFTName>{selectedNFT.name}</NFTName>
                      <NFTCollection>{selectedNFT.collection}</NFTCollection>
                    </NFTInfo>
                    <Button type="button" onClick={() => setSelectedNFT(null)}>
                      Change
                    </Button>
                  </NFTPreview>
                ) : (
                  <SelectNFTButton type="button" onClick={() => setIsNFTSelectorOpen(true)}>
                    Select NFT to Flip
                  </SelectNFTButton>
                )}
              </FormSection>

              <FormSection>
                <SectionTitle>Set Price</SectionTitle>
                <InputWrapper>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter price in USD"
                    value={priceUSD}
                    onChange={(e) => setPriceUSD(e.target.value)}
                    required
                  />
                  <CurrencyLabel>USD</CurrencyLabel>
                </InputWrapper>
              </FormSection>

              <FormSection>
                <SectionTitle>Number of Rounds</SectionTitle>
                <RoundsContainer>
                  <RoundButton
                    type="button"
                    active={rounds === 3}
                    onClick={() => setRounds(3)}
                  >
                    3 Rounds
                  </RoundButton>
                  <RoundButton
                    type="button"
                    active={rounds === 5}
                    onClick={() => setRounds(5)}
                  >
                    5 Rounds
                  </RoundButton>
                </RoundsContainer>
              </FormSection>

              <SubmitButton type="submit" disabled={isListing || isSubmitting}>
                {isListing || isSubmitting ? (
                  <>
                    <LoadingSpinner /> Creating Flip...
                  </>
                ) : (
                  'Create Flip'
                )}
              </SubmitButton>
            </form>
          </FormContainer>
        </ContentWrapper>

        <NFTSelector
          isOpen={isNFTSelectorOpen}
          onClose={() => setIsNFTSelectorOpen(false)}
          onSelect={setSelectedNFT}
          nfts={nfts || []}
          loading={nftsLoading}
          selectedNFT={selectedNFT}
        />
      </Container>
    </ThemeProvider>
  )
}

export default CreateFlip 