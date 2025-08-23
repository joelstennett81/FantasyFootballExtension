# VORP Vision

VORP Vision is a fantasy football draft assistant that combines **Value Over Replacement Player (VORP)** and **Value Over Average Starter (VOAS)** to help you draft smarter. It normalizes projections from multiple sources, calculates leverage at each position, and shows which players are most valuable round by round.

---

## Features

- **Multi-source projections**  
  Merges ESPN, CBS, and Draft Sharks projections into one ranking set.

- **VORP and VOAS**  
  - VORP = player vs. replacement level at their position.  
  - VOAS = player vs. average starter at their position.  
  See scarcity and weekly edge together.

- **League-aware**  
  Inputs for number of teams and starters per position adjust replacement level and starter averages.

- **Chrome Extension**  
  - Installs from the [Chrome Web Store](#).  
  - Overlays live rankings and VORP/VOAS values on Sleeper drafts.  
  - Auto-hides drafted players and supports undo.  
  - Position filters, tier colors, and persistence via localStorage.

---

## How It Works

1. **Ingest projections** from ESPN, CBS, and Draft Sharks.  
2. **Normalize scoring** (full PPR by default, pass TD=4, rush/rec TD=6).  
3. **Calculate** VORP and VOAS for every player.  
4. **Rank players** by opportunity cost and positional scarcity.  
5. **Serve data** to both the website and Chrome extension.

---

## Tech Stack

- **Backend**: Django + Django REST Framework  
- **Frontend**: Django templates, Bootstrap, JavaScript  
- **Extension**: Chrome extension with content script, MutationObserver, localStorage persistence  
- **Data**: ESPN, CBS, Draft Sharks projections