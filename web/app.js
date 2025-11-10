// ------- Config -------
const SEPOLIA_HEX = "0xaa36a7";

let CONTRACT_ADDRESS = "0xE2121972e1903099BfBc683699045dCea124D7f2"; // Deployed contract address
let provider, signer, contract;

const $ = (id) => document.getElementById(id);

// ------- Status helpers -------
function setStatus(message, type = "") {
  const el = $("walletStatus");
  if (!el) return;
  el.textContent = message || "";
  el.className = `banner ${type}`;
  el.style.display = message ? "block" : "none";
}

function warnNotSepolia(show, chainId) {
  const el = $("networkStatus");
  const textEl = $("networkStatusText");
  if (!el || !textEl) return;
  el.style.display = show ? "block" : "none";
  if (show) {
    textEl.textContent = `⚠️ You are NOT on Sepolia (chainId ${chainId}). Switch to Sepolia in MetaMask for this demo.`;
  }
}

// ------- Network helpers -------
async function ensureSepolia() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  if (chainId === SEPOLIA_HEX) return;
  throw new Error("Wrong network. Please switch MetaMask to Sepolia.");
}

// ------- Connect -------
async function connectWallet() {
  try {
    if (!window.ethereum) throw new Error("MetaMask not found");
    $("connectButton").disabled = true;
    $("connectButton").textContent = "Connecting…";

    await ensureSepolia();

    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();

    const [address, network] = await Promise.all([
      signer.getAddress(),
      provider.getNetwork()
    ]);

    $("walletDisplay").value = address;
    setStatus(`✅ Connected: ${address.slice(0,6)}...${address.slice(-4)}`, "success");
    warnNotSepolia(Number(network.chainId) !== 11155111, network.chainId);

    // Load ABI
    const abi = await fetch("./abi.json").then(r => r.json());

    // Validate contract address
    if (!ethers.utils.isAddress(CONTRACT_ADDRESS)) {
      throw new Error("Invalid contract address. Check app.js line 4.");
    }

    // Bind contract
    contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
    
    // Verify contract is accessible
    try {
      const testCount = await contract.eventCount();
      const countNum = Number(testCount);
      console.log("✅ Contract connected! Current event count:", countNum);
      
      // If there are events, try to read one to verify the contract is correct
      if (countNum > 0) {
        try {
          const testEvent = await contract.getEvent(1);
          if (testEvent[0] && testEvent[0].trim() !== "") {
            console.log(`✅ Verified: Can read event 1: "${testEvent[0]}"`);
    } else {
            console.warn("⚠️ Event 1 exists but has empty name - contract may be wrong");
            setStatus("⚠️ Contract connected but events unreadable. Check contract address.", "warn");
          }
        } catch (readErr) {
          console.error("⚠️ Cannot read events from this contract:", readErr);
          setStatus("⚠️ Contract address may be wrong. Events exist but can't be read.", "warn");
        }
      }
    } catch (err) {
      console.error("❌ Contract address may be wrong or contract not deployed:", err);
      console.error("  Current address:", CONTRACT_ADDRESS);
      console.error("  Error:", err.message);
      setStatus(`⚠️ Cannot read contract at ${CONTRACT_ADDRESS.slice(0,10)}... Check address.`, "warn");
    }

    $("connectButton").textContent = "🔗 Connected";

    // Autofill recipient placeholders
    const addr = address;
    if ($("buyTo") && !$("buyTo").value) $("buyTo").placeholder = addr;
    if ($("mintTo") && !$("mintTo").value) $("mintTo").placeholder = addr;

    await refreshAll();
  } catch (err) {
    console.error(err);
    setStatus(`❌ ${err.message || err}`, "error");
    $("connectButton").textContent = "🔗 Connect MetaMask";
  } finally {
    $("connectButton").disabled = false;
  }
}

// ------- Utilities -------
function toDate(ts) {
  try { return new Date(Number(ts) * 1000).toLocaleString(); }
  catch { return String(ts); }
}
function linkTx(hash){ return `https://sepolia.etherscan.io/tx/${hash}`; }

