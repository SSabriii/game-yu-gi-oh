const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const router = express.Router();

// In-memory rooms: roomId -> { player1, player2, createdAt }
const rooms = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
}

// Create a new room
router.post('/', authMiddleware, (req, res) => {
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  rooms.set(roomId, {
    roomId,
    player1: req.user.username,
    player2: null,
    createdAt: Date.now(),
  });
  res.json({ roomId, player: 'player1' });
});

// Join an existing room
router.post('/:id/join', authMiddleware, (req, res) => {
  const room = rooms.get(req.params.id.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }
  if (room.player2) {
    // Allow rejoining if same player
    if (room.player1 === req.user.username) return res.json({ roomId: room.roomId, player: 'player1' });
    if (room.player2 === req.user.username) return res.json({ roomId: room.roomId, player: 'player2' });
    return res.status(409).json({ error: 'Room is full.' });
  }
  if (room.player1 === req.user.username) {
    return res.status(400).json({ error: 'You cannot join your own room as player 2.' });
  }
  room.player2 = req.user.username;
  res.json({ roomId: room.roomId, player: 'player2' });
});

// Get room info
router.get('/:id', authMiddleware, (req, res) => {
  const room = rooms.get(req.params.id.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  res.json(room);
});

module.exports = { router, rooms };
