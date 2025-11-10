# 🚀 Passify Demo - Quick Reference Card

## 🔗 Essential Links

**Contract Address:** `0xE2121972e1903099BfBc683699045dCea124D7f2`

**Etherscan Contract:** https://sepolia.etherscan.io/address/0xE2121972e1903099BfBc683699045dCea124D7f2

**Sepolia Faucet:** https://sepoliafaucet.com/

**Remix IDE:** https://remix.ethereum.org

---

## 📱 Demo Flow (5 minutes)

1. **Connect Wallet** → Show MetaMask connection
2. **Create Event** → Show Etherscan transaction
3. **Mint Ticket** → Show Remix `totalSupply()` and `ownerOf(1)`
4. **Buy Ticket** → Show ETH transfer in MetaMask
5. **List Resale** → Show Remix `isListed(2)` = true
6. **Buy Resale** → Show `TicketResold` event on Etherscan
7. **Validate** → Show Remix `used(1)` = true

---

## 🔍 Where to Verify Each Action

### **Create Event**
- **Etherscan:** Transaction → Logs → `EventCreated` event
- **Remix:** `eventCount()` → Increases
- **Remix:** `eventsData(1)` → See event details

### **Mint/Buy Ticket**
- **Etherscan:** Transaction → Logs → `TicketMinted` event
- **Remix:** `totalSupply()` → Increases
- **Remix:** `ownerOf(tokenId)` → Your address
- **Web App:** "My Tickets" section

### **List for Resale**
- **Etherscan:** Transaction → Logs → `TicketListed` event
- **Remix:** `isListed(tokenId)` → `true`
- **Remix:** `listings(tokenId)` → See price

### **Buy Resale**
- **Etherscan:** Transaction → Logs → `TicketResold` event
- **Remix:** `ownerOf(tokenId)` → Changed to buyer
- **Remix:** `listings(tokenId).active` → `false`

### **Validate Ticket**
- **Etherscan:** Transaction → Logs → `TicketValidated` event
- **Remix:** `used(tokenId)` → `true`
- **Web App:** Shows "✅ Used"

### **Cancel Event**
- **Etherscan:** Transaction → Logs → `EventCanceled` event
- **Remix:** `eventsData(eventId).canceled` → `true`

### **Refund Event**
- **Etherscan:** Transaction → Logs → Multiple `TicketRefunded` events
- **Remix:** `refunded(tokenId)` → `true` for each ticket
- **MetaMask:** ETH received in wallet

---

## 💡 Key Talking Points

1. **"All transactions are on-chain"** → Show Etherscan
2. **"Tickets are NFTs"** → Show `ownerOf()` in Remix
3. **"Transparent and verifiable"** → Show contract state
4. **"Anti-scalping protection"** → Show resale cap (110%)
5. **"One-time use"** → Show validation prevents reuse
6. **"Automatic refunds"** → Show refund function

---

## 🎯 What to Show on Etherscan

1. **Contract Page:**
   - Read Contract tab → Show `eventCount()`, `totalSupply()`
   - Transactions tab → All interactions
   - Events tab → All emitted events

2. **Transaction Page:**
   - Status: Success ✅
   - Function called
   - Gas used
   - Logs → Events emitted
   - Input data → Function parameters

---

## ⚡ Quick Troubleshooting

- **No events showing?** → Click "Refresh" button
- **Transaction fails?** → Check Sepolia ETH balance
- **Wrong network?** → Switch to Sepolia in MetaMask
- **Dropdowns empty?** → Refresh page, check console

---

**Keep this open during your demo! 📋**