// Debug function - expose to window for console testing
window.debugPassify = async function() {
  console.log("🔍 === PASSIFY DEBUG ===");
  console.log("Contract address:", CONTRACT_ADDRESS);
  console.log("Contract object:", contract);
  console.log("Provider:", provider);
  console.log("Signer:", signer);
  
  if (!contract) {
    console.error("❌ Contract not connected!");
    return;
  }
  
  try {
    const count = await contract.eventCount();
    console.log("📊 eventCount():", Number(count));
    
    if (Number(count) > 0) {
      console.log(`\n🔍 Testing event reads for IDs 1-${count}:`);
      for (let i = 1; i <= Number(count); i++) {
        try {
          const event = await contract.getEvent(i);
          console.log(`  Event ${i}:`, {
            name: event[0],
            organizer: event[2],
            date: new Date(Number(event[1]) * 1000).toLocaleString(),
            price: ethers.utils.formatEther(event[3]) + " ETH",
            sold: Number(event[5]) + "/" + Number(event[4]),
            canceled: event[6]
          });
        } catch (e) {
          console.error(`  ❌ Failed to read event ${i}:`, e.message);
        }
      }
    }
    
    // Test dropdown elements
    console.log("\n📋 Testing dropdown elements:");
    const dropdownIds = ["mintEventId", "cancelEventId", "refundEventId", "buyEventId"];
    dropdownIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        console.log(`  ✅ ${id}: Found, has ${el.options.length} options`);
      } else {
        console.error(`  ❌ ${id}: NOT FOUND in DOM`);
      }
    });
    
    // Test events list container
    const eventsList = document.getElementById("eventsList");
    if (eventsList) {
      console.log(`  ✅ eventsList: Found, has ${eventsList.children.length} children`);
    } else {
      console.error(`  ❌ eventsList: NOT FOUND in DOM`);
    }
    
  } catch (err) {
    console.error("❌ Debug failed:", err);
  }
  
  console.log("🔍 === END DEBUG ===");
};

async function callStaticOrThrow(fn, ...args) {
  if (!contract) throw new Error("Contract not connected");
  try {
    await contract.callStatic[fn](...args);
  } catch (e) {
    const reason = e?.error?.message || e?.data?.message || e?.message || "Reverted";
    throw new Error(`Preflight failed: ${reason}`);
  }
}

