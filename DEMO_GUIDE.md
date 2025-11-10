# 🎟️ Passify Demo Guide - Complete Testing Instructions

## 📋 Pre-Demo Checklist

### 1. Setup Requirements
- [ ] MetaMask installed and connected to Sepolia Testnet
- [ ] Sepolia ETH in your wallet (get from [Sepolia Faucet](https://sepoliafaucet.com/))
- [ ] Contract deployed at: `0xE2121972e1903099BfBc683699045dCea124D7f2` (check `web/app.js` line 4)
- [ ] Local server running at `http://localhost:8000`
- [ ] Browser console open (F12) for debugging

### 2. Verify Contract on Etherscan
- Go to: https://sepolia.etherscan.io/address/0xE2121972e1903099BfBc683699045dCea124D7f2
- Verify contract is deployed and verified
- Check "Contract" tab to see source code
- Check "Read Contract" tab to see current state

---

## 🎬 Demo Flow - Step by Step

### **PART 1: Setup & Connection (2 minutes)**

#### Step 1: Connect Wallet
1. Open `http://localhost:8000`
2. Click **"🔗 Connect MetaMask"**
3. **Verify in MetaMask:**
   - Network shows "Sepolia"
   - Your wallet address is displayed
   - Status shows "✅ Connected"

#### Step 2: Verify Network
- **Check MetaMask:** Should show "Sepolia Test Network"
- **Check Browser Console:** No network errors
- **Check UI:** Network status banner should NOT appear (if it does, you're on wrong network)

**🔍 Verification Points:**
- ✅ Wallet address displayed in input field
- ✅ "Connected" button shows connection status
- ✅ No error messages

---

### **PART 2: Organizer Functions (5 minutes)**

#### Step 3: Create an Event
1. Stay on **"Organizer"** tab
2. Fill in **"Create Event"** card:
   - **Name:** "GT TechFest 2025"
   - **Date & Time:** Select a future date/time
   - **Ticket Price:** `0.01` ETH
   - **Max Supply:** `100`
3. Click **"Create Event"**
4. **MetaMask will pop up** - Approve transaction
5. Wait for confirmation

**🔍 Verify on Blockchain:**

**A) MetaMask:**
- Transaction appears in "Activity" tab
- Click transaction → See transaction hash
- Status: "Confirmed" with checkmark

**B) Etherscan:**
- Copy transaction hash from MetaMask
- Go to: `https://sepolia.etherscan.io/tx/[TRANSACTION_HASH]`
- **What to show:**
  - ✅ Status: Success
  - ✅ From: Your wallet address
  - ✅ To: Contract address `0xE2121972e1903099BfBc683699045dCea124D7f2`
  - ✅ Function: `createEvent(...)`
  - ✅ Gas Used: Shows actual gas consumed
  - ✅ Click "Logs" tab → See `EventCreated` event

**C) Remix (Alternative):**
- Go to Remix → Deployed Contracts
- Select your contract
- Call `eventCount()` → Should return `1` (or higher)
- Call `eventsData(1)` → See event details:
  - `name`: "GT TechFest 2025"
  - `date`: Unix timestamp
  - `organizer`: Your address
  - `ticketPrice`: 0.01 ETH (in wei)
  - `maxSupply`: 100
  - `ticketsSold`: 0
  - `canceled`: false

**D) Web App:**
- ✅ Event appears in "📚 Events" section at bottom
- ✅ Event appears in dropdowns (mintEventId, cancelEventId, etc.)
- ✅ Status message: "✅ Event created!"

---

#### Step 4: Mint Ticket (Organizer - Free)
1. In **"🎟️ Mint / Sell Ticket"** card:
   - **Event:** Select "1 — GT TechFest 2025"
   - **Mint To:** Your wallet address (or leave empty for auto-fill)
2. Click **"Mint or Buy Ticket"**
3. **MetaMask:** Approve (should be 0 ETH cost for organizer)
4. Wait for confirmation

