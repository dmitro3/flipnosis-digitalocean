# RPC Rate Limit Fixes & React Serialization Improvements

## Issue Analysis

### 1. RPC Rate Limit Problem
**Root Cause:** The application was hitting `HTTP/2 429` rate limit errors from RPC endpoints because:
- Multiple simultaneous calls to `getETHAmount()` during game initialization
- No caching mechanism for ETH price calculations
- No rate limiting between RPC calls
- Free/shared RPC providers have strict rate limits

**Misconception Clarification:** 
- **Chainlink** = Provides data TO smart contracts (decentralized oracle)
- **RPC Endpoints** = Infrastructure for frontend to TALK TO blockchain
- Frontend still needs RPC to call smart contract functions that use Chainlink data

### 2. React Serialization Errors
**Root Cause:** `TypeError: Converting circular structure to JSON` and `Minified React error #31` caused by:
- React internal objects (`stateNode`, `__reactFiber`, `_reactInternalInstance`) being passed to components
- Event objects with circular references
- Insufficient filtering in `safeSerialize` function

## Applied Fixes

### 1. Enhanced React Serialization (`safeSerialize` function)
```javascript
// Added comprehensive checks for React internal objects
if (obj.nativeEvent || obj._reactName || (obj.target && obj.currentTarget) || 
    obj.$$typeof || obj.nodeType || obj.tagName || obj.stateNode || 
    obj._reactInternalInstance || obj.__reactFiber) {
  console.warn('⚠️ Detected event object or React component/internal object, skipping serialization')
  return null
}

// Enhanced property filtering
if (key.startsWith('_') || key.startsWith('__') || typeof value === 'function' || 
    key === 'stateNode' || key === '_reactInternalInstance' || key === '__reactFiber') {
  continue
}
```

### 2. RPC Rate Limiting & Caching
```javascript
// Cache for ETH amounts to reduce RPC calls
const ethAmountCache = useRef(new Map())

// Rate limiting for RPC calls
const lastRpcCall = useRef(0)
const RPC_COOLDOWN = 2000 // 2 seconds between RPC calls

// Cache check before making RPC call
const cacheKey = Math.round(finalPrice * 100)
if (ethAmountCache.current.has(cacheKey) && retryCount === 0) {
  const cachedAmount = ethAmountCache.current.get(cacheKey)
  setEthAmount(cachedAmount)
  return
}

// Rate limiting logic
const now = Date.now()
if (now - lastRpcCall.current < RPC_COOLDOWN && retryCount === 0) {
  await new Promise(resolve => setTimeout(resolve, RPC_COOLDOWN - (now - lastRpcCall.current)))
}
```

## Benefits

### 1. Reduced RPC Calls
- **Caching:** Same price calculations use cached results
- **Rate Limiting:** 2-second cooldown between RPC calls
- **Smart Retries:** Only retry once instead of multiple times

### 2. Improved Error Handling
- **React Objects:** Comprehensive filtering of React internal objects
- **Circular References:** Better detection and handling
- **Fallback Logic:** Graceful degradation when RPC fails

### 3. Better User Experience
- **Faster Loading:** Cached results load instantly
- **Fewer Errors:** Reduced React serialization errors
- **Stable Performance:** Consistent behavior across sessions

## Recommendations for Further Optimization

### 1. RPC Provider Upgrades
- Consider upgrading to paid RPC plans (Alchemy, Infura, etc.)
- Implement RPC provider rotation
- Use backend proxy for RPC calls

### 2. Advanced Caching
- Implement persistent caching (localStorage)
- Add cache expiration logic
- Cache invalidation on price updates

### 3. Monitoring
- Add RPC call metrics
- Monitor rate limit usage
- Alert on excessive failures

## Game Logic Note
The user mentioned new game logic requirements:
- Player 1 chooses heads/tails and flips
- Player 2 automatically gets opposite choice
- Notification system for choice assignment

This will need separate implementation in future updates. 