// ------- Event cache / dropdowns -------
async function loadEvents() {
  console.log("🔄 Loading events...");
  const container = $("eventsList");
  const selects = ["mintEventId","cancelRefundEventId","buyEventId"].map($);

  // Reset UIs
  if (container) container.innerHTML = "";
  selects.forEach(sel => {
    if (sel) {
      sel.innerHTML = "";
      sel.append(new Option(contract ? "Select event..." : "Connect wallet first", ""));
    }
  });

  if (!contract) {
    console.warn("⚠️ No contract connected");
    if (container) container.innerHTML = `<p class="muted">Connect wallet to view events.</p>`;
    return;
  }

  // Fetch count
  let total = 0;
  try {
    const countBN = await contract.eventCount();
    total = Number(countBN);
    console.log(`📊 Event count from contract: ${total}`);
  } catch (err) {
    console.error("❌ eventCount() failed:", err);
    setStatus("❌ Could not read eventCount() — check contract address / ABI", "error");
    if (container) container.innerHTML = `<p class="muted">Error loading events. Check console.</p>`;
    return;
  }

  if (total === 0) {
    console.log("ℹ️ No events found (eventCount = 0)");
    if (container) container.innerHTML = `<p class="muted">No events yet. Create one above.</p>`;
    return;
  }

  const frag = document.createDocumentFragment();
  let appended = 0;

  console.log(`🔍 Loading ${total} events...`);
  for (let id = 1; id <= total; id++) {
    try {
      console.log(`  Checking event ${id}...`);
      
      // Try using getEvent first (more reliable)
      let e;
      let name, date, organizer, ticketPrice, maxSupply, ticketsSold, canceled;
      
      try {
        // Try getEvent function first (most reliable)
        const result = await contract.getEvent(id);
        name = result[0];
        date = result[1];
        organizer = result[2];
        ticketPrice = result[3];
        maxSupply = result[4];
        ticketsSold = result[5];
        canceled = result[6];
        console.log(`  ✅ Used getEvent() for event ${id}`);
      } catch (getEventErr) {
        console.log(`  ⚠️ getEvent(${id}) failed:`, getEventErr.message);
        try {
          // Fallback to eventsData mapping
          const e = await contract.eventsData(id);
          name = e.name;
          date = e.date;
          organizer = e.organizer;
          ticketPrice = e.ticketPrice;
          maxSupply = e.maxSupply;
          ticketsSold = e.ticketsSold;
          canceled = e.canceled;
          console.log(`  ✅ Used eventsData mapping for event ${id}`);
        } catch (eventsDataErr) {
          console.error(`  ❌ Both getEvent() and eventsData() failed for event ${id}`);
          console.error(`  getEvent error:`, getEventErr.message);
          console.error(`  eventsData error:`, eventsDataErr.message);
          throw new Error(`Cannot read event ${id}: ${eventsDataErr.message || getEventErr.message}`);
        }
      }
      
      console.log(`  Event ${id} raw data:`, { 
        name: name || "(empty)", 
        organizer: organizer || "(empty)", 
        date: date ? Number(date) : "(empty)",
        ticketPrice: ticketPrice ? ethers.utils.formatEther(ticketPrice) : "(empty)",
        maxSupply: maxSupply ? Number(maxSupply) : "(empty)"
      });

      // Guard: skip empty slots - check if organizer is zero address
      const organizerStr = String(organizer || "").toLowerCase();
      const zeroAddresses = [
        "0x0000000000000000000000000000000000000000",
        ethers.constants.AddressZero?.toLowerCase(),
        "0x"
      ];
      const isZero = !organizer || zeroAddresses.includes(organizerStr);
      
      if (isZero) {
        console.warn(`  ⚠️ Event ${id} is empty (zero organizer: ${organizerStr || "null"}) - skipping`);
        continue;
      }

      // Check if name is empty (another indicator of uninitialized event)
      const nameStr = String(name || "").trim();
      if (!nameStr || nameStr === "") {
        console.warn(`  ⚠️ Event ${id} has empty name (organizer: ${organizerStr.slice(0,10)}...) - skipping`);
        continue;
      }

      const eventName = name || `Event ${id}`;
      console.log(`  ✅ Event ${id} loaded: "${eventName}" by ${organizerStr.slice(0,6)}...${organizerStr.slice(-4)}`);
      
      const row = document.createElement("div");
      row.className = "event-row";
      row.innerHTML = `
        <div class="event-title">${eventName} <span class="muted">#${id}</span></div>
        <div class="event-meta">
          <span>🗓 ${toDate(date)}</span>
          <span>🎟 ${Number(ticketsSold)}/${Number(maxSupply)}</span>
          <span>💰 ${ethers.utils.formatEther(ticketPrice)} ETH</span>
          <span>${canceled ? "🚫 Canceled" : "✅ Active"}</span>
        </div>
        <div class="event-organizer">Organizer: ${organizerStr.slice(0,6)}...${organizerStr.slice(-4)}</div>
      `;
      frag.appendChild(row);

      // add to dropdowns
      const optionText = `${id} — ${eventName}${canceled ? " (Canceled)" : ""}`;
      const opt = new Option(optionText, id);
      selects.forEach(sel => {
        if (!sel) {
          console.warn(`  ⚠️ Select element not found for ${sel?.id || 'unknown'}`);
          return;
        }
        if (sel.id === "buyEventId" && canceled) {
          console.log(`  ⏭️ Skipping canceled event ${id} from buyEventId dropdown`);
          return;
        }
        const clonedOpt = opt.cloneNode(true);
        sel.appendChild(clonedOpt);
        console.log(`  ✅ Added "${optionText}" to dropdown ${sel.id} (now has ${sel.options.length} options)`);
      });

      appended++;
    } catch (err) {
      console.error(`  ❌ Failed to load event ${id}:`, err);
      console.error(`  Error details:`, {
        message: err.message,
        code: err.code,
        data: err.data
      });
    }
  }

  console.log(`✅ Loaded ${appended} events out of ${total} total`);

  if (appended === 0 && total > 0) {
    console.warn("⚠️ No events could be loaded despite eventCount > 0");
    console.error("🔍 DIAGNOSTIC INFO:");
    console.error("  Contract Address:", CONTRACT_ADDRESS);
    console.error("  Event Count:", total);
    console.error("  This usually means:");
    console.error("    1. Contract address is wrong");
    console.error("    2. Events exist but organizer addresses are zero");
    console.error("    3. Network mismatch (not on Sepolia)");
    console.error("  Run debugPassify() in console for more details");
    
    if (container) {
      container.innerHTML = `
        <p class="muted">
          ⚠️ Found ${total} event(s) but couldn't read them.<br>
          <strong>Contract:</strong> ${CONTRACT_ADDRESS}<br>
          <strong>Possible issues:</strong> Wrong contract address or network mismatch.<br>
          <small>Open console (F12) and run: <code>debugPassify()</code></small>
        </p>
      `;
    }
  } else if (appended > 0) {
    if (container) {
      container.appendChild(frag);
      console.log(`✅ Events displayed in UI`);
    } else {
      console.error("❌ Events container not found!");
    }
  }
  
  // Log dropdown status
  selects.forEach(sel => {
    if (sel) {
      console.log(`📋 Dropdown ${sel.id} has ${sel.options.length} options`);
    } else {
      console.warn(`⚠️ Dropdown element not found`);
    }
  });
}

