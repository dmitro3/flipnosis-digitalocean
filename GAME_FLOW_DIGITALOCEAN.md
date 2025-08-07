# 🎮 Game Flow - DigitalOcean Deployment

## 📋 **GAME FLOW OVERVIEW**

This document outlines the complete game flow for the NFT flip game running on DigitalOcean, ensuring all communication and triggers work properly in the server environment.

---

## 🔄 **COMPLETE GAME FLOW**

### Phase 1: Game Creation (Local)
1. **Creator creates game on-chain** (local device)
2. **Pays listing fee** (local device)
3. **Game goes live** with details sent to server
4. **Server stores game data** in managed PostgreSQL database

### Phase 2: Game Discovery (Server)
1. **Player 2 sees game** on homepage (server-rendered)
2. **Makes offer** through server API
3. **Server validates offer** and stores in database
4. **Real-time notification** sent to creator via WebSocket

### Phase 3: Offer Acceptance (Server)
1. **Creator accepts offer** through server
2. **Server pauses all other offers** for this game
3. **Triggers payment stage** for Player 2
4. **2-minute countdown starts** for Player 2 to add crypto

### Phase 4: Payment Processing (Server)
1. **Player 2 adds crypto** within 2-minute window
2. **Server validates payment** on-chain
3. **Both NFT and crypto confirmed** present
4. **Game automatically starts** with countdown

### Phase 5: Game Execution (Server)
1. **Server-side coin rendering** begins
2. **WebSocket streaming** of coin animations
3. **Real-time game updates** to both players
4. **Winner determination** and payout processing

---

## 🔧 **TECHNICAL IMPLEMENTATION**

### Server-Side Components

#### 1. **Game State Management**
```javascript
// Server tracks game states
const gameStates = {
  WAITING_OFFERS: 'waiting_offers',
  OFFER_ACCEPTED: 'offer_accepted',
  WAITING_PAYMENT: 'waiting_payment',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  GAME_STARTED: 'game_started',
  GAME_COMPLETED: 'game_completed'
}
```

#### 2. **WebSocket Communication**
```javascript
// Real-time updates for all game events
ws.send(JSON.stringify({
  type: 'OFFER_MADE',
  gameId: gameId,
  offer: offerData,
  timestamp: Date.now()
}))
```

#### 3. **Countdown Management**
```javascript
// Server-managed countdowns
const countdowns = {
  PAYMENT_TIMEOUT: 120000, // 2 minutes
  ROUND_TIMEOUT: 30000,    // 30 seconds
  GAME_TIMEOUT: 300000     // 5 minutes
}
```

### Database Schema Updates

#### 1. **Enhanced Games Table**
```sql
-- Additional fields for DigitalOcean deployment
ALTER TABLE games ADD COLUMN server_game_id TEXT UNIQUE;
ALTER TABLE games ADD COLUMN payment_deadline TIMESTAMP;
ALTER TABLE games ADD COLUMN offer_accepted_at TIMESTAMP;
ALTER TABLE games ADD COLUMN payment_confirmed_at TIMESTAMP;
ALTER TABLE games ADD COLUMN game_started_at TIMESTAMP;
```

#### 2. **Offers Table**
```sql
CREATE TABLE offers (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_address TEXT NOT NULL,
  offer_amount DECIMAL(20, 8),
  offer_hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id)
);
```

---

## 🚀 **DEPLOYMENT-SPECIFIC FEATURES**

### 1. **Separate Database Persistence**
- **Managed PostgreSQL** separate from application
- **Automatic backups** every 24 hours
- **Data survives** application redeployments
- **SSL connections** for security

### 2. **Server-Side Coin Rendering**
- **Three.js rendering** on server
- **Canvas frame streaming** via WebSocket
- **Consistent animations** across all devices
- **Performance optimization** for 20-30 FPS

### 3. **Real-Time Communication**
- **WebSocket connections** for all game events
- **Automatic reconnection** handling
- **Message queuing** for offline players
- **Rate limiting** to prevent abuse

### 4. **Payment Flow Integration**
- **On-chain validation** for all payments
- **Automatic timeout handling** for payments
- **Escrow management** through smart contract
- **Fee collection** and distribution

---

## 🔄 **COMMUNICATION FLOW**

### 1. **Offer Made**
```
Player 2 → Server API → Database → WebSocket → Creator
```

### 2. **Offer Accepted**
```
Creator → Server API → Database → WebSocket → Player 2
Server → Payment Stage → Countdown Start
```

### 3. **Payment Confirmed**
```
Player 2 → Blockchain → Server API → Database → WebSocket → Both Players
Server → Game Start → Coin Rendering
```

### 4. **Game Progress**
```
Server → Coin Animation → WebSocket → Both Players
Server → Round Results → Database → WebSocket → Both Players
```

### 5. **Game Completion**
```
Server → Winner Determination → Database → WebSocket → Both Players
Server → Payout Processing → Blockchain → Database
```

---

## 🛡️ **SECURITY & VALIDATION**

### 1. **Input Validation**
- **Server-side validation** for all game actions
- **Rate limiting** on all API endpoints
- **Authentication** for all player actions
- **Sanitization** of all user inputs

### 2. **Payment Security**
- **On-chain validation** for all crypto payments
- **Timeout handling** for incomplete payments
- **Escrow verification** before game start
- **Fraud detection** and prevention

### 3. **Game Integrity**
- **Server-side random generation** for coin flips
- **Audit trail** for all game actions
- **Cheat detection** and prevention
- **Fair play enforcement**

---

## 📊 **MONITORING & ANALYTICS**

### 1. **Game Metrics**
- **Active games** count
- **Player engagement** statistics
- **Payment success** rates
- **Game completion** rates

### 2. **Performance Metrics**
- **WebSocket connection** stability
- **Database query** performance
- **Coin rendering** frame rates
- **API response** times

### 3. **Error Tracking**
- **Failed payments** logging
- **WebSocket disconnections** tracking
- **Database errors** monitoring
- **Application crashes** reporting

---

## 🎯 **SUCCESS CRITERIA**

### Technical Requirements
- [ ] **Game creation** works from local devices
- [ ] **Offer system** functions properly
- [ ] **Payment flow** completes successfully
- [ ] **Coin animations** stream smoothly
- [ ] **WebSocket connections** remain stable
- [ ] **Database persistence** works across deployments

### User Experience
- [ ] **Fair gameplay** for all participants
- [ ] **Fast response times** (< 2 seconds)
- [ ] **Smooth animations** (20-30 FPS)
- [ ] **Reliable notifications** for all events
- [ ] **Mobile compatibility** maintained

### Business Requirements
- [ ] **Cost-effective** hosting solution
- [ ] **Scalable** for growth
- [ ] **Secure** payment processing
- [ ] **Professional** infrastructure

---

## 🔧 **IMPLEMENTATION CHECKLIST**

### Phase 1: Infrastructure ✅
- [x] DigitalOcean deployment files created
- [x] Docker configuration ready
- [x] Database schema prepared
- [x] Environment configuration ready

### Phase 2: Game Flow (Next)
- [ ] Update server code for new flow
- [ ] Implement offer acceptance triggers
- [ ] Add payment timeout handling
- [ ] Configure WebSocket communication
- [ ] Test complete game flow

### Phase 3: Optimization (Future)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Monitoring setup
- [ ] Backup automation

---

**🎮 This game flow ensures a fair, secure, and user-friendly experience while taking advantage of DigitalOcean's professional infrastructure and separate database persistence.**