**🔍 Verify on Blockchain:**

**A) Etherscan:**
- Transaction shows `mintTicket(1, [your_address])`
- Check "Logs" → See `TicketMinted` event with:
  - `eventId`: 1
  - `tokenId`: 1 (first ticket)
  - `to`: Your address
  - `price`: Ticket price

**B) Remix:**
- Call `totalSupply()` → Should be `1`
- Call `ownerOf(1)` → Should be your address
- Call `ticketToEvent(1)` → Should be `1` (event ID)
- Call `eventsData(1)` → `ticketsSold` should be `1`

**C) Web App:**
- ✅ Go to **"Attendee"** tab → **"🎟️ My Tickets"**
- ✅ Click **"Refresh"**
- ✅ Should show: "#1 — GT TechFest 2025 (Event 1)"
- ✅ Status: "🟢 Unused"

---

#### Step 5: Validate Ticket
1. In **"✅ Validate Ticket"** card:
   - **Token ID:** `1`
2. Click **"Validate"**
3. Approve in MetaMask

**🔍 Verify:**
- **Remix:** Call `used(1)` → Should return `true`
- **Web App:** "My Tickets" shows "✅ Used" for token #1

---

#### Step 6: Cancel Event (Optional)
1. In **"🚫 Cancel / Refund Event"** card:
   - **Event:** Select your event
2. Click **"Cancel Event"**
3. Approve in MetaMask

**🔍 Verify:**
- **Remix:** Call `eventsData(1)` → `canceled` should be `true`
- **Etherscan:** Transaction logs show `EventCanceled` event
- **Web App:** Event shows "🚫 Canceled" status

---

### **PART 3: Attendee Functions (5 minutes)**

#### Step 7: Buy Primary Ticket
1. Switch to **"Attendee"** tab
2. In **"🛒 Buy Ticket"** card:
   - **Event:** Select "1 — GT TechFest 2025" (if not canceled)
   - **Recipient:** Your wallet (or leave empty)
3. Click **"Buy"**
4. **MetaMask:** Approve transaction (will charge ticket price)
5. Wait for confirmation

**🔍 Verify:**
- **MetaMask:** Shows ETH sent (e.g., 0.01 ETH)
- **Etherscan:** Transaction shows `mintTicket(1, [address], {value: 0.01 ETH})`
- **Remix:** 
  - `totalSupply()` increases
  - `ownerOf(2)` = your address (if this is 2nd ticket)
  - `eventsData(1).ticketsSold` increases
- **Web App:** New ticket appears in "My Tickets"

---

#### Step 8: List Ticket for Resale
1. In **"🔁 Resale"** card:
   - **Token ID:** `2` (or any ticket you own)
   - **Price:** `0.011` ETH (must be ≤ 110% of purchase price)
2. Click **"List for Resale"**
3. Approve in MetaMask

**🔍 Verify:**
- **Remix:** Call `isListed(2)` → Should return `true`
- **Remix:** Call `listings(2)` → See:
  - `seller`: Your address
  - `price`: 0.011 ETH (in wei)
  - `active`: true
- **Etherscan:** Transaction logs show `TicketListed` event
- **Web App:** "My Tickets" shows "🔁 Listed" for that ticket

---

#### Step 9: Buy from Resale
1. **Switch to different wallet** (or use different account in MetaMask)
2. In **"🧾 Buy From Resale"** card:
   - **Token ID:** `2` (the listed ticket)
3. Click **"Buy Resale"**
4. **MetaMask:** Approve (will charge resale price, e.g., 0.011 ETH)
5. Wait for confirmation

**🔍 Verify:**
- **Etherscan:** Transaction shows `buyResale(2)` with value
- **Etherscan Logs:** `TicketResold` event with:
  - `from`: Original seller
  - `to`: New buyer
  - `price`: Resale price