async function refreshMyTickets() {
  const list = $("myTickets");
  const listDropdown = $("listTokenId");
  if (!list) return;
  list.innerHTML = "";
  if (!signer || !contract) {
    list.innerHTML = `<li class="muted">Connect wallet first.</li>`;
    if (listDropdown) listDropdown.innerHTML = '<option>Connect wallet first</option>';
    return;
  }

  let me;
  try { me = (await signer.getAddress()).toLowerCase(); }
  catch { list.innerHTML = `<li class="muted">Cannot read your address.</li>`; return; }

  let totalSupply = 0;
  try { totalSupply = Number(await contract.totalSupply()); }
  catch { list.innerHTML = `<li class="muted">Cannot read totalSupply.</li>`; return; }

  const items = [];
  for (let tokenId = 1; tokenId <= totalSupply; tokenId++) {
    try {
      const owner = (await contract.ownerOf(tokenId)).toLowerCase();
      if (owner !== me) continue;

      const eId = Number(await contract.ticketToEvent(tokenId));
      if (eId <= 0) continue;

      const e = await contract.eventsData(eId);
      const listing = await contract.listings(tokenId);
      const used = await contract.used(tokenId);
      const refunded = await contract.refunded(tokenId);

      items.push({
        tokenId,
        eventId: eId,
        name: e.name || `Event ${eId}`,
        listed: listing.active,
        used,
        canceled: e.canceled,
        refunded
      });
    } catch {}
  }

  if (items.length === 0) {
    list.innerHTML = `<li class="muted">No tickets owned yet.</li>`;
    if (listDropdown) listDropdown.innerHTML = '<option>No tickets owned</option>';
    return;
  }

  // Populate dropdown for resale listing (only unused, unlisted, non-canceled, non-refunded tickets)
  if (listDropdown) {
    listDropdown.innerHTML = '<option>Select your ticket...</option>';
    items.forEach(t => {
      if (!t.used && !t.listed && !t.canceled && !t.refunded) {
        const opt = new Option(`#${t.tokenId} — ${t.name} (Event ${t.eventId})`, t.tokenId);
        listDropdown.appendChild(opt);
      }
    });
  }

  // Display tickets in list
  items.forEach(t => {
    const li = document.createElement("li");
    
    // Build status indicators
    const statusParts = [];
    
    // Show both canceled and refunded if applicable
    if (t.canceled) {
      statusParts.push("🚫 Event Canceled");
    }
    if (t.refunded) {
      statusParts.push("💰 Refunded");
    }
    
    if (t.used) {
      statusParts.push("✅ Used");
    } else {
      statusParts.push("🟢 Unused");
    }
    
    if (t.listed) {
      statusParts.push("🔁 Listed");
    }
    
    const statusText = statusParts.length > 0 ? statusParts.join(" • ") : "—";
    
    // Add visual indicator if event is canceled or refunded
    let titleClass = "";
    if (t.refunded) {
      titleClass = ' style="opacity: 0.6; text-decoration: line-through;"';
    } else if (t.canceled) {
      titleClass = ' style="opacity: 0.7;"';
    }
    
    li.innerHTML = `
      <div${titleClass}><strong>#${t.tokenId}</strong> — ${t.name} (Event ${t.eventId})</div>
      <div class="muted">${statusText}</div>
    `;
    list.appendChild(li);
  });
}

