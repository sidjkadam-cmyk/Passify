# 🎟️ Passify - Decentralized NFT Event Ticketing Platform

**Decentralized NFT Event Ticketing with Resale & Refunds**

Passify is a blockchain-based event ticketing platform built on Ethereum (Sepolia Testnet) that transforms event tickets into NFTs. Organizers can create events, mint tickets, and manage refunds, while attendees can buy, resell, and validate tickets on the blockchain.

![Passify Logo](./web/Passifylogo.svg)

## ✨ Features

### For Organizers
- **Create Events** - Set up events with custom pricing and supply
- **Mint Tickets** - Free minting for organizers, paid purchases for attendees
- **Validate Tickets** - One-time validation to prevent reuse
- **Cancel & Refund** - Cancel events and automatically refund ticket holders from escrow

### For Attendees
- **Buy Tickets** - Purchase NFT tickets directly on-chain
- **Resell Tickets** - List tickets for resale with price caps (110% of purchase price)
- **Buy Resale** - Browse and purchase tickets from other attendees
- **View My Tickets** - See all owned tickets with status indicators

## 🏗️ Architecture

- **Smart Contract**: Solidity (^0.8.20) using OpenZeppelin contracts
- **Frontend**: Vanilla JavaScript with Ethers.js
- **Network**: Ethereum Sepolia Testnet
- **Token Standard**: ERC721Enumerable (NFT tickets)

## 📋 Prerequisites

- [MetaMask](https://metamask.io/) browser extension
- Sepolia Testnet ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/))
- Node.js (for local development server)
- Python 3 (for simple HTTP server)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/Passify.git
cd Passify
```

### 2. Deploy the Smart Contract

1. Open [Remix IDE](https://remix.ethereum.org/)
2. Copy `contracs/Passify.sol` into Remix
3. Compile the contract (Solidity ^0.8.20)
4. Deploy to Sepolia Testnet with constructor parameter: `""` (empty string for baseURI)
5. Copy the deployed contract address

### 3. Update Contract Address

Edit `web/app.js` line 4:
```javascript
let CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
```

### 4. Update ABI

Copy the ABI from Remix after compilation and paste it into `web/abi.json`

### 5. Start Local Server

```bash
cd web
python3 -m http.server 8000
```

### 6. Open in Browser

Navigate to `http://localhost:8000` and connect your MetaMask wallet.

## 📁 Project Structure

```
Passify/
├── contracs/
│   └── Passify.sol          # Main smart contract
├── web/
│   ├── index.html           # Frontend HTML
│   ├── app.js               # Frontend JavaScript logic
│   ├── style.css            # Styling
│   ├── abi.json             # Contract ABI
│   └── Passifylogo.svg      # Logo
├── assets/
│   └── Passifylogo.png      # Logo (PNG version)
├── DEMO_GUIDE.md            # Comprehensive demo guide
├── QUICK_REFERENCE.md       # Quick reference card
├── TESTING_CHECKLIST.md     # Testing checklist
└── README.md                # This file
```

## 🔧 Smart Contract Functions

### Organizer Functions
- `createEvent(name, date, ticketPrice, maxSupply)` - Create a new event
- `mintTicket(eventId, to)` - Mint ticket (free for organizer, paid for buyers)
- `validateTicket(tokenId)` - Validate a ticket (one-time use)
- `cancelEvent(eventId)` - Cancel an event
- `refundEvent(eventId)` - Refund all ticket holders from escrow

### Attendee Functions
- `resellTicket(tokenId, price)` - List ticket for resale
- `cancelResale(tokenId)` - Cancel resale listing
- `buyResale(tokenId)` - Purchase a resale ticket

### View Functions
- `eventCount()` - Get total number of events
- `eventsData(eventId)` - Get event details
- `getEvent(eventId)` - Get all event information
- `listings(tokenId)` - Get resale listing details
- `isListed(tokenId)` - Check if ticket is listed
- `resaleCapFor(tokenId)` - Get maximum resale price

## 🎯 Contract Address

**Current Deployment (Sepolia):** `0xE2121972e1903099BfBc683699045dCea124D7f2`

[View on Etherscan](https://sepolia.etherscan.io/address/0xE2121972e1903099BfBc683699045dCea124D7f2)

## 🔐 Security Features

- **ReentrancyGuard** - Prevents reentrancy attacks
- **Price Caps** - Resale limited to 110% of last paid price
- **One-Time Validation** - Tickets can only be validated once
- **Escrow System** - Refunds come from contract escrow, not organizer wallet
- **Access Control** - Only organizers can validate/cancel/refund their events

## 📖 Documentation

- **[DEMO_GUIDE.md](./DEMO_GUIDE.md)** - Complete demo guide with verification steps
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick reference for demo
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Testing checklist

## 🧪 Testing

1. Connect MetaMask to Sepolia Testnet
2. Get Sepolia ETH from a faucet
3. Follow the [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) for step-by-step testing
4. Verify all transactions on [Etherscan](https://sepolia.etherscan.io/)

## 🛠️ Technologies Used

- **Solidity** - Smart contract language
- **OpenZeppelin** - Battle-tested contract libraries
- **Ethers.js** - Ethereum JavaScript library
- **HTML/CSS/JavaScript** - Frontend
- **MetaMask** - Web3 wallet integration

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for decentralized event ticketing**

