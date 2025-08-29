# 🎮 Shiritori Game


## How the Game Works

1. **Word Chain Rule**  
   - Each new word must begin with the **last letter** of the previous word.  
   - Example: If the last word was `apple` → the next word must start with `e` (like `elephant`).  

2. **Turn-Based Play**  
   - Two players alternate turns.  
   - Each player has **30 seconds** to submit a valid word.  

3. **Word Validation Rules**
   - Minimum **4 letters** long  
   - Cannot be **previously used**  
   - Must start with the **correct letter** (unless it’s the first word)  
   - Must be a valid **English word** (verified via dictionary service)  

---

## 🕹️ Game Flow

The game leverages **React hooks** to manage its logic:  

- **Player Management** → Tracks turns and scores  
- **Word Tracking** → Stores used words and last required letter  
- **Timer System** → 30-second countdown per turn  
- **Game Status** → Running, paused, or game over  

---

## 🏆 Scoring & Penalties

- ✅ Valid word → Player continues  
- ❌ -1 Point penalty for:  
  - Words shorter than 4 letters  
  - Reusing words  
  - Wrong starting letter  
  - Invalid English words  
  - Running out of time  

If both players timeout **consecutively**, the game ends.  

---


##  Installation & Setup

```bash
# Clone the repo
git clone https://github.com/tasminoni/shiritori-game.git

# Navigate into the project
cd shiritori-game

# Install dependencies
npm install

# Run the development server
npm start