// Load all resale listings into dropdown
async function loadResaleListings() {
  const dropdown = $("buyResaleTokenId");
  if (!dropdown) return;
  
  dropdown.innerHTML = '<option>Loading resale tickets...</option>';
  
  if (!contract || !signer) {
    dropdown.innerHTML = '<option>Connect wallet first</option>';
    return;
  }

  try {
    // Get current user address to filter out their own listings
    const currentUser = (await signer.getAddress()).toLowerCase();
    console.log("🔍 Loading resale listings (excluding user's own tickets)...");
    console.log("Current user:", currentUser);
    
    // Get total supply first
    const total = Number(await contract.totalSupply());
    console.log(`📊 Total supply: ${total}`);
    
    if (total === 0) {
      dropdown.innerHTML = '<option>No tickets available for resale</option>';
      return;
    }
    
    // Manually iterate through all tokens to find listings
    // This works even if getAllListings() doesn't exist in the contract
    const listings = [];
    
    for (let tokenId = 1; tokenId <= total; tokenId++) {
      try {
        // Check if token exists and is listed
        const listing = await contract.listings(tokenId);
        console.log(`Token ${tokenId} listing:`, {
          active: listing.active,
          seller: listing.seller,
          price: listing.price ? ethers.utils.formatEther(listing.price) : "0"
        });
        
        if (listing.active) {
          // Get owner to filter out user's own tickets
          const owner = (await contract.ownerOf(tokenId)).toLowerCase();
          console.log(`Token ${tokenId} owner:`, owner);
          
          if (owner !== currentUser) {
            listings.push({
              tokenId,
              listing,
              owner
            });
            console.log(`  ✅ Token ${tokenId} added to listings array`);
          } else {
            console.log(`  ⏭️ Token ${tokenId} is owned by current user, skipping`);
          }
        }
      } catch (e) {
        // Token might not exist or other error, skip it
        console.log(`  ⏭️ Token ${tokenId} error:`, e.message);
      }
    }
    
    console.log(`📋 Found ${listings.length} active listings from other users`);
    
    dropdown.innerHTML = '<option>Select resale ticket...</option>';
    
    if (listings.length === 0) {
      dropdown.innerHTML = '<option>No tickets available for resale</option>';
      console.log("ℹ️ No resale tickets available");
      return;
    }

    // Load details for each listing
    let addedCount = 0;
    for (const { tokenId, listing } of listings) {
      try {
        // Get event details
        const eventId = await contract.ticketToEvent(tokenId);
        const event = await contract.getEvent(eventId);
        const priceEth = ethers.utils.formatEther(listing.price);
        
        const opt = new Option(
          `#${tokenId} — ${event[0]} — ${priceEth} ETH`,
          tokenId
        );
        opt.dataset.price = listing.price.toString();
        dropdown.appendChild(opt);
        addedCount++;
        console.log(`  ✅ Added token ${tokenId} to dropdown: "${event[0]}" at ${priceEth} ETH`);
      } catch (e) {
        console.error(`  ❌ Failed to load details for token ${tokenId}:`, e);
      }
    }
    
    if (addedCount === 0) {
      dropdown.innerHTML = '<option>No tickets available for resale</option>';
      console.log("ℹ️ No resale tickets could be loaded");
    } else {
      console.log(`✅ Successfully loaded ${addedCount} resale tickets into dropdown`);
    }
    
  } catch (err) {
    console.error("❌ Failed to load resale listings:", err);
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      data: err.data,
      stack: err.stack
    });
    dropdown.innerHTML = '<option>Error loading listings</option>';
  }
}

async function refreshAll() {
  console.log("🔄 Refreshing all data...");
  try {
    await loadEvents();
    await refreshMyTickets();
    await loadResaleListings();
    console.log("✅ Refresh complete");
  } catch (err) {
    console.error("❌ Refresh failed:", err);
    setStatus("⚠️ Error refreshing data. Check console.", "warn");
  }
}

