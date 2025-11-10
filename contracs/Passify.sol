// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Passify - Multi-Event NFT Ticketing
 * @notice
 * Organizers can create events, mint and sell tickets, cancel events,
 * validate attendance, and issue refunds. Attendees can buy and resell tickets
 * with resale price caps to ensure fair secondary markets.
 */

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Passify is ERC721Enumerable, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // -------------------------------------------------------------
    // STRUCTS
    // -------------------------------------------------------------
    struct EventData {
        string name;
        uint256 date;
        address organizer;
        uint256 ticketPrice;
        uint256 maxSupply;
        uint256 ticketsSold;
        bool canceled;
    }

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    // -------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------
    Counters.Counter private _tokenIds;
    uint256 public eventCount;
    string private _baseTokenURI;

    mapping(uint256 => EventData) public eventsData;       // eventId => event
    mapping(uint256 => uint256) public ticketToEvent;      // tokenId => eventId
    mapping(uint256 => Listing) public listings;           // tokenId => resale data
    mapping(uint256 => bool) public used;                  // tokenId => validated?
    mapping(uint256 => bool) public refunded;              // tokenId => refunded?
    mapping(uint256 => uint256) public lastPricePaid;      // tokenId => last paid price
    mapping(uint256 => uint256) public escrow;             // eventId => total ETH held for refunds

    uint256 public constant MAX_RESALE_PERCENT = 110; // 110% cap on resale

    // -------------------------------------------------------------
    // EVENTS
    // -------------------------------------------------------------
    event EventCreated(uint256 indexed eventId, string name, uint256 date, address organizer, uint256 price, uint256 maxSupply);
    event TicketMinted(uint256 indexed eventId, uint256 indexed tokenId, address to, uint256 price);
    event TicketListed(uint256 indexed tokenId, uint256 price);
    event TicketDelisted(uint256 indexed tokenId);
    event TicketResold(uint256 indexed tokenId, address from, address to, uint256 price);
    event TicketValidated(uint256 indexed tokenId, address validator);
    event EventCanceled(uint256 indexed eventId);
    event TicketRefunded(uint256 indexed tokenId, address to, uint256 amount);

    // -------------------------------------------------------------
    // CONSTRUCTOR
    // -------------------------------------------------------------
    constructor(string memory baseURI_) ERC721("Passify Ticket", "PFT") Ownable(msg.sender) {
        _baseTokenURI = baseURI_;
    }

    // -------------------------------------------------------------
    // ORGANIZER FUNCTIONS
    // -------------------------------------------------------------
    function createEvent(
        string memory name,
        uint256 date,
        uint256 ticketPrice,
        uint256 maxSupply
    ) external {
        require(bytes(name).length > 0, "Name required");
        require(date > block.timestamp, "Date must be future");
        require(ticketPrice > 0, "Invalid price");
        require(maxSupply > 0, "Invalid supply");

        eventCount++;
        eventsData[eventCount] = EventData({
            name: name,
            date: date,
            organizer: msg.sender,
            ticketPrice: ticketPrice,
            maxSupply: maxSupply,
            ticketsSold: 0,
            canceled: false
        });

        emit EventCreated(eventCount, name, date, msg.sender, ticketPrice, maxSupply);
    }

    function mintTicket(uint256 eventId, address to)
        external
        payable
        nonReentrant
    {
        EventData storage e = eventsData[eventId];
        require(e.organizer != address(0), "Event not found");
        require(!e.canceled, "Event canceled");
        require(e.ticketsSold < e.maxSupply, "Sold out");

        // Organizer mint (no payment) or buyer purchase (must send ETH)
        if (msg.sender != e.organizer) {
            require(msg.value == e.ticketPrice, "Incorrect payment");
            escrow[eventId] += msg.value;
        }

        e.ticketsSold++;
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        _safeMint(to, tokenId);
        ticketToEvent[tokenId] = eventId;
        lastPricePaid[tokenId] = e.ticketPrice;

        emit TicketMinted(eventId, tokenId, to, e.ticketPrice);
    }

    function cancelEvent(uint256 eventId) external {
        EventData storage e = eventsData[eventId];
        require(e.organizer == msg.sender, "Not organizer");
        require(!e.canceled, "Already canceled");
        e.canceled = true;

        emit EventCanceled(eventId);
    }

    function validateTicket(uint256 tokenId) external {
        uint256 eventId = ticketToEvent[tokenId];
        require(eventsData[eventId].organizer == msg.sender, "Not organizer");
        require(!used[tokenId], "Already validated");
        used[tokenId] = true;

        emit TicketValidated(tokenId, msg.sender);
    }

    function refundEvent(uint256 eventId) external nonReentrant {
        EventData storage e = eventsData[eventId];
        require(e.organizer == msg.sender, "Not organizer");
        require(e.canceled, "Event not canceled");

        uint256 totalSupplyTickets = totalSupply();
        for (uint256 i = 1; i <= totalSupplyTickets; i++) {
            if (ownerOf(i) != address(0) && ticketToEvent[i] == eventId && !refunded[i]) {
                refunded[i] = true;
                address holder = ownerOf(i);
                uint256 amount = lastPricePaid[i];

                if (amount > 0 && escrow[eventId] >= amount) {
                    escrow[eventId] -= amount;
                    (bool ok, ) = payable(holder).call{value: amount}("");
                    require(ok, "Refund failed");
                    emit TicketRefunded(i, holder, amount);
                }
            }
        }
    }

    // -------------------------------------------------------------
    // ATTENDEE FUNCTIONS
    // -------------------------------------------------------------
    function resellTicket(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(!used[tokenId], "Already validated");
        uint256 eventId = ticketToEvent[tokenId];
        require(!eventsData[eventId].canceled, "Event canceled");

        uint256 cap = (lastPricePaid[tokenId] * MAX_RESALE_PERCENT) / 100;
        require(price > 0 && price <= cap, "Exceeds resale cap");

        listings[tokenId] = Listing(msg.sender, price, true);
        emit TicketListed(tokenId, price);
    }

    function cancelResale(uint256 tokenId) external {
        Listing storage lst = listings[tokenId];
        require(lst.active, "Not listed");
        require(lst.seller == msg.sender, "Not seller");
        lst.active = false;
        emit TicketDelisted(tokenId);
    }

    function buyResale(uint256 tokenId) external payable nonReentrant {
        Listing storage lst = listings[tokenId];
        require(lst.active, "Not listed");
        require(msg.value == lst.price, "Incorrect price");
        require(!used[tokenId], "Already validated");

        address seller = lst.seller;
        lst.active = false;

        (bool sent, ) = payable(seller).call{value: msg.value}("");
        require(sent, "Payment failed");

        _transfer(seller, msg.sender, tokenId);
        lastPricePaid[tokenId] = msg.value;

        emit TicketResold(tokenId, seller, msg.sender, msg.value);
    }

    // -------------------------------------------------------------
    // VIEWS
    // -------------------------------------------------------------
    function getEvent(uint256 eventId)
        external
        view
        returns (
            string memory,
            uint256,
            address,
            uint256,
            uint256,
            uint256,
            bool
        )
    {
        EventData memory e = eventsData[eventId];
        return (
            e.name,
            e.date,
            e.organizer,
            e.ticketPrice,
            e.maxSupply,
            e.ticketsSold,
            e.canceled
        );
    }

    function isListed(uint256 tokenId) external view returns (bool) {
        return listings[tokenId].active;
    }

    function resaleCapFor(uint256 tokenId) external view returns (uint256) {
        return (lastPricePaid[tokenId] * MAX_RESALE_PERCENT) / 100;
    }

    /**
     * @notice Get all active resale listings
     * @dev Returns array of token IDs that are currently listed for resale
     * Note: This iterates through all tokens, use with caution for large supplies
     */
    function getAllListings() external view returns (uint256[] memory) {
        uint256 total = totalSupply();
        uint256[] memory temp = new uint256[](total);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= total; i++) {
            if (listings[i].active) {
                temp[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        
        return result;
    }

    /**
     * @notice Get listing details for a token
     * @dev Returns seller address, price, and active status
     */
    function getListing(uint256 tokenId) external view returns (address seller, uint256 price, bool active) {
        Listing memory lst = listings[tokenId];
        return (lst.seller, lst.price, lst.active);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata newBase) external onlyOwner {
        _baseTokenURI = newBase;
    }

    // Fallback for funding refunds
    receive() external payable {}
}
