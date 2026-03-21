import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const GameContext = createContext(null);

const DEFAULT_WS_URL = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host;
const WS_URL = import.meta.env.VITE_WS_URL || DEFAULT_WS_URL;

export function GameProvider({ roomId, playerKey, children }) {
  const [gameState, setGameState] = useState(null);
  const [status, setStatus] = useState('connecting'); // connecting | waiting | playing | over
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !roomId) return;

    const ws = new WebSocket(`${WS_URL}?token=${token}&roomId=${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setError(null);
      setStatus('connecting');
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'waiting':
          setStatus('waiting');
          break;
        case 'game_start':
        case 'game_state':
          setGameState(msg.state);
          if (msg.state.winner) {
            setStatus('over');
          } else {
            setStatus('playing');
          }
          break;
        case 'error':
          setError(msg.message); // This will come from backend eventually, but local ones below
          setTimeout(() => setError(null), 4000);
          break;
        default:
          break;
      }
    };

    ws.onerror = () => {
      setError('خطأ في الاتصال (WebSocket).');
      setStatus('error');
    };

    ws.onclose = () => {
      if (status !== 'over') setStatus('disconnected');
    };

    return () => {
      ws.close();
    };
  }, [roomId]);

  const sendAction = useCallback((type, payload = {}) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setError('عذراً، أنت غير متصل بالخادم.');
      return;
    }
    ws.send(JSON.stringify({ type, ...payload }));
  }, []);

  const drawCard = useCallback(() => sendAction('draw_card'), [sendAction]);
  const summonMonster = useCallback((cardId, slotIndex, tributeIndices = []) => sendAction('summon_monster', { cardId, slotIndex, tributeIndices }), [sendAction]);
  const setSpellTrap = useCallback((cardId, slotIndex) => sendAction('set_spell_trap', { cardId, slotIndex }), [sendAction]);
  const activateSpell = useCallback((cardId, slotIndex) => sendAction('activate_spell', { cardId, slotIndex }), [sendAction]);
  const goToBattle = useCallback(() => sendAction('go_to_battle'), [sendAction]);
  const attackMonster = useCallback((attackerSlot, defenderSlot) => sendAction('attack_monster', { attackerSlot, defenderSlot }), [sendAction]);
  const directAttack = useCallback((attackerSlot) => sendAction('direct_attack', { attackerSlot }), [sendAction]);
  const endTurn = useCallback(() => sendAction('end_turn'), [sendAction]);

  const myState = gameState?.[playerKey];
  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
  const oppState = gameState?.[opponentKey];
  const isMyTurn = gameState?.turn === playerKey;
  const phase = gameState?.phase;

  return (
    <GameContext.Provider value={{
      gameState, status, error, playerKey, opponentKey,
      myState, oppState, isMyTurn, phase,
      drawCard, summonMonster, setSpellTrap, activateSpell, goToBattle, attackMonster, directAttack, endTurn,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
