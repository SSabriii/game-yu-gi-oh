# ⚔ DuelMasters Online — Yu-Gi-Oh! Inspired Multiplayer Card Game

A real-time, browser-based 2-player card game built with **React + Vite** (frontend) and **Node.js + Express + WebSockets** (backend).

---

## 🃏 Features (MVP)

- User **registration & login** (JWT + bcrypt + SQLite)
- **Room system**: create a room, get a Room ID, share it with opponent
- **Real-time gameplay** via WebSockets
- **20 unique Monster cards** per player deck
- Full game phases: **Draw → Main → Battle → End Turn**
- Battle mechanics: attack monsters, direct attack, LP deduction
- **Win condition**: player drops to 0 LP
- Premium dark themed UI

---

## 🚀 Running Locally

### Prerequisites
- [Node.js 18+](https://nodejs.org/) and npm

### 1. Backend
```bash
cd backend
npm install
npm start
# Runs on http://localhost:3001
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# Opens on http://localhost:5173
```

### 3. Play!
1. Open **two browser tabs** at `http://localhost:5173`
2. **Tab 1**: Register as Player 1 → Create Room → Note the Room ID
3. **Tab 2**: Register as Player 2 → Join Room → Enter Room ID
4. Tab 1: Enter the room → both players connect → game starts!

---

## 🎮 How to Play

| Phase | Action |
|-------|--------|
| **Draw Phase** | Click **🃏 Draw** to draw a card |
| **Main Phase** | Click a card in your hand → click an empty field slot to summon |
| **Battle Phase** | Click **⚔ Battle Phase** → click one of your monsters → click opponent's monster or use Direct Attack |
| **End Turn** | Click **⏭ End Turn** to pass to your opponent |

**LP (Life Points)**: Both players start with 8000 LP. When your LP reaches 0, you lose!

---

## 🌐 Deploying to Render.com

### Method 1: render.yaml (Recommended)
4. Render will read `render.yaml` and create both services.

> [!NOTE]
> **Persistence**: On the Render Free tier, the `users.json` file will be reset every time the server restarts. For a permanent user database, you would later upgrade to a persistent disk or a managed database like Postgres.

### Method 2: Manual
**Backend:**
1. New → Web Service → Connect your GitHub repo
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add env var: `JWT_SECRET` (any random string)

**Frontend:**
1. New → Static Site → Connect your GitHub repo
2. Root Directory: `frontend`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Add env vars:
   - `VITE_API_URL` = `https://YOUR-BACKEND-NAME.onrender.com`
   - `VITE_WS_URL` = `wss://YOUR-BACKEND-NAME.onrender.com`

---

## 📁 Project Structure

```
game yu gi oh/
├── backend/
│   ├── src/
│   │   ├── server.js      # Express + WebSocket server
│   │   ├── auth.js        # Registration/Login routes
│   │   ├── rooms.js       # Room management routes
│   │   ├── gameLogic.js   # Game mechanics
│   │   └── cards.js       # 20 monster card definitions
│   ├── .env               # JWT_SECRET, PORT
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── context/GameContext.jsx  # WebSocket + game state
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── LobbyPage.jsx
│   │       └── GamePage.jsx
│   ├── .env               # VITE_API_URL, VITE_WS_URL
│   └── package.json
├── render.yaml
└── README.md
```

---

## 🔮 Future Features
- Spell cards (damage, heal, draw extra)
- Trap cards (counter attacks)
- Card images / artwork
- Spectator mode
- Leaderboard
