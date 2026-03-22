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

const PHASE_NAMES = {
  draw: "مرحلة السحب",
  main: "المرحلة الرئيسية",
  battle: "مرحلة القتال",
  end: "مرحلة النهاية"
};

function GameBoard() {
  const navigate = useNavigate();
  const {
    gameState, error,
    myState, oppState, isMyTurn, phase,
    drawCard, summonMonster, setSpellTrap, activateSpell, goToBattle, attackMonster, endTurn,
  } = useGame();

  const [selectedCard, setSelectedCard] = useState(null); 
  const [selectedCardSource, setSelectedCardSource] = useState(null); 
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  
  const [attackMode, setAttackMode] = useState(false);
  const [attackerSlot, setAttackerSlot] = useState(null);
  
  // Drag & Drop State
  const [draggingCard, setDraggingCard] = useState(null);

  const closeInspector = () => {
    setSelectedCard(null);
    setSelectedCardSource(null);
    setSelectedCardIndex(null);
  };

  const handleInspectField = (card, idx, isOpponent) => {
    if (!card) return;
    setSelectedCard(card);
    setSelectedCardSource(isOpponent ? 'oppField' : 'myField');
    setSelectedCardIndex(idx);
  };

  const handleAction = (type, slotIdx) => {
    if (type === 'Monster') {
      summonMonster(selectedCard.id, slotIdx);
    } else {
      setSpellTrap(selectedCard.id, slotIdx);
    }
    closeInspector();
  };

  const startAttack = (idx) => {
    setAttackMode(true);
    setAttackerSlot(idx);
    closeInspector();
  };

  const executeAttack = (oppIdx) => {
    attackMonster(attackerSlot, oppIdx);
    setAttackMode(false);
    setAttackerSlot(null);
  };

  // DnD Handlers
  const onDragStart = (e, card) => {
    setDraggingCard(card);
    e.dataTransfer.setData("cardId", card.id);
  };

  const onDropOnSlot = (e, slotIdx) => {
    e.preventDefault();
    if (!draggingCard || !isMyTurn || phase !== 'main') return;
    
    // For universal slots, we need to know if it's a summon or set
    // For now, default: Monster -> Summon, Spell/Trap -> Set
    if (draggingCard.type === 'Monster') {
      summonMonster(draggingCard.id, slotIdx);
    } else {
      setSpellTrap(draggingCard.id, slotIdx);
    }
    setDraggingCard(null);
  };

  if (!gameState || !myState || !oppState) return (
    <div className="loading-screen">
       <div className="loading-content">
          <h1>جاري تحميل النزال</h1>
          <div className="loading-bar"><div className="loading-progress" /></div>
       </div>
    </div>
  );

  const winner = gameState.winner;

  return (
    <div className="cinematic-game-root" dir="rtl">
      <div className="arena-layer">
        <div className="field-grid-3d unified">
          {/* Opponent Field (5 Universal Slots) */}
          <div className="field-side opponent">
            <div className="slots-row unified-slots">
              {oppState.field.map((m, i) => (
                <div key={i} className={`field-slot-v2 ${attackMode ? 'attack-target' : ''}`} 
                     onClick={() => attackMode ? executeAttack(i) : handleInspectField(m, i, true)}>
                  {m ? (m.faceUp || m.type === 'Monster' ? <FieldCard card={m} /> : <div className="card-back-v2" />) : <div className="slot-empty" />}
                  {attackMode && m && m.type === 'Monster' && <div className="target-ring" />}
                </div>
              ))}
            </div>
          </div>

          <div className="field-divider-v2" />

          {/* Player Field (5 Universal Slots) */}
          <div className="field-side player">
            <div className="slots-row unified-slots">
              {myState.field.map((m, i) => (
                <div key={i} className={`field-slot-v2 ${attackerSlot === i ? 'attacker-active' : ''} ${draggingCard ? 'drag-target' : ''}`}
                     onDragOver={(e) => e.preventDefault()}
                     onDrop={(e) => onDropOnSlot(e, i)}
                     onClick={() => handleInspectField(m, i, false)}>
                  {m ? <FieldCard card={m} /> : <div className="slot-empty" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="ui-layer">
         <div className="top-hud">
            <div className="lp-display opponent">
               <span className="name">{oppState.username}</span>
               <div className="lp-val">{oppState.lp}</div>
            </div>
            <div className="phase-indicator">{PHASE_NAMES[phase] || phase}</div>
            <div className="lp-display player">
               <span className="name">{myState.username}</span>
               <div className="lp-val">{myState.lp}</div>
            </div>
         </div>

         <div className="side-actions">
            {isMyTurn && phase === 'draw' && <button className="btn-cinematic gold pulse" onClick={drawCard}>سحب</button>}
            {isMyTurn && phase === 'main' && <button className="btn-cinematic danger" onClick={goToBattle}>قتال</button>}
            {isMyTurn && phase !== 'draw' && <button className="btn-cinematic outline" onClick={endTurn}>إنهاء</button>}
         </div>

         {/* New Readable Hand Area */}
         <div className="hand-bar-readable">
            {myState.hand.map((c, i) => (
               <HandCard key={i} card={c} onDragStart={(e) => onDragStart(e, c)} onClick={() => handleInspectField(c, i, false)} />
            ))}
         </div>
      </div>

      {selectedCard && (
        <CardInspectorModal
          card={selectedCard}
          source={selectedCardSource}
          index={selectedCardIndex}
          isMyTurn={isMyTurn}
          phase={phase}
          onClose={closeInspector}
          onAttack={startAttack}
          onActivate={() => { activateSpell(selectedCard.id, selectedCardIndex); closeInspector(); }}
        />
      )}

      {(error) && <div className="toast-v2">{error}</div>}

      {winner && (
        <div className="victory-overlay">
          <div className="victory-card">
            <h1>{winner === myState.username ? 'انتصار باهر!' : 'هزيمة نكراء'}</h1>
            <button className="btn-cinematic gold" onClick={() => navigate('/lobby')}>العودة للردهة</button>
          </div>
        </div>
      )}
    </div>
  );
}

function HandCard({ card, onDragStart, onClick }) {
  const isMonster = card.type === 'Monster';
  const imgUrl = getCardImage(card);
  const typeLabel = isMonster ? 'وحش' : (card.type === 'Spell' ? 'سحر' : 'فخ');

  return (
    <div className={`hand-card-detailed type-${card.type.toLowerCase()}`} 
         draggable onDragStart={onDragStart} onClick={onClick}>
       <div className="card-mini-header">
          <span className="n">{card.name}</span>
          <span className="t">{typeLabel}</span>
       </div>
       <div className="card-mini-art" style={{ backgroundImage: `url(${imgUrl})` }} />
       <div className="card-mini-stats">
          {isMonster ? (
            <div className="s-row">
               <span>هجوم {card.atk}</span>
               <span>حياة {card.hp}</span>
            </div>
          ) : (
            <div className="s-effect">{card.effect.substring(0, 20)}...</div>
          )}
       </div>
    </div>
  );
}

function FieldCard({ card }) {
  const isMonster = card.type === 'Monster';
  const hpPercent = isMonster ? (card.currentHP / card.hp) * 100 : 100;
  return (
    <div className={`mini-card-v2 type-${card.type.toLowerCase()}`}>
      <div className="mini-art" style={{ backgroundImage: `url(${getCardImage(card)})` }} />
      {isMonster && (
        <>
          <div className="mini-hp-bar"><div className="hp-fill" style={{ width: `${hpPercent}%` }} /></div>
          <div className="mini-stats">{card.atk} / {card.currentHP || card.hp}</div>
        </>
      )}
      {!isMonster && <div className="mini-stats spell">{card.name}</div>}
    </div>
  );
}

function CardInspectorModal({ card, source, index, isMyTurn, phase, onClose, onAttack, onActivate }) {
  const isMonster = card.type === 'Monster';
  return (
    <div className="modal-backdrop-v2" onClick={onClose} dir="rtl">
      <div className="modal-content-v2 compact" onClick={e => e.stopPropagation()}>
         <div className="modal-card-display">
            <CardFace card={card} imgUrl={getCardImage(card)} isMonster={isMonster} isLarge />
         </div>
         <div className="modal-controls">
            <div className="modal-header-compact">
               <h2>{card.name}</h2>
               <button className="btn-close-v2" onClick={onClose}>×</button>
            </div>
            <div className="modal-actions-v2">
               {source === 'myField' && isMyTurn && phase === 'battle' && isMonster && !card.attacked && (
                  <button className="btn-cinematic danger pulse" onClick={() => onAttack(index)}>الهجوم بهذا الوحش</button>
               )}
               {source === 'myField' && isMyTurn && phase === 'main' && !isMonster && !card.faceUp && (
                  <button className="btn-cinematic gold" onClick={onActivate}>تفعيل البطاقة</button>
               )}
            </div>
            <p className="description">{card.effect || "لا توجد قدرة خاصة."}</p>
            <button className="btn-cinematic outline w-full mt-3" onClick={onClose}>إغلاق</button>
         </div>
      </div>
    </div>
  );
}

/* Reusing your CardFace for consistency but inside the new Modal */
function CardFace({ card, imgUrl, isMonster, isLarge }) {
  const typeMap = {
     Monster: "وحش",
     Spell: "سحر",
     Trap: "فخ"
  };

  return (
    <div className={`authentic-card-face-v2 ${isLarge ? 'large' : ''} type-${card.type.toLowerCase()}`} dir="rtl">
      <div className="card-header-v2">
        <span className="card-name-v2">{card.name}</span>
        <span className="card-attr">{isMonster ? 'ظلام' : typeMap[card.type]}</span>
      </div>
      <div className="card-art-v2" style={{ backgroundImage: `url(${imgUrl})` }} />
      <div className="card-desc-box-v2">
        <div className="card-type-v2">[{isMonster ? 'محارب / ميزة' : typeMap[card.type]}]</div>
        <div className="card-text-v2">{card.effect || "لا توجد قدرات إضافية."}</div>
        {isMonster && (
          <div className="card-atkdef-v2">
            هجوم / {card.atk} <br/> 
            حياة / {card.currentHP || card.hp}
          </div>
        )}
      </div>
    </div>
  );
}

function getHueFromColor(hex) {
  return hex;
}
