import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { GameProvider, useGame } from '../context/GameContext';

export default function GamePage() {
  const { roomId, playerKey } = useParams();
  return (
    <GameProvider roomId={roomId} playerKey={playerKey}>
      <GameBoard />
    </GameProvider>
  );
}

function GameBoard() {
  const navigate = useNavigate();
  const {
    gameState, status, error,
    myState, oppState, isMyTurn, phase, playerKey, opponentKey,
    drawCard, summonMonster, goToBattle, attackMonster, directAttack, endTurn,
  } = useGame();

  // UI state for card/slot selection
  const [selectedHandCard, setSelectedHandCard] = useState(null); // cardId
  const [selectedHandIndex, setSelectedHandIndex] = useState(null);
  const [attackMode, setAttackMode] = useState(false);
  const [attackerSlot, setAttackerSlot] = useState(null);
  const [localError, setLocalError] = useState(null);
  const logEndRef = useRef(null);

  // Helper for temporary local errors
  const triggerLocalError = (msg) => {
    setLocalError(msg);
    setTimeout(() => setLocalError(null), 3000);
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState?.log]);

  // Reset selection on turn change or phase change
  useEffect(() => {
    setSelectedHandCard(null);
    setSelectedHandIndex(null);
    setAttackMode(false);
    setAttackerSlot(null);
  }, [gameState?.turn, gameState?.phase]);

  if (status === 'connecting') {
    return (
      <div className="waiting-screen">
        <div className="spinner" />
        <h2>جاري الاتصال بالخادم...</h2>
      </div>
    );
  }

  if (status === 'waiting') {
    const roomId = gameState?.room_id || window.location.pathname.split('/')[2];
    return (
      <div className="waiting-screen">
        <h2 style={{ fontFamily: 'Cairo, Cinzel, serif', color: 'var(--gold)' }}>⚔ ديول ماسترز أونلاين</h2>
        <div className="spinner" />
        <h2>في انتظار الخصم...</h2>
        <div className="alert alert-info" style={{ maxWidth: 400 }}>
          💡 نصيحة: استخدم <b>وضع التصفح الخفي</b> أو <b>متصفحاً مختلفاً</b> لاختبار اللعب المتعدد على نفس الجهاز!
        </div>
        <div className="room-id-display" style={{ minWidth: 240 }}
          onClick={() => navigator.clipboard.writeText(window.location.pathname.split('/')[2]).catch(()=>{})}>
          <div className="room-id-label">شارك معرف الغرفة هذا</div>
          <div className="room-id-value">{window.location.pathname.split('/')[2]}</div>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/lobby')}>← العودة إلى الردهة</button>
      </div>
    );
  }

  if (!gameState || !myState || !oppState) {
    return (
      <div className="waiting-screen">
        <div className="spinner" />
        <h2>جاري تحميل اللعبة...</h2>
      </div>
    );
  }

  const winner = gameState.winner;
  const myUsername = myState.username;
  const oppUsername = oppState.username;
  const myLP = myState.lp;
  const oppLP = oppState.lp;
  const maxLP = 8000;

  const canDraw = isMyTurn && phase === 'draw';
  const canSummon = isMyTurn && phase === 'main' && !myState.summonedThisTurn;
  const canGoToBattle = isMyTurn && phase === 'main';
  const canEndTurn = isMyTurn && phase !== 'draw';
  const inBattlePhase = isMyTurn && phase === 'battle';

  function handleHandCardClick(card, idx) {
    if (!isMyTurn) {
      triggerLocalError("It is not your turn!");
      return;
    }
    if (phase === 'draw') {
      triggerLocalError("You must Draw a card first!");
      return;
    }
    if (phase === 'battle') {
      triggerLocalError("Cannot summon during Battle Phase!");
      return;
    }
    if (myState.summonedThisTurn) {
      triggerLocalError("Already summoned a monster this turn.");
      return;
    }

    if (selectedHandCard === card.id) {
      setSelectedHandCard(null);
      setSelectedHandIndex(null);
    } else {
      setSelectedHandCard(card.id);
      setSelectedHandIndex(idx);
    }
  }

  function handleMyFieldSlotClick(slotIdx) {
    if (inBattlePhase && !attackMode && myState.field[slotIdx]) {
      const monster = myState.field[slotIdx];
      if (monster.justSummoned) {
        triggerLocalError("This monster was just summoned and cannot attack yet!");
        return;
      }
      if (myState.attackedThisTurn) {
        triggerLocalError("You have already performed an attack this turn.");
        return;
      }
      setAttackMode(true);
      setAttackerSlot(slotIdx);
      return;
    }

    if (!isMyTurn) return;
    if (phase === 'draw') {
      triggerLocalError("Click DRAW to begin your turn.");
      return;
    }
    
    if (selectedHandCard === null) {
      if (canSummon) triggerLocalError("Select a card from your hand first!");
      return;
    }

    if (!canSummon) {
      if (myState.summonedThisTurn) triggerLocalError("Already summoned this turn.");
      return;
    }

    if (myState.field[slotIdx] !== null) {
      triggerLocalError("This slot is occupied!");
      return;
    }

    summonMonster(selectedHandCard, slotIdx);
    setSelectedHandCard(null);
    setSelectedHandIndex(null);
  }

  function handleOppFieldSlotClick(slotIdx) {
    if (!attackMode || attackerSlot === null) return;
    const target = oppState.field[slotIdx];
    if (!target) return;
    attackMonster(attackerSlot, slotIdx);
    setAttackMode(false);
    setAttackerSlot(null);
  }

  function handleDirectAttack() {
    if (!attackMode || attackerSlot === null) return;
    directAttack(attackerSlot);
    setAttackMode(false);
    setAttackerSlot(null);
  }

  function handleCancelAttack() {
    setAttackMode(false);
    setAttackerSlot(null);
  }

  const oppHasMonsters = oppState.field.some(s => s !== null);

  return (
    <div className="game-page">
      {/* Winner Overlay */}
      {winner && (
        <div className="winner-overlay">
          <div className="winner-card">
            {winner === 'draw' ? (
              <>
                <h2>🤝 تعادل!</h2>
                <p>تمت هزيمة كلا اللاعبين!</p>
              </>
            ) : winner === playerKey ? (
              <>
                <h2>🏆 انتصار!</h2>
                <p>لقد هزمت خصمك!</p>
              </>
            ) : (
              <>
                <h2>💀 هزيمة!</h2>
                <p>لقد فاز {oppUsername} بالمبارزة!</p>
              </>
            )}
            <button className="btn btn-gold" style={{ padding: '14px 40px', fontSize: '1rem' }}
              onClick={() => navigate('/lobby')}>
              🏠 العودة إلى الردهة
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="phase-banner">
        <div className="game-title">⚔ ديول ماسترز أونلاين</div>
        <div className="phase-info">
          <span className={`turn-badge ${isMyTurn ? 'your-turn' : 'opponent-turn'}`}>
            {isMyTurn ? '⚔ دورك' : `دور ${oppUsername}`}
          </span>
          <span className={`phase-badge phase-${phase}`}>
            {phase === 'draw' ? '🃏 سحب' : phase === 'main' ? '⚙ الرئيسي' : '⚡ القتال'}
          </span>
          <div className="deck-badge">🃏 متبقي <span>{myState.deck.length}</span></div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/lobby')}>← الردهة</button>
      </div>

      {/* Error toast */}
      {error && (
        <div className="alert alert-error" style={{ margin: '8px 12px 0', flexShrink: 0 }}>
          ⚠ {error}
        </div>
      )}

      {/* Battlefield */}
      <div className="battlefield">
        {/* Opponent LP */}
        <div className="lp-bar-container">
          <div className="lp-username opponent">🗡 {oppUsername}</div>
          <div className="lp-track">
            <div className="lp-fill opponent" style={{ width: `${Math.max(0, (oppLP / maxLP) * 100)}%` }} />
          </div>
          <div className="lp-value opponent">{Math.max(0, oppLP)}</div>
          <div className="deck-badge">🃏 <span>{oppState.deck.length}</span></div>
        </div>

        {/* Opponent Hand (face-down) */}
        <div className="hand-section">
          <div className="section-label">يد الخصم ({oppState.hand.length} بطاقات)</div>
          <div className="hand-cards" style={{ minHeight: 64 }}>
            {oppState.hand.map((_, i) => (
              <div key={i} className="monster-card back" style={{ width: 48, height: 68 }} />
            ))}
            {oppState.hand.length === 0 && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', alignSelf: 'center' }}>لا توجد بطاقات</span>
            )}
          </div>
        </div>

        {/* Opponent Field */}
        <div className="field-section">
          <div className="section-label" style={{ textAlign: 'center' }}>ساحة الخصم</div>
          <div className="field-row">
            <div className="field-slots">
              {oppState.field.map((monster, idx) => (
                <div
                  key={idx}
                  id={`opp-field-${idx}`}
                  className={`field-slot ${monster ? 'has-monster' : ''} ${attackMode && monster ? 'selectable-target' : ''}`}
                  onClick={() => handleOppFieldSlotClick(idx)}
                  style={{ cursor: attackMode && monster ? 'crosshair' : 'default' }}
                >
                  {monster ? (
                    <FieldMonsterCard monster={monster} isOpponent />
                  ) : (
                    <span className="field-slot-number">{idx + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="field-divider" />

        {/* My Field */}
        <div className="field-section">
          <div className="section-label" style={{ textAlign: 'center' }}>Your Field</div>
          <div className="field-row">
            <div className="field-slots">
              {myState.field.map((monster, idx) => (
                <div
                  key={idx}
                  id={`my-field-${idx}`}
                  className={`field-slot ${monster ? 'has-monster' : ''} ${!monster && canSummon && selectedHandCard !== null ? 'empty-player' : ''} ${inBattlePhase && monster && !monster.justSummoned && !myState.attackedThisTurn ? 'empty-player' : ''}`}
                  onClick={() => handleMyFieldSlotClick(idx)}
                >
                  {monster ? (
                    <FieldMonsterCard
                      monster={monster}
                      canAttack={inBattlePhase && !monster.justSummoned && !myState.attackedThisTurn}
                      isSelected={attackMode && attackerSlot === idx}
                    />
                  ) : (
                    <span className="field-slot-number">
                      {canSummon && selectedHandCard !== null ? '+' : idx + 1}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attack mode banner */}
        {attackMode && (
          <div className="attack-select-banner">
            {oppHasMonsters
              ? '⚔ اختر وحشاً من وحوش الخصم للهجوم، أو هجوم مباشر إذا كانت الساحة خالية'
              : '⚡ الخصم ليس لديه وحوش — استخدم الهجوم المباشر!'}
            <button className="btn btn-outline btn-sm" style={{ marginLeft: 12 }} onClick={handleCancelAttack}>
              إلغاء
            </button>
          </div>
        )}

        {/* My Hand */}
        <div className="hand-section">
          <div className="section-label">يدك ({myState.hand.length} بطاقات)</div>
          <div className="hand-cards">
            {myState.hand.map((card, i) => (
              <MonsterHandCard
                key={card.id + '-' + i}
                card={card}
                selected={selectedHandCard === card.id}
                disabled={!canSummon}
                onClick={() => handleHandCardClick(card, i)}
              />
            ))}
            {myState.hand.length === 0 && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', alignSelf: 'center' }}>
                لا توجد بطاقات في اليد
              </span>
            )}
          </div>
          {selectedHandCard !== null && canSummon && (
            <div style={{ fontSize: '0.75rem', color: 'var(--gold)', paddingLeft: 8 }}>
              ✨ تم اختيار البطاقة — انقر على فتحة فارغة في الساحة للاستدعاء
            </div>
          )}
        </div>

        {/* My LP */}
        <div className="lp-bar-container">
          <div className="lp-username player">🛡 {myUsername}</div>
          <div className="lp-track">
            <div className="lp-fill player" style={{ width: `${Math.max(0, (myLP / maxLP) * 100)}%` }} />
          </div>
          <div className="lp-value player">{Math.max(0, myLP)}</div>
        </div>

        {/* Error toast */}
        {(error || localError) && (
          <div className="alert alert-error" style={{ margin: '8px 12px 0', flexShrink: 0, border: '2px solid #ff4040', animation: 'shake 0.5s' }}>
            ⚠ {error || localError}
          </div>
        )}

        {/* Battle Log */}
        <div className="battle-log">
          {(gameState.log || []).map((entry, i) => (
            <div key={i} className="log-entry">{entry}</div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="action-buttons">
          <button
            id="draw-btn"
            className={`btn btn-primary ${canDraw ? 'pulse-gold' : ''}`}
            onClick={drawCard}
            disabled={!canDraw}
          >
            🃏 سحب
          </button>
          <button
            id="battle-btn"
            className="btn btn-danger"
            onClick={goToBattle}
            disabled={!canGoToBattle}
          >
            ⚔ مرحلة القتال
          </button>
          {attackMode && !oppHasMonsters && (
            <button
              id="direct-attack-btn"
              className="btn btn-danger"
              onClick={handleDirectAttack}
            >
              ⚡ هجوم مباشر
            </button>
          )}
          <button
            id="end-turn-btn"
            className="btn btn-outline"
            onClick={endTurn}
            disabled={!canEndTurn}
          >
            ⏭ إنهاء الدور
          </button>
        </div>
        <div className="action-hint">
          {!isMyTurn && `في انتظار ${oppUsername}...`}
          {isMyTurn && phase === 'draw' && 'اسحب بطاقة لبدء دورك.'}
          {isMyTurn && phase === 'main' && !myState.summonedThisTurn && 'اختر بطاقة من يدك، ثم انقر على فتحة في الساحة للاستدعاء.'}
          {isMyTurn && phase === 'main' && myState.summonedThisTurn && 'ادخل مرحلة القتال للهجوم، أو أنهِ دورك.'}
          {isMyTurn && phase === 'battle' && !attackMode && 'انقر على وحش في ساحتك للهجوم به.'}
        </div>
      </div>
    </div>
  );
}

function MonsterHandCard({ card, selected, disabled, onClick }) {
  const hue = getHueFromColor(card.color);
  return (
    <div
      id={`hand-card-${card.id}`}
      className={`monster-card ${selected ? 'selected' : ''}`}
      style={{
        background: `linear-gradient(160deg, ${card.color}dd 0%, ${card.color}88 60%, #0a0a20 100%)`,
        '--card-glow': card.color + '88',
        opacity: disabled && !selected ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={disabled ? undefined : onClick}
      title={`${card.name} | ATK: ${card.atk} | ${card.type}`}
    >
      <div className="card-name-label">{card.name}</div>
      <div className="card-atk-label">⚔ {card.atk}</div>
    </div>
  );
}

function FieldMonsterCard({ monster, isOpponent, canAttack, isSelected }) {
  return (
    <div
      className={`field-monster ${canAttack ? 'can-attack' : ''} ${monster.justSummoned ? 'just-summoned' : ''} ${isSelected ? 'selectable-target' : ''}`}
      style={{
        background: `linear-gradient(160deg, ${monster.color}dd 0%, ${monster.color}66 60%, #0a0a20 100%)`,
        border: `2px solid ${isSelected ? '#ff4040' : monster.color}`,
        width: 86,
        height: 106,
      }}
      title={`${monster.name} | ATK: ${monster.atk}`}
    >
      {monster.justSummoned && <div className="just-summoned-badge">جديد</div>}
      <div className="card-name-label">{monster.name}</div>
      <div className="card-atk-label">⚔ {monster.atk}</div>
    </div>
  );
}

function getHueFromColor(hex) {
  return hex;
}
