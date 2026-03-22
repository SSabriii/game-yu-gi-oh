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
    myState, oppState, isMyTurn, phase,
    drawCard, summonMonster, setSpellTrap, activateSpell, goToBattle, attackMonster, directAttack, endTurn,
  } = useGame();

  const [selectedCard, setSelectedCard] = useState(null); // The card being inspected in modal
  const [selectedCardSource, setSelectedCardSource] = useState(null); // 'hand' or 'field'
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  
  const [tributeNeeded, setTributeNeeded] = useState(0);
  const [tributeIndices, setTributeIndices] = useState([]);
  const [attackMode, setAttackMode] = useState(false);
  const [attackerSlot, setAttackerSlot] = useState(null);
  const [localError, setLocalError] = useState(null);

  const triggerLocalError = (msg) => {
    setLocalError(msg);
    setTimeout(() => setLocalError(null), 3000);
  };

  const closeInspector = () => {
    setSelectedCard(null);
    setSelectedCardSource(null);
    setSelectedCardIndex(null);
  };

  const handleInspectHand = (card, idx) => {
    setSelectedCard(card);
    setSelectedCardSource('hand');
    setSelectedCardIndex(idx);
  };

  const handleInspectField = (card, idx, isOpponent) => {
    if (!card) return;
    setSelectedCard(card);
    setSelectedCardSource(isOpponent ? 'oppField' : 'myField');
    setSelectedCardIndex(idx);
  };

  const handleSummon = (index) => {
    // Logic for summoning from modal
    summonMonster(selectedCard.id, index, []);
    closeInspector();
  };

  const handleActivateST = (index) => {
    if (selectedCardSource === 'hand') {
       setSpellTrap(selectedCard.id, index);
    } else {
       activateSpell(selectedCard.id, index);
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

  if (!gameState || !myState || !oppState) return (
    <div className="loading-screen">
       <div className="loading-content">
          <h1>LOADING DUEL</h1>
          <div className="loading-bar">
             <div className="loading-progress" />
          </div>
          <p>Preparing the Arena...</p>
       </div>
    </div>
  );

  const winner = gameState.winner;
  const oppLP = oppState.lp;
  const myLP = myState.lp;

  return (
    <div className="cinematic-game-root">
      {/* Background Arena Layer */}
      <div className="arena-layer">
        <div className="field-grid-3d">
          {/* Opponent Field */}
          <div className="field-side opponent">
            <div className="slots-row monsters">
              {oppState.field.map((m, i) => (
                <div key={i} className={`field-slot-v2 ${attackMode ? 'attack-target' : ''}`} onClick={() => attackMode ? executeAttack(i) : handleInspectField(m, i, true)}>
                  {m ? <FieldCard card={m} /> : <div className="slot-empty" />}
                </div>
              ))}
            </div>
            <div className="slots-row spells">
              {oppState.spellTrapField.map((s, i) => (
                <div key={i} className="field-slot-v2">
                  {s ? <div className="card-back-v2" /> : <div className="slot-empty" />}
                </div>
              ))}
            </div>
          </div>

          <div className="field-divider-v2" />

          {/* My Field */}
          <div className="field-side player">
            <div className="slots-row monsters">
              {myState.field.map((m, i) => (
                <div key={i} className={`field-slot-v2 ${attackerSlot === i ? 'attacker-active' : ''}`} onClick={() => handleInspectField(m, i, false)}>
                  {m ? <FieldCard card={m} /> : <div className="slot-empty" />}
                </div>
              ))}
            </div>
            <div className="slots-row spells">
              {myState.spellTrapField.map((s, i) => (
                <div key={i} className="field-slot-v2" onClick={() => handleInspectField(s, i, false)}>
                  {s ? <FieldCard card={s} /> : <div className="slot-empty" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating UI Layer */}
      <div className="ui-layer">
         {/* Top Info */}
         <div className="top-hud">
            <div className="lp-display opponent">
               <span className="name">{oppState.username}</span>
               <div className="lp-val">{oppLP}</div>
            </div>
            <div className="phase-indicator">
               {phase.toUpperCase()}
            </div>
            <div className="lp-display player">
               <span className="name">{myState.username}</span>
               <div className="lp-val">{myLP}</div>
            </div>
         </div>

         {/* Floating Actions */}
         <div className="side-actions">
            {isMyTurn && phase === 'draw' && (
              <button className="btn-cinematic gold pulse" onClick={drawCard}>DRAW</button>
            )}
            {isMyTurn && phase === 'main' && (
              <button className="btn-cinematic danger" onClick={goToBattle}>BATTLE</button>
            )}
            {isMyTurn && phase !== 'draw' && (
              <button className="btn-cinematic outline" onClick={endTurn}>END</button>
            )}
         </div>

         {/* Floating Hand */}
         <div className="hand-bar-v2">
            {myState.hand.map((c, i) => (
               <div key={i} className="hand-card-v2" onClick={() => handleInspectHand(c, i)}>
                  <img src={getCardImage(c)} alt={c.name} />
               </div>
            ))}
         </div>
      </div>

      {/* Detail Modal */}
      {selectedCard && (
        <CardInspectorModal
          card={selectedCard}
          source={selectedCardSource}
          index={selectedCardIndex}
          isMyTurn={isMyTurn}
          phase={phase}
          onClose={closeInspector}
          onSummon={handleSummon}
          onActivate={handleActivateST}
          onAttack={startAttack}
          canSummon={myState.summonedThisTurn === false}
          field={myState.field}
        />
      )}

      {/* Error Overlay */}
      {localError && <div className="toast-v2">{localError}</div>}
      {error && <div className="toast-v2 error">{error}</div>}

      {/* Winner Overlay */}
      {winner && (
        <div className="victory-overlay">
          <div className="victory-card">
            <h1>{winner === myState.username ? 'VICTORY' : 'DEFEAT'}</h1>
            <button className="btn-cinematic gold" onClick={() => navigate('/lobby')}>LOBBY</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldCard({ card }) {
  return (
    <div className={`mini-card-v2 type-${card.type.toLowerCase()}`}>
      <div className="mini-art" style={{ backgroundImage: `url(${getCardImage(card)})` }} />
      <div className="mini-stats">{card.atk} / {card.def}</div>
    </div>
  );
}

function CardInspectorModal({ card, source, index, isMyTurn, phase, onClose, onSummon, onActivate, onAttack, canSummon, field }) {
  const isMonster = card.type === 'Monster';
  const imgUrl = getCardImage(card);

  return (
    <div className="modal-backdrop-v2" onClick={onClose}>
      <div className="modal-content-v2" onClick={e => e.stopPropagation()}>
         <div className="modal-card-display">
            <CardFace card={card} imgUrl={imgUrl} isMonster={isMonster} isLarge />
         </div>
         <div className="modal-controls">
            <div className="modal-header-compact">
               <h2>{card.name}</h2>
               <button className="btn-close-v2" onClick={onClose}>×</button>
            </div>
            
            <div className="modal-actions-v2">
               {source === 'hand' && isMyTurn && phase === 'main' && (
                  <div className="action-group-v2">
                     {isMonster && canSummon && (
                        <div className="slot-picker">
                           <span>Summon to:</span>
                           <div className="mini-slots">
                              {[0,1,2,3,4].map(i => (
                                 <button key={i} className={field[i] ? 'taken' : 'free'} disabled={field[i] !== null} onClick={() => onSummon(i)}>{i+1}</button>
                              ))}
                           </div>
                        </div>
                     )}
                     {!isMonster && (
                        <div className="slot-picker">
                           <span>Set to:</span>
                           <div className="mini-slots">
                              {[0,1,2,3,4].map(i => (
                                 <button key={i} onClick={() => onActivate(i)}>{i+1}</button>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               )}

               {source === 'myField' && isMyTurn && phase === 'battle' && isMonster && (
                  <button className="btn-cinematic danger pulse" onClick={() => onAttack(index)}>CHOOSE TO ATTACK</button>
               )}
            </div>

            <p className="description">{card.effect || "No special effect."}</p>
            
            <div className="modal-footer-v2">
               <button className="btn-cinematic outline" style={{ width: '100%' }} onClick={onClose}>CLOSE</button>
            </div>
         </div>
      </div>
    </div>
  );
}

/* Reusing your CardFace for consistency but inside the new Modal */
function CardFace({ card, imgUrl, isMonster, isLarge }) {
  return (
    <div className={`authentic-card-face-v2 ${isLarge ? 'large' : ''} type-${card.type.toLowerCase()}`}>
      <div className="card-header-v2">
        <span className="card-name-v2">{card.name}</span>
        <span className="card-attr">{isMonster ? 'DARK' : card.type}</span>
      </div>
      <div className="card-art-v2" style={{ backgroundImage: `url(${imgUrl})` }} />
      <div className="card-desc-box-v2">
        <div className="card-type-v2">[{isMonster ? 'Fiend / Effect' : card.type}]</div>
        <div className="card-text-v2">{card.effect || "This card has no additional effects."}</div>
        {isMonster && <div className="card-atkdef-v2">ATK / {card.atk} DEF / {card.def}</div>}
      </div>
    </div>
  );
}

function getHueFromColor(hex) {
  return hex;
}
