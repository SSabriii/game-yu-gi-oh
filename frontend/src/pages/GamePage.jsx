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

const getCardImage = (card) => {
  if (!card) return null;
  const name = card.name || "";
  if (name.includes("نار") || name.includes("بركان") || name.includes("شمس")) return "/assets/cards/fire.png";
  if (name.includes("ثلج") || name.includes("جليد")) return "/assets/cards/ice.png";
  if (name.includes("ريح") || name.includes("برق") || name.includes("عاصفة")) return "/assets/cards/wind.png";
  if (name.includes("ظلال") || name.includes("ليل") || name.includes("غابة") || name.includes("ظلام")) return "/assets/cards/shadow.png";
  if (name.includes("نور") || name.includes("ملاك") || name.includes("شفاء")) return "/assets/cards/light.png";
  if (name.includes("بحر") || name.includes("ماء") || name.includes("بحيرة") || name.includes("طوفان")) return "/assets/cards/sea.png";
  
  if (card.type === "Spell") return "/assets/cards/light.png";
  if (card.type === "Trap") return "/assets/cards/shadow.png";
  return "/assets/cards/fire.png"; // default
};

function GameBoard() {
  const navigate = useNavigate();
  const {
    gameState, status, error,
    myState, oppState, isMyTurn, phase, playerKey, opponentKey,
    drawCard, summonMonster, setSpellTrap, activateSpell, goToBattle, attackMonster, directAttack, endTurn,
  } = useGame();

  // UI state for card/slot selection
  const [selectedHandCard, setSelectedHandCard] = useState(null); // cardId
  const [selectedHandIndex, setSelectedHandIndex] = useState(null);
  const [tributeNeeded, setTributeNeeded] = useState(0);
  const [tributeIndices, setTributeIndices] = useState([]);
  const [targetSlot, setTargetSlot] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
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
      triggerLocalError("ليس دورك!");
      return;
    }
    if (phase === 'draw') {
      triggerLocalError("يجب أن تسحب بطاقة أولاً!");
      return;
    }
    if (phase === 'battle') {
      triggerLocalError("لا يمكن الاستدعاء في مرحلة القتال!");
      return;
    }
    // Only block Monster selection if already summoned; Spells/Traps can always be selected
    if (card.type === 'Monster' && myState.summonedThisTurn) {
      triggerLocalError("لقد استدعيت وحشاً بالفعل في هذا الدور.");
      return;
    }

    if (selectedHandCard === card.id) {
      setSelectedHandCard(null);
      setSelectedHandIndex(null);
      setHoveredCard(null);
    } else {
      setSelectedHandCard(card.id);
      setSelectedHandIndex(idx);
      setHoveredCard(card);
    }
  }

  function handleMyFieldSlotClick(slotIdx) {
    if (tributeNeeded > 0) {
      if (myState.field[slotIdx] === null) {
        triggerLocalError("يجب أن تختار وحشاً للتضحية!");
        return;
      }
      if (tributeIndices.includes(slotIdx)) {
        setTributeIndices(prev => prev.filter(i => i !== slotIdx));
      } else {
        if (tributeIndices.length < tributeNeeded) {
          const newIndices = [...tributeIndices, slotIdx];
          setTributeIndices(newIndices);
          
          // Auto-summon if we have enough tributes
          if (newIndices.length === tributeNeeded) {
            summonMonster(selectedHandCard, targetSlot, newIndices);
            setSelectedHandCard(null);
            setSelectedHandIndex(null);
            setTributeNeeded(0);
            setTributeIndices([]);
            setTargetSlot(null);
          }
        }
      }
      return;
    }

    if (inBattlePhase && !attackMode && myState.field[slotIdx]) {
      const monster = myState.field[slotIdx];
      if (monster.justSummoned) {
        triggerLocalError("تم استدعاء هذا الوحش تواً ولا يمكنه الهجوم بعد!");
        return;
      }
      if (myState.attackedThisTurn) {
        triggerLocalError("لقد قمت بالهجوم بالفعل في هذا الدور.");
        return;
      }
      setAttackMode(true);
      setAttackerSlot(slotIdx);
      return;
    }

    if (!isMyTurn) return;
    if (phase === 'draw') {
      triggerLocalError("انقر على 'سحب' لبدء دورك.");
      return;
    }
    
    if (selectedHandCard === null) {
      if (canSummon) triggerLocalError("اختر بطاقة من يدك أولاً!");
      return;
    }

    const card = myState.hand[selectedHandIndex];
    if (card.type !== 'Monster') {
      triggerLocalError("هذا ليس وحشاً! ضعه في منطقة السحر/الفخاخ.");
      return;
    }

    if (!canSummon) {
      if (myState.summonedThisTurn) triggerLocalError("لقد قمت بالاستدعاء بالفعل في هذا الدور.");
      return;
    }

    if (myState.field[slotIdx] !== null) {
      triggerLocalError("هذه الفتحة مشغولة!");
      return;
    }

    // Level-based tribute check removed

    summonMonster(selectedHandCard, slotIdx, tributeIndices);
    setSelectedHandCard(null);
    setSelectedHandIndex(null);
    setTributeNeeded(0);
    setTributeIndices([]);
    setTargetSlot(null);
  }

  function handleMySTSlotClick(slotIdx) {
    if (!isMyTurn || phase !== 'main') return;
    
    const existing = myState.spellTrapField[slotIdx];
    if (existing) {
      if (existing.type === 'Spell') {
        activateSpell(existing.id, slotIdx);
      }
      return;
    }

    if (selectedHandCard === null) return;
    const card = myState.hand[selectedHandIndex];
    if (card.type === 'Monster') {
      triggerLocalError("لا يمكنك وضع وحش هنا!");
      return;
    }

    setSpellTrap(selectedHandCard, slotIdx);
    setSelectedHandCard(null);
    setSelectedHandIndex(null);
    setHoveredCard(null);
  }

  const handleShowDetail = (card) => setHoveredCard(card);

  function handleOppFieldSlotClick(slotIdx) {
    if (!attackMode || attackerSlot === null) return;
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

  if (!myState || !oppState) return <div className="loading">جاري تحميل البيانات...</div>;

  return (
    <div className="game-container-dual">
      <div className="inspector-panel">
        <div className="inspector-sticky">
          <CardInspector card={hoveredCard || (myState.hand.length > 0 ? myState.hand[0] : null)} />
        </div>
      </div>

      <div className="board-panel">
        <div className="phase-banner">
          <div className="game-title">YGO DUEL</div>
          <div className="phase-info">
            <span className="turn-badge">{isMyTurn ? 'دورك' : 'دور الخصم'}</span>
            <span className="phase-badge">{phase.toUpperCase()} PHASE</span>
            <div className="deck-badge">🎴 <span>{myState.deck.length}</span></div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/lobby')}>انسحاب</button>
        </div>

        {(error || localError) && (
          <div className="alert alert-error" style={{ margin: '8px 12px 0', flexShrink: 0 }}>
            ⚠ {error || localError}
          </div>
        )}

        <div className="battlefield">
          <div className="lp-bar-container">
            <div className="lp-username opponent">💀 {oppUsername}</div>
            <div className="lp-track">
              <div className="lp-fill opponent" style={{ width: `${Math.max(0, (oppLP / maxLP) * 100)}%` }} />
            </div>
            <div className="lp-value opponent">{Math.max(0, oppLP)}</div>
            <div className="deck-badge">🃏 <span>{oppState.deck.length}</span></div>
          </div>

          <div className="hand-section opp-hand">
            <div className="section-label">يد الخصم ({oppState.hand.length})</div>
            <div className="hand-cards">
              {oppState.hand.map((_, i) => (
                <div key={i} className="monster-card back" style={{ width: 40, height: 56 }} />
              ))}
            </div>
          </div>

          <div className="field-section">
            <div className="field-grid">
              <div className="field-slots">
                {oppState.field.map((monster, idx) => (
                  <div
                    key={idx}
                    className={`field-slot ${monster ? 'has-monster' : ''} ${attackMode ? 'selectable-target' : ''}`}
                    onClick={() => handleOppFieldSlotClick(idx)}
                    onMouseEnter={() => monster && setHoveredCard(monster)}
                  >
                    {monster ? <FieldMonsterCard monster={monster} isOpponent /> : <span className="field-slot-number">{idx + 1}</span>}
                  </div>
                ))}
              </div>
              <div className="field-slots spell-trap-slots">
                {oppState.spellTrapField.map((card, idx) => (
                  <div key={idx} className={`field-slot st-slot ${card ? 'has-card' : ''}`}>
                    {card ? <div className="st-card back" onMouseEnter={() => setHoveredCard(card)} /> : <span className="field-slot-number">ST</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="field-divider" />

          <div className="field-section">
            <div className="field-grid">
              <div className="field-slots spell-trap-slots">
                {myState.spellTrapField.map((card, idx) => (
                  <div
                    key={idx}
                    className={`field-slot st-slot ${card ? 'has-card' : 'empty-player'}`}
                    onClick={() => handleMySTSlotClick(idx)}
                    onMouseEnter={() => card && setHoveredCard(card)}
                  >
                    {card ? (
                      <div className={`st-card type-${card.type.toLowerCase()}`} onClick={(e) => e.stopPropagation()}>
                        <div className="st-name">{card.name}</div>
                      </div>
                    ) : <span className="field-slot-number">ST</span>}
                  </div>
                ))}
              </div>
              <div className="field-slots">
                {myState.field.map((monster, idx) => (
                  <div
                    key={idx}
                    className={`field-slot ${monster ? 'has-monster' : ''} ${tributeNeeded > 0 && monster ? 'tribute-target' : ''} ${tributeIndices.includes(idx) ? 'tribute-selected' : ''}`}
                    onClick={() => handleMyFieldSlotClick(idx)}
                    onMouseEnter={() => monster && setHoveredCard(monster)}
                  >
                    {monster ? (
                      <FieldMonsterCard
                        monster={monster}
                        canAttack={inBattlePhase && !monster.justSummoned && !myState.attackedThisTurn}
                        isSelected={attackMode && attackerSlot === idx}
                      />
                    ) : <span className="field-slot-number">{targetSlot === idx ? '🎯' : idx + 1}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lp-bar-container">
            <div className="lp-username player">🛡 {myUsername}</div>
            <div className="lp-track">
              <div className="lp-fill player" style={{ width: `${Math.max(0, (myLP / maxLP) * 100)}%` }} />
            </div>
            <div className="lp-value player">{Math.max(0, myLP)}</div>
          </div>

          <div className="hand-section">
            <div className="hand-row">
              {myState.hand.map((card, i) => (
                <MonsterHandCard
                  key={card.id + '-' + i}
                  card={card}
                  selected={selectedHandCard === card.id}
                  disabled={!canSummon}
                  onClick={() => handleHandCardClick(card, i)}
                  onMouseEnter={() => setHoveredCard(card)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="action-bar">
          <div className="action-buttons">
            <button
               id="draw-btn"
               className={`btn btn-primary ${canDraw ? 'pulse-gold' : ''}`}
               onClick={drawCard}
               disabled={!canDraw}
            >🃏 سحب</button>
            <button
              id="battle-btn"
              className="btn btn-danger"
              onClick={goToBattle}
              disabled={!canGoToBattle}
            >⚔ هجوم</button>
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
            {isMyTurn && phase === 'draw' && 'اسحب بطاقة.'}
            {isMyTurn && phase === 'main' && 'العب أوراقك.'}
          </div>
        </div>
      </div>
    </div>
  );
}

function MonsterHandCard({ card, selected, disabled, onClick, onMouseEnter }) {
  const isMonster = card.type === 'Monster';
  const imgUrl = getCardImage(card);

  return (
    <div
      id={`hand-card-${card.id}`}
      className={`hand-card-item ${selected ? 'selected' : ''}`}
      style={{
        opacity: disabled && !selected ? 0.7 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={onMouseEnter}
    >
      <CardFace card={card} imgUrl={imgUrl} isMonster={isMonster} />
    </div>
  );
}

function CardInspector({ card }) {
  if (!card) return (
    <div className="inspector-placeholder">
      <p>مرر الفأرة فوق بطاقة لرؤية تفاصيلها</p>
    </div>
  );

  const imgUrl = getCardImage(card);
  const isMonster = card.type === 'Monster';

  return (
    <div className="card-inspector-face">
      <CardFace card={card} imgUrl={imgUrl} isMonster={isMonster} isLarge />
    </div>
  );
}

function CardFace({ card, imgUrl, isMonster, isLarge }) {
  return (
    <div className={`authentic-card-face ${isLarge ? 'large' : ''} type-${card.type.toLowerCase()}`}>
      <div className="card-inner">
        <div className="card-header">
          <span className="card-name">{card.name}</span>
          <span className="card-attribute">DARK</span>
        </div>
        <div className="card-image-box" style={{ backgroundImage: `url(${imgUrl})` }} />
        <div className="card-effect-box">
          <div className="card-type-line">
            [{isMonster ? 'Fiend / Effect' : card.type}]
          </div>
          <div className="card-effect-text">{card.effect || "No effect text."}</div>
          {isMonster && (
            <div className="card-stats-line">
              ATK / {card.atk} DEF / {card.def}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldMonsterCard({ monster, isOpponent, canAttack, isSelected }) {
  const imgUrl = getCardImage(monster);
  return (
    <div className={`field-monster ${canAttack ? 'can-attack' : ''} ${isSelected ? 'isSelected' : ''}`}>
       <CardFace card={monster} imgUrl={imgUrl} isMonster={true} />
    </div>
  );
}

function getHueFromColor(hex) {
  return hex;
}
