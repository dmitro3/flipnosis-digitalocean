import { ethers } from 'https://unpkg.com/ethers@5.7.2/dist/ethers.esm.js';
import { showStatus } from './utils.js';
import { getProvider, getUserAddress, isWalletConnected, connectWallet } from './wallet.js';
import { CONTRACT_ADDRESS_ALPHASOCIALCARDS, ABI_ALPHASOCIALCARDS } from './config.js';
import { getDbRef } from './firebase-config.js';
import { 
    fetchOwnedNFTs, 
    getOwnedNFTs, 
    isLoadingCollection, 
    setLoadingCollection, 
    getDescriptionCache, 
    updateDescriptionCache,
    getDefaultCards,
    getValidImageSource,
    loadImageWithIpfsSupport
} from './card-collection.js';

// --- State Variables ---
let collectionSectionElement = null;
let contract = null;
let collectionContainer;
let loadingIndicator;
let isInitialized = false;
const PLACEHOLDER_IMAGE = './images/placeholder.png';

// --- Rate limiting helpers ---
const RETRY_DELAY = 1500; // Base delay in ms
const MAX_RETRIES = 3;    // Maximum number of retries

// IPFS Gateway URLs to try (in order of preference)
const IPFS_GATEWAYS = [
    'https://dweb.link/ipfs/',
    'https://ipfs.cf-ipfs.com/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.ipfs.io/ipfs/',
    'https://ipfs.io/ipfs/'
];

/**
 * Delay execution for a given number of milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after the delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executes a function with retry logic
 * @param {Function} fn - The function to execute
 * @param {number} retries - Number of retries remaining
 * @returns {Promise} The result of the function
 */
async function executeWithRetry(fn, retries = MAX_RETRIES) {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            console.log(`Retrying after error: ${error.message}`);
            await delay(RETRY_DELAY);
            return executeWithRetry(fn, retries - 1);
        }
        throw error;
    }
}

/**
 * Helper function to convert IPFS URLs to use CORS-friendly gateways
 * @param {string} url - Original URL that might be an IPFS URL
 * @returns {string} Converted URL using a CORS-friendly gateway
 */
function convertIpfsUrl(url) {
    if (!url) return PLACEHOLDER_IMAGE;
    
    // Check if it's an IPFS URL
    if (url.startsWith('ipfs://')) {
        const cid = url.replace('ipfs://', '');
        return IPFS_GATEWAYS[0] + cid;
    }
    
    // If it's already using an IPFS gateway but having CORS issues
    for (const gateway of IPFS_GATEWAYS) {
        if (url.includes('/ipfs/')) {
            const cid = url.split('/ipfs/')[1];
            return gateway + cid;
        }
    }
    
    return url;
}

/**
 * Loads the user's NFT collection
 */
async function loadCollection() {
    const userAddress = getUserAddress();
    if (!userAddress) {
        if(collectionContainer) collectionContainer.innerHTML = '<p>Please connect your wallet to view your collection.</p>';
        if(loadingIndicator) loadingIndicator.classList.add('hidden');
        return;
    }

    if(loadingIndicator) loadingIndicator.classList.remove('hidden');
    setLoadingCollection(true);

    try {
        await fetchOwnedNFTs();
        renderCollection();
    } catch (error) {
        console.error('Error loading collection:', error);
        showStatus(`Failed to load your collection: ${error.message}`, 'error');
        if(collectionContainer) collectionContainer.innerHTML = '<p class="status error">Error loading your collection.</p>';
    } finally {
        setLoadingCollection(false);
        if(loadingIndicator) loadingIndicator.classList.add('hidden');
    }
}

/**
 * Retry loading an image with exponential backoff
 * @param {HTMLImageElement} img - The image element
 * @param {string} src - The source URL to try
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} retryCount - Current retry count
 * @param {number} delay - Current delay in ms
 */
