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
  const [detailCard, setDetailCard] = useState(null);
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
      setDetailCard(null);
    } else {
      setSelectedHandCard(card.id);
      setSelectedHandIndex(idx);
      setDetailCard(card);
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
    setDetailCard(null);
  }

  const handleShowDetail = (card) => {
    setDetailCard(card);
  };

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
          <div className="field-carousel-container">
            <div className="field-row-scrollable">
              {/* Monster Slots */}
              <div className="field-slots">
                {oppState.field.map((monster, idx) => (
                  <div
                    key={idx}
                    className={`field-slot ${monster ? 'has-monster' : ''} ${attackMode ? 'selectable-target' : ''}`}
                    onClick={() => handleOppFieldSlotClick(idx)}
                  >
                    {monster ? (
                      <FieldMonsterCard monster={monster} isOpponent />
                    ) : (
                      <span className="field-slot-number">{idx + 1}</span>
                    )}
                  </div>
                ))}
              </div>
              {/* Spell/Trap Slots */}
              <div className="field-slots spell-trap-slots">
                {oppState.spellTrapField.map((card, idx) => (
                  <div key={idx} className={`field-slot st-slot ${card ? 'has-card' : ''}`}>
                    {card ? (
                      <div className="st-card back" />
                    ) : (
                      <span className="field-slot-number">ST</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="field-divider" />

        {/* My Field */}
        <div className="field-section">
          <div className="section-label" style={{ textAlign: 'center' }}>ساحتك</div>
          <div className="field-carousel-container">
            <div className="field-row-scrollable">
              {/* Spell/Trap Slots */}
              <div className="field-slots spell-trap-slots">
                {myState.spellTrapField.map((card, idx) => (
                  <div
                    key={idx}
                    className={`field-slot st-slot ${card ? 'has-card' : 'empty-player'}`}
                    onClick={() => handleMySTSlotClick(idx)}
                  >
                    {card ? (
                      <div className={`st-card type-${card.type.toLowerCase()}`} onClick={(e) => { e.stopPropagation(); }}>
                        <div className="st-name">{card.name}</div>
                      </div>
                    ) : (
                      <span className="field-slot-number">ST</span>
                    )}
                  </div>
                ))}
              </div>
              {/* Monster Slots */}
              <div className="field-slots">
                {myState.field.map((monster, idx) => (
                  <div
                    key={idx}
                    className={`field-slot ${monster ? 'has-monster' : ''} ${tributeNeeded > 0 && monster ? 'tribute-target' : ''} ${tributeIndices.includes(idx) ? 'tribute-selected' : ''}`}
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
                        {targetSlot === idx ? '🎯' : idx + 1}
                      </span>
                    )}
                  </div>
                ))}
              </div>
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
          <div className="hand-fan-wrapper">
            {myState.hand.map((card, i) => (
              <MonsterHandCard
                key={card.id + '-' + i}
                card={card}
                index={i}
                total={myState.hand.length}
                selected={selectedHandCard === card.id}
                disabled={!canSummon}
                onClick={() => handleHandCardClick(card, i)}
              />
            ))}
          </div>
          {myState.hand.length === 0 && (
            <div className="empty-hand-msg">لا توجد بطاقات في اليد</div>
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
          {isMyTurn && phase === 'main' && myState.summonedThisTurn && 'يمكنك وضع سحر/فخ، أو ادخل مرحلة القتال، أو أنهِ دورك.'}
          {isMyTurn && phase === 'battle' && !attackMode && 'انقر على وحش في ساحتك للهجوم به.'}
        </div>
      </div>
    </div>
  );
}

function MonsterHandCard({ card, index, total, selected, disabled, onClick }) {
  const isMonster = card.type === 'Monster';
  const imgUrl = getCardImage(card);

  // Calculate fan rotation
  const rotation = (index - (total - 1) / 2) * 6;
  const translationY = Math.abs(index - (total - 1) / 2) * 5;

  return (
    <div
      id={`hand-card-${card.id}`}
      className={`monster-card-fan ${selected ? 'selected' : ''}`}
      style={{
        '--index': index,
        '--rotation': `${rotation}deg`,
        '--y': `${translationY}px`,
        opacity: disabled && !selected ? 0.7 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={disabled ? undefined : onClick}
    >
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
          <div className="card-effect-text">{card.effect || "No effect text available for this card."}</div>
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
    <div
      className={`field-monster ${canAttack ? 'can-attack' : ''} ${monster.justSummoned ? 'just-summoned' : ''} ${isSelected ? 'selectable-target' : ''}`}
    >
      <div className="card-inner">
        <div className="card-header">
          <span className="card-name">{monster.name}</span>
          <span className="card-attribute">DARK</span>
        </div>
        <div className="card-image-box" style={{ backgroundImage: `url(${imgUrl})` }} />
        <div className="card-effect-box">
          <div className="card-type-line">[Fiend / Effect]</div>
          <div className="card-effect-text">{monster.effect || "No effect text."}</div>
          <div className="card-stats-line">
            ATK / {monster.atk} DEF / {monster.def}
          </div>
        </div>
      </div>
    </div>
  );
}

function getHueFromColor(hex) {
  return hex;
}
