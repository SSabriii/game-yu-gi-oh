import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

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
      setCreateError('عذراً، لا يمكن الاتصال بالخادم.');
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
      setJoinError('عذراً، لا يمكن الاتصال بالخادم.');
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

  const translations = {
    navLogo: '⚔ ديول ماسترز أونلاين',
    loggedInAs: 'تم تسجيل الدخول باسم',
    logout: 'تسجيل الخروج',
    lobbyHeader: '⚑ ردهة اللعبة',
    lobbySub: 'قم بإنشاء مبارزة، أو انضم إلى غرف موجودة باستخدام معرف الغرفة',
    createTitle: '🗡 إنشاء مبارزة',
    createSub: 'استضف غرفة ألعاب وشارك معرف الغرفة مع خصمك لبدء المبارزة.',
    createBtn: '⚔ إنشاء غرفة',
    creatingBtn: 'جاري الإنشاء...',
    shareId: 'شارك معرف الغرفة هذا مع خصمك!',
    roomIdLabel: '🔑 معرف الغرفة',
    copySuccess: '(تم النسخ!)',
    copyHint: '(انقر للنسخ)',
    enterRoom: '🚪 دخول الغرفة وانتظار الخصم',
    joinTitle: '🛡 انضمام إلى مبارزة',
    joinSub: 'أدخل معرف الغرفة الذي قدمه خصمك للانضمام إلى غرفة اللعبة الخاصة به.',
    joinBtn: '⚔ انضمام إلى الغرفة',
    joiningBtn: 'جاري الانضمام...',
    enterRoomId: 'أدخل معرف الغرفة.'
  };

  return (
    <div className="lobby-page">
      {/* Nav */}
      <div className="nav-bar" style={{ marginBottom: 40 }}>
        <div className="nav-logo">{translations.navLogo}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {translations.loggedInAs} <span className="text-gold" style={{ fontWeight: 700 }}>{username}</span>
          </span>
          <button id="logout-btn" className="btn btn-outline btn-sm" onClick={handleLogout}>{translations.logout}</button>
        </div>
      </div>

      <div className="lobby-header">
        <h1>{translations.lobbyHeader}</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>
          {translations.lobbySub}
        </p>
      </div>

      <div className="lobby-actions">
        {/* Create Room Card */}
        <div className="lobby-action-card">
          <h2>{translations.createTitle}</h2>
          <p>{translations.createSub}</p>

          {createError && <div className="alert alert-error">{createError}</div>}

          {!createdRoomId ? (
            <button
              id="create-room-btn"
              className="btn btn-gold w-full"
              onClick={handleCreateRoom}
              disabled={createLoading}
              style={{ padding: '14px' }}
            >
              {createLoading ? translations.creatingBtn : translations.createBtn}
            </button>
          ) : (
            <>
              <div className="alert alert-info">
                {translations.shareId}
              </div>
              <div
                id="room-id-display"
                className="room-id-display"
                onClick={handleCopyRoomId}
                title={translations.copyHint}
              >
                <div className="room-id-label">{translations.roomIdLabel} {copied ? translations.copySuccess : translations.copyHint}</div>
                <div className="room-id-value">{createdRoomId}</div>
              </div>
              <button
                id="enter-room-btn"
                className="btn btn-primary w-full"
                onClick={handleEnterRoom}
                style={{ padding: '14px' }}
              >
                {translations.enterRoom}
              </button>
            </>
          )}
        </div>

        {/* Join Room Card */}
        <div className="lobby-action-card">
          <h2>{translations.joinTitle}</h2>
          <p>{translations.joinSub}</p>

          {joinError && <div className="alert alert-error">{joinError}</div>}

          <div className="form-group">
            <label className="form-label">{translations.roomIdLabel}</label>
            <input
              id="join-room-input"
              className="form-input"
              type="text"
              placeholder="مثلاً A1B2C3D4"
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
            {joinLoading ? translations.joiningBtn : translations.joinBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