// ------- Organizer actions -------
async function createEvent() {
  try {
    if (!contract) return alert("Connect wallet first.");
    const name = $("evName").value.trim();
    const dateVal = $("evDate").value;
    const priceEth = $("evPrice").value.trim();
    const maxSupply = Number($("evSupply").value);
    if (!name || !dateVal || !priceEth || !maxSupply) return alert("Fill all fields");

    const ts = Math.floor(new Date(dateVal).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);
    if (ts <= now) return alert("Event date must be in the future");

    const priceWei = ethers.utils.parseEther(priceEth);
    if (priceWei.lte(0)) return alert("Price must be > 0");
    if (maxSupply <= 0) return alert("Max supply must be > 0");

    setStatus("⏳ Creating event…", "info");
    await callStaticOrThrow("createEvent", name, ts, priceWei, maxSupply);
    const tx = await contract.createEvent(name, ts, priceWei, maxSupply);
    setStatus(`⏳ Waiting… ${tx.hash.slice(0,10)}…`, "info");
    await tx.wait();

    setStatus("✅ Event created! Refreshing...", "success");
    $("evName").value = ""; $("evDate").value = ""; $("evPrice").value = ""; $("evSupply").value = "";
    
    // Wait for blockchain state to update, then refresh with retries
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Retry loading events up to 5 times with increasing delays
    let retries = 5;
    let success = false;
    while (retries > 0) {
      try {
        console.log(`🔄 Refresh attempt ${6 - retries}/5...`);
        await refreshAll();
        
        // Verify event was loaded by checking eventCount and trying to read the new event
        const count = await contract.eventCount();
        const countNum = Number(count);
        console.log(`📊 Current eventCount: ${countNum}`);
        
        if (countNum > 0) {
          // Try to read the latest event
          try {
            const latestEvent = await contract.getEvent(countNum);
            if (latestEvent[0] && latestEvent[0].trim() !== "") {
              console.log(`✅ Latest event verified: "${latestEvent[0]}"`);
              success = true;
              setStatus(`✅ Event "${latestEvent[0]}" created and loaded!`, "success");
              break;
            }
          } catch (readErr) {
            console.log(`⚠️ Could not read latest event yet, retrying...`, readErr);
          }
        }
      } catch (e) {
        console.log(`❌ Refresh attempt ${6 - retries} failed:`, e);
      }
      retries--;
      if (retries > 0) {
        const delay = (6 - retries) * 1000; // Increasing delay: 1s, 2s, 3s, 4s
        console.log(`⏳ Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    if (!success) {
      setStatus("⚠️ Event created but may not be visible yet. Click Refresh.", "warn");
    }
  } catch (err) {
    console.error("Create event error:", err);
    setStatus(`❌ ${err.message || err}`, "error");
    alert(`Error: ${err.message || "Failed to create event"}`);
  }
}

async function mintTicket() {
  try {
    if (!contract) return alert("Connect wallet first");
    const eventId = Number($("mintEventId").value);
    const to = $("mintTo").value.trim() || (await signer.getAddress());
    if (!eventId) return alert("Select an event");
    if (!ethers.utils.isAddress(to)) return alert("Invalid address");

    const ed = await contract.eventsData(eventId);
    const caller = (await signer.getAddress()).toLowerCase();
    const isOrganizer = ed.organizer.toLowerCase() === caller;

    setStatus(isOrganizer ? "⏳ Minting (organizer)..." : "⏳ Buying ticket...", "info");
    let overrides = isOrganizer ? {} : { value: ed.ticketPrice };
    await callStaticOrThrow("mintTicket", eventId, to, overrides);
    const tx = await contract.mintTicket(eventId, to, overrides);
    await tx.wait();

    setStatus(`✅ ${isOrganizer ? "Ticket minted" : "Purchased"}`, "success");
    $("mintTo").value = "";
    await refreshMyTickets();
  } catch (err) {
    console.error(err);
    setStatus(`❌ ${err.message || err}`, "error");
  }
}

async function validateTicket() {
  try {
    if (!contract) return alert("Connect wallet first");
    const tokenId = Number($("validateTokenId").value);
    if (!tokenId) return alert("Enter token ID");
    setStatus("⏳ Validating…", "info");
    await callStaticOrThrow("validateTicket", tokenId);
    const tx = await contract.validateTicket(tokenId);
    await tx.wait();
    setStatus("✅ Ticket validated", "success");
    await refreshMyTickets();
  } catch (err) {
    console.error(err);
    setStatus(`❌ ${err.message || err}`, "error");
  }
}

async function cancelAndRefundEvent() {
  try {
    if (!contract) return alert("Connect wallet first");
    const eventId = Number($("cancelRefundEventId").value);
    if (!eventId) return alert("Select event");
    
    const ed = await contract.eventsData(eventId);
    if (ed.canceled) return alert("Event is already canceled");
    
    // Check escrow balance
    const escrowBalance = await contract.escrow(eventId);
    const escrowEth = ethers.utils.formatEther(escrowBalance);
    const ticketPriceEth = ethers.utils.formatEther(ed.ticketPrice);
    const totalTickets = Number(ed.ticketsSold);
    const totalRefundNeeded = totalTickets * parseFloat(ticketPriceEth);
    
    console.log("Escrow check:", {
      escrowBalance: escrowEth + " ETH",
      totalTickets,
      ticketPrice: ticketPriceEth + " ETH",
      totalRefundNeeded: totalRefundNeeded + " ETH"
    });
    
    let confirmMsg = `Cancel event "${ed.name}" and refund all ticket holders?\n\n`;
    confirmMsg += `Tickets sold: ${totalTickets}\n`;
    confirmMsg += `Escrow balance: ${escrowEth} ETH\n`;
    confirmMsg += `Total refund needed: ${totalRefundNeeded.toFixed(4)} ETH\n\n`;
    
    if (escrowBalance.lt(ethers.utils.parseEther(totalRefundNeeded.toString()))) {
      confirmMsg += `⚠️ WARNING: Escrow balance is insufficient. Only tickets that were PURCHASED (not free mints) will be refunded.\n\n`;
    }
    
    confirmMsg += `This cannot be undone. Continue?`;
    
    if (!confirm(confirmMsg)) return;
    
    setStatus("⏳ Canceling event…", "info");
    // Step 1: Cancel the event (no ETH transfer, just sets canceled = true)
    await callStaticOrThrow("cancelEvent", eventId);
    const cancelTx = await contract.cancelEvent(eventId);
    await cancelTx.wait();
    setStatus("✅ Event canceled. Processing refunds from escrow…", "info");
    
    // Step 2: Refund all holders (ETH comes from contract's escrow, not organizer's wallet)
    // This will only refund tickets that were purchased (have ETH in escrow)
    // Free minted tickets won't be refunded if escrow is empty
    await callStaticOrThrow("refundEvent", eventId);
    const refundTx = await contract.refundEvent(eventId);
    await refundTx.wait();
    
    setStatus("✅ Event canceled. Refunds processed from escrow balance.", "success");
    await refreshAll();
  } catch (err) {
    console.error(err);
    setStatus(`❌ ${err.message || err}`, "error");
  }
}

// ------- Attendee actions -------
async function buyTicket() {
  try {
    if (!contract) return alert("Connect wallet first");
    const eventId = Number(($("buyEventId").value || "").trim());
    if (!eventId) return alert("Select an event");
    const to = $("buyTo").value.trim() || (await signer.getAddress());
    if (!ethers.utils.isAddress(to)) return alert("Invalid address");

    const ed = await contract.eventsData(eventId);
    if (ed.canceled) return alert("This event has been canceled");

    if (!confirm(`Buy ticket for ${ethers.utils.formatEther(ed.ticketPrice)} ETH?`)) return;

    setStatus("⏳ Buying…", "info");
    await callStaticOrThrow("mintTicket", eventId, to, { value: ed.ticketPrice });
    const tx = await contract.mintTicket(eventId, to, { value: ed.ticketPrice });
    await tx.wait();
    setStatus("✅ Purchased", "success");
    $("buyTo").value = "";
    await refreshMyTickets();
  } catch (err) {
    console.error(err);
    setStatus(`❌ ${err.message || err}`, "error");
    alert(`Error: ${err.message || "Failed to buy ticket"}`);
  }
}

async function listResale() {
  try {
    if (!contract) return alert("Connect wallet first");
    const tokenId = Number($("listTokenId").value);
    const priceEth = $("listPriceEth").value.trim();
    if (!tokenId || !priceEth) return alert("Select ticket and enter price");
    
    const priceWei = ethers.utils.parseEther(priceEth);
    
    // Check resale cap
    try {
      const cap = await contract.resaleCapFor(tokenId);
      const capEth = ethers.utils.formatEther(cap);
      if (priceWei.gt(cap)) {
        return alert(`Price exceeds maximum resale cap of ${capEth} ETH (110% of last paid price)`);
      }
      
      // Update info text
      const capInfo = $("resaleCapInfo");
      if (capInfo) {
        capInfo.textContent = `Max resale price: ${capEth} ETH`;
      }
    } catch (e) {
      console.error("Failed to get resale cap:", e);
    }
    
    if (!confirm(`List ticket #${tokenId} for ${priceEth} ETH?`)) return;
    
    setStatus("⏳ Listing…", "info");
    await callStaticOrThrow("resellTicket", tokenId, priceWei);
    const tx = await contract.resellTicket(tokenId, priceWei);
    await tx.wait();
    setStatus("✅ Listed for resale", "success");
    $("listPriceEth").value = "";
    await refreshAll();
  } catch (err) {
    console.error(err);
    setStatus(`❌ ${err.message || err}`, "error");
  }
}

async function cancelResale() {
  try {
    if (!contract) return alert("Connect wallet first");
    const tokenId = Number($("listTokenId").value);
    if (!tokenId) return alert("Select a ticket");
    setStatus("⏳ Canceling listing…", "info");
    await callStaticOrThrow("cancelResale", tokenId);
    const tx = await contract.cancelResale(tokenId);
    await tx.wait();
    setStatus("✅ Listing canceled", "success");
    await refreshAll();
  } catch (err) {
    console.error(err);
    setStatus(`❌ ${err.message || err}`, "error");
  }
}

async function buyResale() {
  try {
    if (!contract) return alert("Connect wallet first");
    const tokenId = Number($("buyResaleTokenId").value);
    if (!tokenId) return alert("Select a resale ticket");
    
    // Use the public listings mapping directly (always available)
    const listing = await contract.listings(tokenId);
    if (!listing.active) return alert("This ticket is no longer listed");
    
    const priceEth = ethers.utils.formatEther(listing.price);
    if (!confirm(`Buy ticket #${tokenId} for ${priceEth} ETH?`)) return;
    
    setStatus("⏳ Buying resale ticket…", "info");
    await callStaticOrThrow("buyResale", tokenId, { value: listing.price });
    const tx = await contract.buyResale(tokenId, { value: listing.price });
    await tx.wait();
    setStatus("✅ Resale ticket purchased", "success");
    await refreshAll();
  } catch (err) {
    console.error(err);
    setStatus(`❌ ${err.message || err}`, "error");
  }
}

// ------- Wiring -------
window.addEventListener("DOMContentLoaded", async () => {
  // Set min date for datetime-local
  const dateInput = $("evDate");
  if (dateInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.min = now.toISOString().slice(0, 16);
  }

  $("connectButton")?.addEventListener("click", connectWallet);

  // Tabs
  const orgTab = $("tabOrganizer");
  const attTab = $("tabAttendee");
  orgTab?.addEventListener("click", () => {
    $("organizerPane")?.classList.remove("hidden");
    $("attendeePane")?.classList.add("hidden");
    orgTab.classList.add("active");
    attTab?.classList.remove("active");
  });
  attTab?.addEventListener("click", () => {
    $("organizerPane")?.classList.add("hidden");
    $("attendeePane")?.classList.remove("hidden");
    attTab.classList.add("active");
    orgTab?.classList.remove("active");
  });

  // Organizer buttons
  $("btnCreateEvent")?.addEventListener("click", createEvent);
  $("btnMintTicket")?.addEventListener("click", mintTicket);
  $("btnValidateTicket")?.addEventListener("click", validateTicket);
  $("btnCancelAndRefund")?.addEventListener("click", cancelAndRefundEvent);

  // Attendee buttons
  $("btnBuyTicket")?.addEventListener("click", buyTicket);
  $("btnListResale")?.addEventListener("click", listResale);
  $("btnCancelResale")?.addEventListener("click", cancelResale);
  $("btnBuyResale")?.addEventListener("click", buyResale);
  $("btnRefreshMine")?.addEventListener("click", refreshMyTickets);

  // Events grid refresh
  $("btnRefreshEvents")?.addEventListener("click", async () => {
    console.log("🔄 Manual refresh triggered");
    await loadEvents();
  });
  
  // Resale dropdown event listeners
  const buyResaleDropdown = $("buyResaleTokenId");
  if (buyResaleDropdown) {
    buyResaleDropdown.addEventListener("change", async () => {
      const selected = buyResaleDropdown.options[buyResaleDropdown.selectedIndex];
      const priceInfo = $("resalePriceInfo");
      if (selected.value && selected.dataset.price) {
        const priceEth = ethers.utils.formatEther(selected.dataset.price);
        if (priceInfo) {
          priceInfo.textContent = `Price: ${priceEth} ETH`;
        }
      } else {
        if (priceInfo) priceInfo.textContent = "";
      }
    });
  }
  
  const listTokenDropdown = $("listTokenId");
  if (listTokenDropdown) {
    listTokenDropdown.addEventListener("change", async () => {
      const tokenId = Number(listTokenDropdown.value);
      const capInfo = $("resaleCapInfo");
      if (tokenId && capInfo && contract) {
        try {
          const cap = await contract.resaleCapFor(tokenId);
          const capEth = ethers.utils.formatEther(cap);
          capInfo.textContent = `Max resale price: ${capEth} ETH (110% of last paid)`;
        } catch (e) {
          capInfo.textContent = "";
        }
      } else if (capInfo) {
        capInfo.textContent = "";
      }
    });
  }
  
  // MetaMask events
  if (window.ethereum) {
    window.ethereum.on("chainChanged", () => window.location.reload());
    window.ethereum.on("accountsChanged", async () => {
      if (signer) await connectWallet();
    });

    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts?.length) {
        console.log("🔍 Auto-connecting to existing session...");
        setTimeout(() => connectWallet(), 300);
      }
    } catch (e) { /* ignore */ }
  }
});
