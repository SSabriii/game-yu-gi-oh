const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const DB_PATH = path.join(__dirname, '..', 'users.json');

// Helper to read users from JSON file
function readUsers() {
  if (!fs.existsSync(DB_PATH)) {
    return [];
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// Helper to write users to JSON file
function writeUsers(users) {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf8');
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be 3–20 characters.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters.' });
  }

  const users = readUsers();
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'Username already taken.' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now(),
      username,
      password_hash: hash,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    writeUsers(users);
    
    const token = generateToken(newUser);
    res.json({ token, username });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  try {
    const users = readUsers();
    const user = users.find(u => u.username === username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = generateToken(user);
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