function retryImageLoad(img, src, maxRetries = 3, retryCount = 0, delay = 500) {
    if (!img || !src) return;
    
    // Set up error handler for retry
    img.onerror = function() {
        if (retryCount < maxRetries) {
            console.log(`Retrying image load (${retryCount + 1}/${maxRetries}): ${src}`);
            setTimeout(() => {
                // Add a cache-busting parameter to force reload
                const cacheBuster = `?retry=${Date.now()}`;
                img.src = src + cacheBuster;
                retryImageLoad(img, src, maxRetries, retryCount + 1, delay * 2);
            }, delay);
        } else {
            console.warn(`Failed to load image after ${maxRetries} retries: ${src}`);
            // Instead of trying to load another image which might fail, 
            // use createFallbackPlaceholder which creates a data URL directly
            createFallbackPlaceholder();
            img.src = window.FALLBACK_PLACEHOLDER;
            img.onerror = null; // Stop retrying
        }
    };
    
    // Start the load
    img.src = src;
}

/**
 * Renders the owned NFTs in the collection container.
 * @param {boolean} isPartial - Whether this is a partial render during loading
 */
function renderCollection(isPartial = false) {
    if (!collectionContainer) return;
    
    if (!isPartial) {
        collectionContainer.innerHTML = ''; // Only clear previous content on full renders
    }

    const ownedNFTs = getOwnedNFTs();
    if (!ownedNFTs || ownedNFTs.details.length === 0) {
        if (!isLoadingCollection()) {
            collectionContainer.innerHTML = '<p>You do not own any Alpha Social cards yet.</p>';
            
            // Hide selected card display
            const selectedCardDisplay = document.getElementById('selected-card-display');
            if (selectedCardDisplay) {
                selectedCardDisplay.style.display = 'none';
            }
        }
        return;
    }

    // Show selected card display
    const selectedCardDisplay = document.getElementById('selected-card-display');
    if (selectedCardDisplay) {
        selectedCardDisplay.style.display = 'block';
    }

    // Display first card in the selected card area by default (only on first render)
    if (!isPartial || collectionContainer.children.length === 0) {
        displaySelectedCard(ownedNFTs.details[0]);
    }

    // Only render new cards that aren't already displayed
    const existingCardIds = new Set(
        Array.from(collectionContainer.querySelectorAll('.collection-item'))
            .map(el => el.getAttribute('data-token-id'))
    );

    ownedNFTs.details.forEach(nft => {
        // Skip cards we've already rendered
        if (isPartial && existingCardIds.has(nft.id)) {
            return;
        }

        const cardElement = document.createElement('div');
        cardElement.className = 'collection-item card';
        cardElement.setAttribute('data-token-id', nft.id);
        
        // Add a class for default cards
        if (nft.isDefault) {
            cardElement.classList.add('default-card');
        }
        
        // Add click handler to select this card
        cardElement.addEventListener('click', () => {
            displaySelectedCard(nft);
            // Highlight the selected card
            document.querySelectorAll('.collection-item').forEach(el => {
                el.classList.remove('selected');
            });
            cardElement.classList.add('selected');
            // Scroll to top of the page
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        const imageElement = document.createElement('img');
        imageElement.alt = nft.name;
        imageElement.className = 'collection-item-image';
        
        // For preloaded images, use direct URL with retry logic
        if (nft.preLoaded) {
            retryImageLoad(imageElement, nft.image);
        } else {
            // First set a placeholder
            imageElement.src = PLACEHOLDER_IMAGE || './images/placeholder.png';
            // Load the image with our improved IPFS handling
            loadImageWithIpfsSupport(imageElement, nft.image);
        }

        // Add mint number badge directly to the image instead of showing name
        if (nft.mintNumber) {
            const mintBadge = document.createElement('div');
            mintBadge.className = 'mint-number-badge';
            mintBadge.textContent = `#${nft.mintNumber}`;
            cardElement.appendChild(mintBadge);
        }

        cardElement.appendChild(imageElement);
        collectionContainer.appendChild(cardElement);
    });
    
    // Highlight the first card as selected by default (only on first render)
    if (!isPartial || document.querySelector('.collection-item.selected') === null) {
        const firstCard = collectionContainer.querySelector('.collection-item');
        if (firstCard) {
            firstCard.classList.add('selected');
        }
    }
}

/**
 * Display a selected card in the detail view
 */
async function displaySelectedCard(nft) {
    const imageEl = document.getElementById('selected-card-image');
    const nameEl = document.getElementById('selected-card-name');
    const descriptionEl = document.getElementById('selected-card-description');
    const attributesEl = document.getElementById('selected-card-attributes');
    const mintNumberEl = document.getElementById('selected-card-mint-number');
    
    if (!imageEl || !nameEl || !descriptionEl || !attributesEl) {
        console.error('Selected card display elements not found');
        return;
    }
    
    // Update elements with card data
    nameEl.textContent = nft.name;
    
    // For preloaded images, use direct URL with retry logic
    if (nft.preLoaded) {
        retryImageLoad(imageEl, nft.image);
    } else {
        // Set a placeholder while the image loads
        imageEl.src = PLACEHOLDER_IMAGE || './images/placeholder.png';
        // Load the image with our improved image loading
        loadImageWithIpfsSupport(imageEl, nft.image);
    }
    
    // Add a slight floating animation to the image container
    const imageContainer = document.querySelector('.selected-card-image-container');
    if (imageContainer) {
        imageContainer.classList.add('floating');
    }
    
    // Display mint number prominently if available
    if (mintNumberEl) {
        if (nft.mintNumber) {
            mintNumberEl.textContent = `#${nft.mintNumber}`;
            mintNumberEl.style.display = 'block';
        } else {
            mintNumberEl.style.display = 'none';
        }
    }
    
    // Create a mint number display in the details section for better visibility
    const mintNumberDetail = document.getElementById('mint-number-detail') || document.createElement('div');
    mintNumberDetail.id = 'mint-number-detail';
    mintNumberDetail.className = 'mint-number-detail';
    if (nft.mintNumber) {
        mintNumberDetail.textContent = `Mint #${nft.mintNumber}`;
        mintNumberDetail.style.display = 'block';
    } else {
        mintNumberDetail.style.display = 'none';
    }
    
    // Add mint number detail to the details section if it's not already there
    const detailsSection = document.querySelector('.selected-card-details');
    if (detailsSection && !detailsSection.querySelector('#mint-number-detail')) {
        detailsSection.insertBefore(mintNumberDetail, descriptionEl);
    }
    
    // Special handling for Laptop #1 card
    if (nft.name === 'Laptop #1') {
        descriptionEl.innerHTML = '';
        
        // Create PLAY button that flashes red
        const playButton = document.createElement('button');
        playButton.id = 'laptop-play-button';
        playButton.textContent = 'PLAY';
        playButton.className = 'play-button flashing';
        
        // Add CSS for the flashing button
        const style = document.createElement('style');
        style.textContent = `
            .play-button {
                background-color: #000;
                color: #fff;
                border: 2px solid #f00;
                padding: 10px 30px;
                font-size: 24px;
                font-weight: bold;
                cursor: pointer;
                margin: 20px auto;
                display: block;
                border-radius: 5px;
                position: relative;
                overflow: hidden;
                transition: all 0.3s;
            }
            
            .play-button:hover {
                background-color: #300;
                transform: scale(1.05);
            }
            
            .flashing {
                animation: flashRed 1.5s infinite;
            }
            
            @keyframes flashRed {
                0%, 100% { 
                    box-shadow: 0 0 15px #f00;
                    border-color: #f00;
                }
                50% { 
                    box-shadow: 0 0 5px #500;
                    border-color: #900;
                }
            }
            
            .laptop-popup {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                z-index: 1000;
                justify-content: center;
                align-items: center;
            }
            
            .laptop-screen {
                width: 80%;
                max-width: 800px;
                height: 70vh;
                background-color: #000;
                border: 10px solid #333;
                border-radius: 10px;
                position: relative;
                overflow: auto;
                box-shadow: 0 0 30px rgba(0, 0, 255, 0.5);
                padding: 20px;
            }
            
            .close-popup {
                position: absolute;
                top: 10px;
                right: 15px;
                color: #f00;
                font-size: 24px;
                cursor: pointer;
                background: none;
                border: none;
                z-index: 1001;
            }
            
            .typed-text {
                font-family: 'HK Modular', sans-serif;
                color: #00ff9d;
                font-size: 18px;
                line-height: 1.6;
                white-space: pre-wrap;
                text-shadow: 0 0 10px rgba(0, 255, 157, 0.7);
            }
            
            .character-name {
                color: #ff1493;
                font-weight: bold;
                margin-right: 10px;
                text-shadow: 0 0 10px rgba(255, 20, 147, 0.7);
            }
            
            .typing-cursor {
                display: inline-block;
                width: 10px;
                height: 20px;
                background-color: #00ff9d;
                animation: blink 0.7s infinite;
                vertical-align: middle;
            }
            
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // Add play button to description element
        descriptionEl.appendChild(playButton);
        
        // Create the laptop popup structure but don't display it yet
        const popupDiv = document.createElement('div');
        popupDiv.id = 'laptop-popup';
        popupDiv.className = 'laptop-popup';
        
        const laptopScreen = document.createElement('div');
        laptopScreen.className = 'laptop-screen';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-popup';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => {
            popupDiv.style.display = 'none';
        };
        
        const textContainer = document.createElement('div');
        textContainer.id = 'typed-dialogue';
        textContainer.className = 'typed-text';
        
        laptopScreen.appendChild(closeBtn);
        laptopScreen.appendChild(textContainer);
        popupDiv.appendChild(laptopScreen);
        document.body.appendChild(popupDiv);
        
        // Define the dialogue
        const dialogue = [
            { character: "Sticky", text: "This is straightforward AD. You know my terms and we already agreed on a price, so start moving or GTFO." },
            { character: "AD", text: "You're not in a position to make demands." },
            { character: "Sticky", text: "Let me make this clearer. Transfer the ETH to this address in 15 minutes or maybe I'll shift my focus and I'll start looking into you..." },
            { character: "AD", text: "Is that so?" },
            { character: "Sticky", text: "Tik Tok....." },
            { character: "AD", text: "I just sent you a message. Read it..." },
            { character: "Sticky", text: "Who the fuck are you?" },
            { character: "AD", text: "That doesn't matter. The only thing that matters to us now is that you do exactly as you're told. Now send us everything you know about Lauren Ventrelle." }
        ];
        
        // Set up the click handler for the play button
        playButton.onclick = () => {
            popupDiv.style.display = 'flex';
            typeDialogue(dialogue, textContainer);
        };
        
        return; // Skip the normal description loading
    }
    
    // Special handling for Phone #1 card
    if (nft.name === 'Phone #1') {
        descriptionEl.innerHTML = '';
        
        // Create ACCESS VIDEO button that flashes green
        const accessButton = document.createElement('button');
        accessButton.id = 'phone-access-button';
        accessButton.textContent = '1 Saved Message';
        accessButton.className = 'access-button flashing-green';
        
        // Add CSS for the phone video popup
        const style = document.createElement('style');
        style.textContent = `
            .access-button {
                background-color: #000;
                color: #fff;
                border: 2px solid #00ff9d;
                padding: 10px 30px;
                font-size: 24px;
                font-weight: bold;
                cursor: pointer;
                margin: 20px auto;
                display: block;
                border-radius: 5px;
                position: relative;
                overflow: hidden;
                transition: all 0.3s;
            }
            
            .access-button:hover {
                background-color: #003;
                transform: scale(1.05);
            }
            
            .flashing-green {
                animation: flashGreen 1.5s infinite;
            }
            
            @keyframes flashGreen {
                0%, 100% { 
                    box-shadow: 0 0 15px #00ff9d;
                    border-color: #00ff9d;
                }
                50% { 
                    box-shadow: 0 0 5px #005;
                    border-color: #009;
                }
            }
            
            .phone-popup {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                z-index: 1000;
                justify-content: center;
                align-items: center;
            }
            
            .phone-screen {
                width: 900px;
                height: 1500px;
                max-height: 90vh;
                background-color: #000;
                border: 10px solid #333;
                border-radius: 20px;
                position: relative;
                overflow: hidden;
                box-shadow: 0 0 30px rgba(0, 255, 157, 0.5);
                padding: 0;
            }
            
            @media (max-height: 1600px) {
                .phone-screen {
                    height: 90vh;
                    width: calc(90vh * 0.6); /* Maintain aspect ratio */
                }
            }
            
            .close-video {
                position: absolute;
                top: 10px;
                right: 15px;
                color: #00ff9d;
                font-size: 24px;
                cursor: pointer;
                background: none;
                border: none;
                z-index: 1001;
                text-shadow: 0 0 10px rgba(0, 255, 157, 0.7);
            }
            
            .phone-video {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
        `;
        document.head.appendChild(style);
        
        // Add access button to description element
        descriptionEl.appendChild(accessButton);
        
        // Create the phone popup structure but don't display it yet
        const popupDiv = document.createElement('div');
        popupDiv.id = 'phone-popup';
        popupDiv.className = 'phone-popup';
        
        const phoneScreen = document.createElement('div');
        phoneScreen.className = 'phone-screen';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-video';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => {
            popupDiv.style.display = 'none';
            // Pause the video when closing
            const video = phoneScreen.querySelector('video');
            if (video) {
                video.pause();
            }
        };
        
        // Create video element
        const videoElement = document.createElement('video');
        videoElement.className = 'phone-video';
        videoElement.src = 'images/SURPRISE CASSIE.mp4';
        videoElement.controls = true;
        videoElement.loop = true;
        videoElement.muted = false;
        
        phoneScreen.appendChild(closeBtn);
        phoneScreen.appendChild(videoElement);
        popupDiv.appendChild(phoneScreen);
        document.body.appendChild(popupDiv);
        
        // Set up the click handler for the access button
        accessButton.onclick = () => {
            popupDiv.style.display = 'flex';
            // Start playing the video
            videoElement.play().catch(err => {
                console.error('Error playing video:', err);
                // User may need to interact with the video element directly on some browsers
            });
        };
        
        return; // Skip the normal description loading
    }
    
    // Special handling for Camera #1 card
    if (nft.name === 'Camera #1') {
        descriptionEl.innerHTML = '';
        
        // Create ACCESS VIDEO button that flashes red
        const accessButton = document.createElement('button');
        accessButton.id = 'camera-access-button';
        accessButton.textContent = 'Access SD Card';
        accessButton.className = 'access-button flashing-red';
        
        // Add NSFW label
        const nsfwLabel = document.createElement('span');
        nsfwLabel.textContent = '#NSFW';
        nsfwLabel.className = 'nsfw-label';
        accessButton.appendChild(nsfwLabel);
        
        // Add CSS for the video popup
        const style = document.createElement('style');
        style.textContent = `
            .access-button {
                background-color: #000;
                color: #fff;
                border: 2px solid #ff0000;
                padding: 10px 30px;
                font-size: 24px;
                font-weight: bold;
                cursor: pointer;
                margin: 20px auto;
                display: block;
                border-radius: 5px;
                position: relative;
                overflow: hidden;
                transition: all 0.3s;
            }
            
            .access-button:hover {
                background-color: #300;
                transform: scale(1.05);
            }
            
            .flashing-red {
                animation: flashRed 1.5s infinite;
            }
            
            @keyframes flashRed {
                0%, 100% { 
                    box-shadow: 0 0 15px #ff0000;
                    border-color: #ff0000;
                }
                50% { 
                    box-shadow: 0 0 5px #500;
                    border-color: #900;
                }
            }
            
            .nsfw-label {
                font-size: 16px;
                color: #ff0000;
                margin-left: 10px;
                font-weight: bold;
            }
            
            .video-popup {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                z-index: 1000;
                justify-content: center;
                align-items: center;
            }
            
            .video-container {
                width: 900px;
                height: 1500px;
                max-height: 90vh;
                background-color: #000;
                border: 10px solid #333;
                border-radius: 20px;
                position: relative;
                overflow: hidden;
                box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
                padding: 0;
            }
            
            @media (max-height: 1600px) {
                .video-container {
                    height: 90vh;
                    width: calc(90vh * 0.6); /* Maintain aspect ratio */
                }
            }
            
            .close-video {
                position: absolute;
                top: 10px;
                right: 15px;
                color: #ff0000;
                font-size: 24px;
                cursor: pointer;
                background: none;
                border: none;
                z-index: 1001;
                text-shadow: 0 0 10px rgba(255, 0, 0, 0.7);
            }
            
            .camera-video {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
        `;
        document.head.appendChild(style);
        
        // Add access button to description element
        descriptionEl.appendChild(accessButton);
        
        // Create the video popup structure but don't display it yet
        const popupDiv = document.createElement('div');
        popupDiv.id = 'camera-popup';
        popupDiv.className = 'video-popup';
        
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-video';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => {
            popupDiv.style.display = 'none';
            // Pause the video when closing
            const video = videoContainer.querySelector('video');
            if (video) {
                video.pause();
            }
        };
        
        // Create video element
        const videoElement = document.createElement('video');
        videoElement.className = 'camera-video';
        videoElement.src = 'images/Hanks Video.mp4';
        videoElement.controls = true;
        videoElement.loop = true;
        videoElement.muted = false;
        
        videoContainer.appendChild(closeBtn);
        videoContainer.appendChild(videoElement);
        popupDiv.appendChild(videoContainer);
        document.body.appendChild(popupDiv);
        
        // Set up the click handler for the access button
        accessButton.onclick = () => {
            popupDiv.style.display = 'flex';
            // Start playing the video
            videoElement.play().catch(err => {
                console.error('Error playing video:', err);
                // User may need to interact with the video element directly on some browsers
            });
        };
        
        return; // Skip the normal description loading
    }
    
    // Update description - Fetch from Firebase by name
    descriptionEl.innerHTML = '<p>Loading description...</p>';
    try {
        const dbRef = getDbRef();
        const cardsRef = dbRef.child('cards');
        const snapshot = await cardsRef.once('value');
        const cardsData = snapshot.val();
        
        // Find the card by name
        let cardData = null;
        if (cardsData) {
            for (const cardId in cardsData) {
                if (cardsData[cardId].name === nft.name) {
                    cardData = cardsData[cardId];
                    break;
                }
            }
        }
        
        if (cardData && cardData.description) {
            const descriptionText = document.createElement('p');
            descriptionText.textContent = cardData.description;
            descriptionEl.innerHTML = '';
            descriptionEl.appendChild(descriptionText);
        } else {
            console.log('No matching card found in Firebase for:', nft.name);
            descriptionEl.innerHTML = '<p>No description available.</p>';
        }
    } catch (error) {
        console.error('Error fetching description from Firebase:', error);
        descriptionEl.innerHTML = '<p>Error loading description.</p>';
    }
    
    // Update attributes
    attributesEl.innerHTML = '';
    if (nft.attributes && nft.attributes.length > 0) {
        const attrsList = document.createElement('ul');
        nft.attributes.forEach(attr => {
            const li = document.createElement('li');
            li.textContent = `${attr.trait_type || 'Attribute'}: ${attr.value}`;
            attrsList.appendChild(li);
        });
        attributesEl.appendChild(attrsList);
    }
}

/**
 * Initializes the Collection section.
 * @param {HTMLElement} sectionElement - The <section> element for this section.
 * @returns {Function} The cleanup function.
 */
export function init(sectionElement) {
    // Create fallback placeholder immediately
    createFallbackPlaceholder();
    
    // Add background image
    // document.body.style.backgroundImage = "url('images/11.webp')";
    // document.body.style.backgroundSize = "cover";
    // document.body.style.backgroundPosition = "center";
    // document.body.style.backgroundAttachment = "fixed";
    
    // Add semi-transparent overlay for better text visibility
    // const overlay = document.createElement('div');
    // overlay.style.position = 'fixed';
    // overlay.style.top = '0';
    // overlay.style.left = '0';
    // overlay.style.width = '100%';
    // overlay.style.height = '100%';
    // overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    // overlay.style.zIndex = '-1';
    // document.body.appendChild(overlay);
    
    console.log("Initializing Collection Section...");
    collectionSectionElement = sectionElement;

    // Create UI structure if it doesn't exist
    if (!sectionElement.querySelector('#collection-content')) {
        sectionElement.innerHTML = `
            <h2>Your Collection</h2>
            <div id="collection-loading" class="loading-indicator hidden">
                <p>Loading your collection...</p> 
            </div>
            
            <!-- Selected Card Display -->
            <div id="selected-card-display" class="card">
                <div class="selected-card-container">
                    <div class="selected-card-image-container">
                        <img id="selected-card-image" src="./images/placeholder.png" alt="Selected Card">
                        <div id="selected-card-mint-number" class="mint-number-badge"></div>
                    </div>
                    <div class="selected-card-details">
                        <h3 id="selected-card-name">Select a card from your collection</h3>
                        <div id="mint-number-detail" class="mint-number-detail"></div>
                        <div id="selected-card-description" class="selected-card-description">
                            No card selected.
                        </div>
                        <div id="selected-card-attributes" class="selected-card-attributes"></div>
                    </div>
                </div>
            </div>
            
            <h3>Your Collection</h3>
            <div id="collection-content">
                <p>Please connect your wallet to view your collection.</p>
            </div>
            
            <style>
                #collection-content {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                
                .collection-item {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 15px;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                
                .collection-item:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                }
                
                .collection-item.selected {
                    border: 2px solid #ff1493;
                    box-shadow: 0 0 15px rgba(255, 20, 147, 0.5);
                }
                
                .collection-item-image {
                    width: 100%;
                    aspect-ratio: 3/4;
                    object-fit: cover;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.2);
                    background-color: rgba(0,0,0,0.2);
                }
                
                .selected-card-container {
                    display: flex;
                    flex-direction: row;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                @media (max-width: 768px) {
                    .selected-card-container {
                        flex-direction: column;
                    }
                }
                
                .selected-card-image-container {
                    position: relative;
                    flex: 0 0 300px;
                }
                
                /* Floating animation for the main card */
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                
                .floating {
                    animation: float 6s ease-in-out infinite;
                }
                
                #selected-card-image {
                    width: 100%;
                    height: auto;
                    border-radius: 10px;
                    border: 2px solid rgba(255,255,255,0.2);
                    background-color: rgba(0,0,0,0.2);
                }
                
                .selected-card-details {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                .selected-card-description {
                    background-color: rgba(0,0,0,0.6);
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 10px;
                    margin-bottom: 15px;
                    flex: 1;
                    overflow-y: auto;
                    max-height: 300px;
                    line-height: 1.6;
                }
                
                .mint-number-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: linear-gradient(45deg, #ff1493, #00bfff);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-weight: bold;
                    font-size: 14px;
                }
                
                .mint-number-detail {
                    font-size: 1.2em;
                    font-weight: bold;
                    color: #00bfff;
                    margin: 5px 0 10px 0;
                }
                
                .selected-card-attributes ul {
                    list-style: none;
                    padding: 0;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                
                .selected-card-attributes li {
                    background-color: rgba(0,191,255,0.2);
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 0.8em;
                }
                
                .loading-indicator {
                    text-align: center;
                    padding: 20px;
                    font-size: 1.2em;
                }
                
                #selected-card-display {
                    margin-bottom: 30px;
                    display: none; /* Hidden by default, shown when cards are loaded */
                }
                
                /* Fallback placeholder styling */
                .fallback-placeholder {
                    background: linear-gradient(45deg, #ff1493, #00bfff);
                    border-radius: 8px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    font-weight: bold;
                    text-align: center;
                    font-size: 1.2em;
                }
                
                /* Default cards styling */
                .default-card {
                    border: 2px solid rgba(255, 20, 147, 0.5);
                    background-color: rgba(0, 0, 0, 0.3);
                }
            </style>
        `;
    }

    // Get references to UI elements
    collectionContainer = sectionElement.querySelector('#collection-content');
    loadingIndicator = sectionElement.querySelector('#collection-loading');

    // Load the default cards immediately without waiting for wallet connection
    loadDefaultCards();
    
    // Check if wallet is connected and load actual NFTs if it is
    if (isWalletConnected()) {
        refreshCollection();
    }
    // We're not going to add a connect wallet button here since one should already exist in the UI

    // Listen for wallet connection/disconnection
    window.addEventListener('walletConnected', () => {
        refreshCollection();
    });
    
    window.addEventListener('walletDisconnected', () => {
        // When wallet disconnects, just show default cards
        loadDefaultCards();
    });
    
    window.addEventListener('accountChanged', refreshCollection);

    // Return cleanup function
    return () => {
        window.removeEventListener('walletConnected', refreshCollection);
        window.removeEventListener('walletDisconnected', loadDefaultCards);
        window.removeEventListener('accountChanged', refreshCollection);
    };
}

/**
 * Creates a fallback placeholder element and sets window.FALLBACK_PLACEHOLDER
 */
function createFallbackPlaceholder() {
    // If we already created the fallback, just return
    if (window.FALLBACK_PLACEHOLDER) return;
    
    // Create a data URL for a simple colored rectangle
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#ff1493');
    gradient.addColorStop(1, '#00bfff');
    
    // Fill with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Alpha Social', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('Card', canvas.width / 2, canvas.height / 2 + 20);
    
    // Save as data URL and update PLACEHOLDER_IMAGE value
    window.FALLBACK_PLACEHOLDER = canvas.toDataURL('image/png');
}

/**
 * Load default cards that should be shown regardless of wallet connection
 */
function loadDefaultCards() {
    // Show loading state
    setLoadingCollection(true);
    showLoading();
    
    try {
        // Make sure we have a fallback in case the placeholder is missing
        if (window.FALLBACK_PLACEHOLDER === undefined) {
            createFallbackPlaceholder();
        }
        
        // Get default cards - this is now synchronous
        const defaultCards = getDefaultCards();
        
        // Render the collection with the default cards
        if (defaultCards && defaultCards.details.length > 0) {
            renderCollection(false);
        } else {
            // Handle the case where default cards failed to load for some reason
            console.error('Default cards failed to load');
            showStatus('Failed to load default cards', 'error');
        }
    } catch (error) {
        console.error('Error loading default cards:', error);
        showStatus('Error loading default cards', 'error');
    } finally {
        setLoadingCollection(false);
        hideLoading();
    }
}

/**
 * Called when the NFT data is updated
 * @param {Object} nfts - The updated NFTs data
 */
function ownedNFTsUpdated(nfts) {
    // Just render the collection with the updated data
    renderCollection(false);
}

/**
 * Refreshes the NFT collection by fetching the latest data.
 */
async function refreshCollection() {
    if (!isWalletConnected()) {
        console.log('Wallet not connected. Using default cards only.');
        return;
    }

    // Show loading state
    setLoadingCollection(true);
    showLoading();
    
    try {
        // Fetch owned NFTs (includes default cards + user-owned NFTs)
        const nfts = await fetchOwnedNFTs();
        
        if (nfts) {
            ownedNFTsUpdated(nfts);
        } else {
            console.error('Failed to fetch owned NFTs');
            showStatus('Failed to fetch your collection from the blockchain', 'error');
        }
    } catch (error) {
        console.error('Error refreshing collection:', error);
        showStatus(`Error refreshing collection: ${error.message}`, 'error');
    } finally {
        setLoadingCollection(false);
        hideLoading();
    }
}

/**
 * Shows the loading indicator.
 */
function showLoading() {
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
    }
}

/**
 * Hides the loading indicator.
 */
function hideLoading() {
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
    }
}

/**
 * Types out the dialogue with a typewriter effect
 * @param {Array} dialogue - Array of dialogue objects with character and text
 * @param {HTMLElement} container - Element to type the dialogue into
 */
function typeDialogue(dialogue, container) {
    container.innerHTML = '';
    
    let dialogueIndex = 0;
    let charIndex = 0;
    let currentLine = '';
    let typingSpeed = 30; // milliseconds per character
    
    function typeNextChar() {
        if (dialogueIndex >= dialogue.length) {
            // Add final cursor at the end when done
            const cursor = document.createElement('span');
            cursor.className = 'typing-cursor';
            container.appendChild(cursor);
            return;
        }
        
        const currentDialogue = dialogue[dialogueIndex];
        
        // If starting a new line
        if (charIndex === 0) {
            currentLine = document.createElement('div');
            currentLine.className = 'dialogue-line';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'character-name';
            nameSpan.textContent = currentDialogue.character + ':';
            
            const textSpan = document.createElement('span');
            textSpan.className = 'dialogue-text';
            
            currentLine.appendChild(nameSpan);
            currentLine.appendChild(textSpan);
            container.appendChild(currentLine);
            
            // Add some space between dialogue lines
            if (dialogueIndex > 0) {
                currentLine.style.marginTop = '15px';
            }
        }
        
        if (charIndex < currentDialogue.text.length) {
            // Type the next character
            const textSpan = currentLine.querySelector('.dialogue-text');
            textSpan.textContent += currentDialogue.text.charAt(charIndex);
            charIndex++;
            
            // Remove any existing cursor
            const existingCursor = container.querySelector('.typing-cursor');
            if (existingCursor) {
                existingCursor.remove();
            }
            
            // Add cursor at the end
            const cursor = document.createElement('span');
            cursor.className = 'typing-cursor';
            container.appendChild(cursor);
            
            // Scroll to bottom as we type
            container.scrollTop = container.scrollHeight;
            
            // Schedule the next character
            setTimeout(typeNextChar, typingSpeed);
        } else {
            // Move to next dialogue line
            dialogueIndex++;
            charIndex = 0;
            
            // Add a 4-second pause after "I just sent you a text. Read it..."
            if (dialogueIndex === 6) {
                // This is after the text was read (moving from index 5 to 6)
                setTimeout(typeNextChar, 4000); // 4-second pause
            } else {
                // Normal delay between dialogue lines
                setTimeout(typeNextChar, 800);
            }
        }
    }
    
    // Start typing
    typeNextChar();
} 