- **Remix:**
  - `ownerOf(2)` → Now the buyer's address
  - `listings(2).active` → `false` (no longer listed)
  - `lastPricePaid(2)` → Updated to resale price
- **Web App:** Ticket moves to buyer's "My Tickets"

---

#### Step 10: Refund Event (If Event Canceled)
1. Switch back to **"Organizer"** tab
2. In **"🚫 Cancel / Refund Event"** card:
   - **Event:** Select canceled event
3. Click **"Refund Event"**
4. Approve in MetaMask

**🔍 Verify:**
- **Etherscan:** Transaction shows `refundEvent(1)`
- **Etherscan Logs:** Multiple `TicketRefunded` events (one per ticket)
- **Remix:** 
  - `refunded(1)` → `true` (for each refunded ticket)
  - Check contract balance decreased
- **MetaMask:** Refunded ETH appears in wallet

---

## 🔍 Key Verification Points for Demo

### **1. Blockchain Verification (Etherscan)**
**URL:** `https://sepolia.etherscan.io/address/0xE2121972e1903099BfBc683699045dCea124D7f2`

**What to Show:**
- **Contract Tab:** Source code (if verified)
- **Read Contract Tab:** 
  - `eventCount()` - Number of events
  - `eventsData(1)` - Event details
  - `totalSupply()` - Total tickets minted
  - `ownerOf(1)` - Ticket ownership
- **Write Contract Tab:** All available functions
- **Transactions Tab:** All contract interactions
- **Events Tab:** All emitted events (EventCreated, TicketMinted, etc.)

### **2. Transaction Details (Etherscan)**
For each transaction:
- **Status:** Success ✅
- **From/To:** Wallet addresses
- **Value:** ETH transferred
- **Gas Used:** Efficiency metric
- **Function:** Which contract function was called
- **Logs:** All events emitted
- **Input Data:** Function parameters

### **3. MetaMask Activity**
- **Activity Tab:** All transactions
- **Click any transaction:** See details
- **View on Etherscan:** Direct link to transaction
- **Status:** Pending → Confirmed

### **4. Remix IDE (Alternative Verification)**
**URL:** https://remix.ethereum.org

**Steps:**
1. Go to "Deploy & Run Transactions"
2. Under "Deployed Contracts", add your contract:
   - Address: `0xE2121972e1903099BfBc683699045dCea124D7f2`
   - ABI: Copy from `web/abi.json`
3. Use "Read" functions to check state:
   - `eventCount()` → Number of events
   - `eventsData(1)` → Event details
   - `totalSupply()` → Total tickets
   - `ownerOf(1)` → Ticket owner
   - `isListed(1)` → Resale status
   - `used(1)` → Validation status

---

## 📊 Demo Script - What to Say

### **Introduction (30 seconds)**
"Passify is a decentralized event ticketing platform built on Ethereum. All tickets are NFTs, and all transactions are recorded on the blockchain. Let me show you how it works."

### **Create Event (1 minute)**
"I'm creating an event called GT TechFest. Notice how MetaMask pops up - this is a real blockchain transaction. Let me show you the transaction on Etherscan..."

**Show Etherscan:**
- Transaction hash
- Function called: `createEvent`
- Event emitted: `EventCreated`
- Gas used

### **Mint Ticket (1 minute)**
"As the organizer, I can mint tickets for free. This creates an NFT ticket on the blockchain. Let me verify the ticket was created..."

**Show:**
- Etherscan transaction
- Remix: `totalSupply()` = 1
- Remix: `ownerOf(1)` = your address
- Web app: Ticket appears in "My Tickets"

### **Buy Ticket (1 minute)**
"Now let's buy a ticket. This requires paying ETH. The transaction is recorded on-chain, and I now own an NFT ticket."

**Show:**
- MetaMask: ETH deducted
- Etherscan: Transaction with value
- Web app: New ticket in "My Tickets"

