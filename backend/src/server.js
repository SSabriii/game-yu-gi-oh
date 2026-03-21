require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const { URL } = require('url');

const authRouter = require('./auth');
const { router: roomsRouter, rooms } = require('./rooms');
const {
  createGameState,
  drawCard,
  summonMonster,
  setSpellTrap,
  activateSpell,
  attackMonster,
  directAttack,
  goToBattlePhase,
  endTurn,
} = require('./gameLogic');

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// ----- Express setup -----
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);

// ----- Serve Frontend Static Files -----
const distPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(distPath));

// For any other GET request, serve the React app's index.html (client-side routing)
app.get('*', (req, res, next) => {
  // Only serve index.html if it's not an API route and it's a GET request
  if (req.url.startsWith('/api') || req.method !== 'GET') {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// ----- HTTP + WebSocket server -----
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// gameStates: roomId -> GameState
const gameStates = new Map();

// wsClients: roomId -> { player1: ws, player2: ws }
const wsClients = new Map();

// Map ws -> { username, roomId, playerKey }
const wsInfo = new Map();

function broadcast(roomId, payload) {
  const clients = wsClients.get(roomId);
  if (!clients) return;
  const msg = JSON.stringify(payload);
  for (const [, ws] of Object.entries(clients)) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

function sendError(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'error', message }));
  }
}

wss.on('connection', (ws, req) => {
  // Extract token and roomId from query params
  let token, roomId;
  try {
    const urlParams = new URL(req.url, `http://localhost`).searchParams;
    token = urlParams.get('token');
    roomId = urlParams.get('roomId');
  } catch {
    ws.close(1008, 'طلب غير صالح');
    return;
  }

  // Verify JWT
  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch {
    ws.close(1008, 'غير مصرح');
    return;
  }

  // Validate room
  const room = rooms.get(roomId?.toUpperCase());
  if (!room) {
    ws.close(1008, 'الغرفة غير موجودة');
    return;
  }

  // Determine player key
  let playerKey;
  if (room.player1 === user.username) playerKey = 'player1';
  else if (room.player2 === user.username) playerKey = 'player2';
  else {
    ws.close(1008, 'أنت لست في هذه الغرفة');
    return;
  }

  roomId = roomId.toUpperCase();

  // Register client
  if (!wsClients.has(roomId)) wsClients.set(roomId, {});
  wsClients.get(roomId)[playerKey] = ws;
  wsInfo.set(ws, { username: user.username, roomId, playerKey });

  console.log(`[WS] ${user.username} (${playerKey}) connected to room ${roomId}`);

  // If both players are connected, start the game
  const clients = wsClients.get(roomId);
  if (clients.player1 && clients.player2 && !gameStates.has(roomId)) {
    const state = createGameState(roomId, room.player1, room.player2);
    gameStates.set(roomId, state);
    broadcast(roomId, { type: 'game_start', state });
    console.log(`[GAME] Room ${roomId} started: ${room.player1} vs ${room.player2}`);
  } else if (gameStates.has(roomId)) {
    // Reconnecting — send current state
    ws.send(JSON.stringify({ type: 'game_state', state: gameStates.get(roomId) }));
  } else {
    ws.send(JSON.stringify({ type: 'waiting', message: 'في انتظار انضمام الخصم...' }));
  }

  ws.on('message', (raw) => {
    try {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return sendError(ws, 'صيغة رسالة غير صالحة.');
      }

      const info = wsInfo.get(ws);
      if (!info) return;
      const { roomId, playerKey } = info;
      const state = gameStates.get(roomId);

      if (!state) return sendError(ws, 'اللعبة لم تبدأ بعد.');
      if (state.winner) return sendError(ws, 'انتهت اللعبة بالفعل.');

      let result;

      switch (msg.type) {
        case 'draw_card':
          result = drawCard(state, playerKey);
          break;

        case 'summon_monster':
          result = summonMonster(state, playerKey, msg.cardId, msg.slotIndex, msg.tributeIndices || []);
          break;

        case 'set_spell_trap':
          result = setSpellTrap(state, playerKey, msg.cardId, msg.slotIndex);
          break;

        case 'activate_spell':
          result = activateSpell(state, playerKey, msg.cardId, msg.slotIndex);
          break;

        case 'go_to_battle':
          result = goToBattlePhase(state, playerKey);
          break;

        case 'attack_monster':
          result = attackMonster(state, playerKey, msg.attackerSlot, msg.defenderSlot);
          break;

        case 'direct_attack':
          result = directAttack(state, playerKey, msg.attackerSlot);
          break;

        case 'end_turn':
          result = endTurn(state, playerKey);
          break;

        default:
          return sendError(ws, `نوع حدث غير معروف: ${msg.type}`);
      }

      if (result && result.error) {
        return sendError(ws, result.error);
      }

      broadcast(roomId, { type: 'game_state', state });
    } catch (err) {
      console.error('[WS] Message handler error:', err);
      sendError(ws, 'حدث خطأ في الخادم. حاول مرة أخرى.');
    }
  });

  ws.on('close', () => {
    const info = wsInfo.get(ws);
    if (info) {
      console.log(`[WS] ${info.username} disconnected from room ${info.roomId}`);
      const clients = wsClients.get(info.roomId);
      if (clients) clients[info.playerKey] = null;
      wsInfo.delete(ws);
    }
  });

  ws.on('error', (err) => {
    console.error('[WS] Error:', err.message);
  });
});

server.listen(PORT, () => {
  console.log(`🎴 Yu-Gi-Oh! server running on http://localhost:${PORT}`);
});
