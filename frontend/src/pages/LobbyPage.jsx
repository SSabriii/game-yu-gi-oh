import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function LobbyPage() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Duelist';
  const token = localStorage.getItem('token');

  const [createdRoomId, setCreatedRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleCreateRoom() {
    setCreateError('');
    setCreateLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/rooms`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error); return; }
      setCreatedRoomId(data.roomId);
    } catch {
      setCreateError('Cannot connect to server.');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleJoinRoom() {
    const rid = joinRoomId.trim().toUpperCase();
    if (!rid) { setJoinError('Enter a room ID.'); return; }
    setJoinError('');
    setJoinLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/rooms/${rid}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setJoinError(data.error); return; }
      navigate(`/game/${data.roomId}/player2`);
    } catch {
      setJoinError('Cannot connect to server.');
    } finally {
      setJoinLoading(false);
    }
  }

  function handleEnterRoom() {
    navigate(`/game/${createdRoomId}/player1`);
  }

  function handleCopyRoomId() {
    navigator.clipboard.writeText(createdRoomId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <div className="lobby-page">
      {/* Nav */}
      <div className="nav-bar" style={{ marginBottom: 40 }}>
        <div className="nav-logo">⚔ DuelMasters Online</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Logged in as <span className="text-gold" style={{ fontWeight: 700 }}>{username}</span>
          </span>
          <button id="logout-btn" className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="lobby-header">
        <h1>⚑ Game Lobby</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>
          Create a room to duel, or join an existing one with a Room ID
        </p>
      </div>

      <div className="lobby-actions">
        {/* Create Room Card */}
        <div className="lobby-action-card">
          <h2>🗡 Create a Duel</h2>
          <p>Host a game room and share the Room ID with your opponent to begin the duel.</p>

          {createError && <div className="alert alert-error">{createError}</div>}

          {!createdRoomId ? (
            <button
              id="create-room-btn"
              className="btn btn-gold w-full"
              onClick={handleCreateRoom}
              disabled={createLoading}
              style={{ padding: '14px' }}
            >
              {createLoading ? 'Creating...' : '⚔ Create Room'}
            </button>
          ) : (
            <>
              <div className="alert alert-info">
                Share this Room ID with your opponent!
              </div>
              <div
                id="room-id-display"
                className="room-id-display"
                onClick={handleCopyRoomId}
                title="Click to copy"
              >
                <div className="room-id-label">🔑 Room ID {copied ? '(Copied!)' : '(Click to copy)'}</div>
                <div className="room-id-value">{createdRoomId}</div>
              </div>
              <button
                id="enter-room-btn"
                className="btn btn-primary w-full"
                onClick={handleEnterRoom}
                style={{ padding: '14px' }}
              >
                🚪 Enter Room & Wait for Opponent
              </button>
            </>
          )}
        </div>

        {/* Join Room Card */}
        <div className="lobby-action-card">
          <h2>🛡 Join a Duel</h2>
          <p>Enter the Room ID provided by your opponent to join their game room.</p>

          {joinError && <div className="alert alert-error">{joinError}</div>}

          <div className="form-group">
            <label className="form-label">Room ID</label>
            <input
              id="join-room-input"
              className="form-input"
              type="text"
              placeholder="e.g. A1B2C3D4"
              value={joinRoomId}
              onChange={e => setJoinRoomId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
              maxLength={8}
              style={{ letterSpacing: '4px', fontFamily: 'Cinzel, serif', fontSize: '1.1rem' }}
            />
          </div>

          <button
            id="join-room-btn"
            className="btn btn-gold w-full"
            onClick={handleJoinRoom}
            disabled={joinLoading}
            style={{ padding: '14px' }}
          >
            {joinLoading ? 'Joining...' : '⚔ Join Room'}
          </button>
        </div>
      </div>
    </div>
  );
}