### **Resale (1 minute)**
"Ticket holders can resell their tickets, but there's a price cap at 110% of what they paid. This prevents scalping. Let me list a ticket..."

**Show:**
- Remix: `isListed(2)` = true
- Remix: `listings(2)` shows price
- Etherscan: `TicketListed` event

### **Buy Resale (1 minute)**
"Someone can buy from the resale market. The seller gets the ETH, and the ticket transfers to the buyer."

**Show:**
- Etherscan: `TicketResold` event
- Remix: `ownerOf(2)` changed
- Web app: Ticket moved to buyer

### **Validation (30 seconds)**
"At the event, organizers validate tickets. Once validated, tickets can't be resold again, preventing reuse."

**Show:**
- Remix: `used(1)` = true
- Web app: Shows "✅ Used"

### **Refunds (30 seconds)**
"If an event is canceled, organizers can refund all ticket holders automatically. Each holder gets back what they paid."

**Show:**
- Etherscan: Multiple `TicketRefunded` events
- MetaMask: ETH received

---

## 🐛 Troubleshooting

### **Issue: "ethers is not defined"**
**Solution:** 
- Check browser console (F12)
- Verify script loads: `ethers.umd.min.js`
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### **Issue: Dropdowns not populating**
**Solution:**
- Check browser console for errors
- Click "Refresh" button in Events section
- Verify contract address is correct
- Check network is Sepolia

### **Issue: Transaction fails**
**Solution:**
- Check you have enough Sepolia ETH
- Verify you're on Sepolia network
- Check contract address
- Look at error message in MetaMask

### **Issue: Events not showing**
**Solution:**
- Wait a few seconds after creating (blockchain delay)
- Click "Refresh" in Events section
- Check browser console for errors
- Verify contract address matches deployed contract

---

## 📝 Quick Reference

### **Etherscan Links:**
- **Contract:** https://sepolia.etherscan.io/address/0xE2121972e1903099BfBc683699045dCea124D7f2
- **Format for transactions:** `https://sepolia.etherscan.io/tx/[HASH]`

### **Key Functions to Show in Remix:**
- `eventCount()` - Number of events
- `eventsData(1)` - Event #1 details
- `totalSupply()` - Total tickets minted
- `ownerOf(1)` - Who owns ticket #1
- `ticketToEvent(1)` - Which event ticket #1 belongs to
- `isListed(1)` - Is ticket #1 listed for resale
- `used(1)` - Is ticket #1 validated
- `refunded(1)` - Was ticket #1 refunded

### **Key Events to Show on Etherscan:**
- `EventCreated` - When event is created
- `TicketMinted` - When ticket is minted/purchased
- `TicketListed` - When ticket is listed for resale
- `TicketResold` - When ticket is sold on resale market
- `TicketValidated` - When ticket is validated
- `EventCanceled` - When event is canceled
- `TicketRefunded` - When ticket is refunded

---

## ✅ Demo Checklist

- [ ] Wallet connected to Sepolia
- [ ] Contract address verified on Etherscan
- [ ] Created at least 1 event
- [ ] Minted at least 1 ticket
- [ ] Bought at least 1 ticket
- [ ] Listed a ticket for resale
- [ ] Validated a ticket
- [ ] Showed transaction on Etherscan
- [ ] Showed contract state in Remix (or Etherscan Read Contract)
- [ ] Demonstrated all key features

---

## 🎯 Key Selling Points for Demo

1. **Fully Decentralized:** All data on blockchain, no central server
2. **NFT Tickets:** Each ticket is a unique NFT (ERC721)
3. **Transparent:** All transactions visible on Etherscan
4. **Anti-Scalping:** Resale price cap at 110%
5. **Automatic Refunds:** Smart contract handles refunds
6. **One-Time Use:** Validation prevents ticket reuse
7. **Multi-Event:** One contract handles multiple events

---

**Good luck with your demo! 🚀**

