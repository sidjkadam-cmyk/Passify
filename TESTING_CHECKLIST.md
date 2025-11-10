# 🧪 Passify Event Population Testing Guide

## Step-by-Step Testing Process

### **STEP 1: Open Browser Console**
1. Open `http://localhost:8000` in your browser
2. Press **F12** (or Right-click → Inspect → Console tab)
3. **Keep the console open** - you'll see all the logs here

---

### **STEP 2: Connect Wallet**
1. Click **"🔗 Connect MetaMask"**
2. **Check Console** - You should see:
   ```
   ✅ Contract connected! Current event count: 0
   🔄 Loading events...
   📊 Event count from contract: 0
   ℹ️ No events found (eventCount = 0)
   ```
3. **Check UI:**
   - Wallet address appears in input field
   - Button shows "🔗 Connected"
   - Events section shows "No events yet. Create one above."

---

### **STEP 3: Create an Event**
1. Fill in the **"Create Event"** form:
   - **Name:** "Test Event 1"
   - **Date:** Select a future date/time
   - **Price:** `0.01`
   - **Max Supply:** `10`
2. Click **"Create Event"**
3. **MetaMask will pop up** - Click "Confirm"
4. **Watch Console** - You should see:
   ```
   ⏳ Creating event…
   ⏳ Waiting… [transaction hash]…
   ✅ Event created! Refreshing...
   🔄 Refreshing all data...
   🔄 Loading events...
   📊 Event count from contract: 1
   🔍 Loading 1 events...
     Checking event 1...
     Event 1 organizer: 0x[your address]
     ✅ Event 1 loaded: "Test Event 1"
     ✅ Added to dropdown mintEventId
     ✅ Added to dropdown cancelEventId
     ✅ Added to dropdown refundEventId
     ✅ Added to dropdown buyEventId
   ✅ Loaded 1 events out of 1 total
   📋 Dropdown mintEventId has 2 options
   📋 Dropdown cancelEventId has 2 options
   📋 Dropdown refundEventId has 2 options
   📋 Dropdown buyEventId has 2 options
   ✅ Events displayed in UI
   ✅ Refresh complete
   ✅ Event created and loaded!
   ```

---

### **STEP 4: Verify Event Appears**

#### **A) Check Dropdowns**
1. Go to **"🎟️ Mint / Sell Ticket"** card
2. Click the **"Event"** dropdown
3. **Should see:** "1 — Test Event 1"
4. Check other dropdowns:
   - **Cancel Event** dropdown → Should have "1 — Test Event 1"
   - **Refund Event** dropdown → Should have "1 — Test Event 1"
   - **Buy Ticket** dropdown (Attendee tab) → Should have "1 — Test Event 1"

#### **B) Check Events List**
1. Scroll down to **"📚 Events"** section
2. **Should see:** A card showing:
   - "Test Event 1 #1"
   - Date, tickets sold, price, status
   - Organizer address

#### **C) Verify on Etherscan**
1. Copy transaction hash from MetaMask or console
2. Go to: `https://sepolia.etherscan.io/tx/[TRANSACTION_HASH]`
3. **Check:**
   - Status: Success ✅
   - Function: `createEvent(...)`
   - Logs tab → See `EventCreated` event

---

### **STEP 5: Test Manual Refresh**
1. Click **"Refresh"** button in Events section
2. **Check Console:**
   ```
   🔄 Manual refresh triggered
   🔄 Loading events...
   📊 Event count from contract: 1
   ...
   ```
3. **Verify:** Event still appears in all dropdowns

---

### **STEP 6: Create Second Event**
1. Create another event: "Test Event 2"
2. **Check Console:** Should show `eventCount: 2`
3. **Verify:**
   - Both events appear in dropdowns
   - Both events appear in Events list
   - Dropdowns show: "1 — Test Event 1" and "2 — Test Event 2"

---

## 🔍 What to Look For in Console

### **✅ Success Indicators:**
- `✅ Contract connected! Current event count: X`
- `📊 Event count from contract: X` (where X > 0)
- `✅ Event X loaded: "[name]"`
- `✅ Added to dropdown [name]`
- `📋 Dropdown [name] has X options` (should be > 1)
- `✅ Events displayed in UI`

### **❌ Error Indicators:**
- `❌ eventCount() failed` → Contract address wrong or not deployed
- `⚠️ Event X is empty (zero organizer)` → Wrong contract or event doesn't exist
- `⚠️ Dropdown element not found` → HTML structure issue
- `⚠️ No contract connected` → Wallet not connected

---

## 🐛 Troubleshooting

### **Issue: Console shows "eventCount: 0" after creating event**
**Possible causes:**
1. Transaction didn't go through - Check MetaMask for failed transaction
2. Wrong contract address - Verify address in `app.js` line 4
3. Transaction not confirmed yet - Wait a few seconds, click Refresh

**Solution:**
- Check Etherscan for the transaction
- Verify it was sent to the correct contract address
- Wait 5-10 seconds after transaction confirms, then click Refresh

### **Issue: Console shows events found but dropdowns are empty**
**Possible causes:**
1. HTML element IDs don't match
2. JavaScript error preventing dropdown population

**Solution:**
- Check console for errors
- Verify dropdown IDs: `mintEventId`, `cancelEventId`, `refundEventId`, `buyEventId`
- Check if console shows "✅ Added to dropdown" messages

### **Issue: "Contract connected! Current event count: 0" but you know events exist**
**Possible causes:**
1. Wrong contract address
2. Connected to wrong network
3. Contract not deployed at that address

**Solution:**
- Double-check contract address in `app.js`
- Verify you're on Sepolia network
- Check Etherscan: https://sepolia.etherscan.io/address/[YOUR_CONTRACT_ADDRESS]
- Verify contract has `eventCount()` function

---

## ✅ Success Checklist

After creating an event, verify ALL of these:

- [ ] Console shows event was created successfully
- [ ] Console shows "Event count from contract: 1" (or higher)
- [ ] Console shows "✅ Event X loaded: [name]"
- [ ] Console shows "✅ Added to dropdown" for all 4 dropdowns
- [ ] **mintEventId** dropdown shows the event
- [ ] **cancelEventId** dropdown shows the event
- [ ] **refundEventId** dropdown shows the event
- [ ] **buyEventId** dropdown shows the event
- [ ] Events list section shows the event card
- [ ] Event appears on Etherscan transaction logs

---

## 🎯 Quick Test Script

Copy this into browser console after connecting wallet to test manually:

```javascript
// Test contract connection
console.log("Contract address:", CONTRACT_ADDRESS);
console.log("Contract object:", contract);

// Test eventCount
contract.eventCount().then(count => {
  console.log("Current event count:", Number(count));
});

// Test loading events
loadEvents().then(() => {
  console.log("Events loaded!");
});
```

---

**Follow these steps and check the console at each step. The logs will tell you exactly what's happening! 🔍**

