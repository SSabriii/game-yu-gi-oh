const { createDeck } = require('./cards');

const STARTING_LP = 8000;
const HAND_SIZE = 5;
const FIELD_SLOTS = 5;
const MAX_HAND = 7;

/**
 * Create a fresh game state for two players in a room.
 */
function createGameState(roomId, player1Username, player2Username) {
  const deck1 = createDeck();
  const deck2 = createDeck();

  const hand1 = deck1.splice(0, HAND_SIZE);
  const hand2 = deck2.splice(0, HAND_SIZE);

  return {
    room_id: roomId,
    player1: {
      username: player1Username,
      lp: STARTING_LP,
      hand: hand1,
      deck: deck1,
      field: new Array(FIELD_SLOTS).fill(null),
      spellTrapField: new Array(FIELD_SLOTS).fill(null),
      graveyard: [],
      summonedThisTurn: false,
      attackedMonsterIds: [], // Track which monsters attacked this turn
    },
    player2: {
      username: player2Username,
      lp: STARTING_LP,
      hand: hand2,
      deck: deck2,
      field: new Array(FIELD_SLOTS).fill(null),
      spellTrapField: new Array(FIELD_SLOTS).fill(null),
      graveyard: [],
      summonedThisTurn: false,
      attackedMonsterIds: [],
    },
    turn: 'player1',
    phase: 'draw',
    winner: null,
    log: [],
  };
}

/**
 * Draw 1 card from the current player's deck to hand.
 */
function drawCard(state, playerKey) {
  const player = state[playerKey];
  
  // Rule 13: Deck-out check
  if (player.deck.length === 0) {
    state.winner = playerKey === 'player1' ? 'player2' : 'player1';
    state.log.push(`خسر ${player.username} لنفاد البطاقات!`);
    return { success: true };
  }

  if (state.phase !== 'draw') {
    return { error: 'لست في مرحلة السحب.' };
  }

  const card = player.deck.shift();
  player.hand.push(card);
  state.log.push(`${player.username} سحب بطاقة: ${card.name}.`);

  // Rule 8: Hand limit (7 cards)
  if (player.hand.length > MAX_HAND) {
    const removed = player.hand.splice(Math.floor(Math.random() * player.hand.length), 1)[0];
    state.log.push(`تم حذف ${removed.name} عشوائياً لتجاوز حد اليد (7 بطاقات).`);
  }

  state.phase = 'main';
  return { success: true };
}

/**
 * Summon a monster from hand to a field slot.
 */
function summonMonster(state, playerKey, cardId, slotIndex) {
  const player = state[playerKey];
  if (state.turn !== playerKey) return { error: 'ليس دورك.' };
  if (state.phase !== 'main') return { error: 'يمكنك الاستدعاء فقط في المرحلة الرئيسية.' };
  
  // Rule 3: 1 Normal Summon per turn
  if (player.summonedThisTurn) return { error: 'لقد استدعيت وحشاً بالفعل في هذا الدور.' };
  
  if (slotIndex < 0 || slotIndex >= FIELD_SLOTS) return { error: 'فتحة غير صالحة.' };
  if (player.field[slotIndex] !== null) return { error: 'الفتحة مشغولة بالفعل.' };

  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return { error: 'البطاقة ليست في اليد.' };
  const card = player.hand[cardIndex];

  if (card.type !== 'Monster') return { error: 'هذا ليس وحشاً!' };

  player.hand.splice(cardIndex, 1);
  // Rule 4: Monster contains ATK, DEF, and HP
  player.field[slotIndex] = { ...card, currentHP: card.hp, justSummoned: true, position: 'attack' };
  player.summonedThisTurn = true;
  state.log.push(`${player.username} استدعى ${card.name} (هجوم: ${card.atk}, حياة: ${card.hp}).`);
  
  return { success: true };
}

/**
 * Attack an opponent's monster.
 */
function attackMonster(state, playerKey, attackerSlot, defenderSlot) {
  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
  const attacker = state[playerKey];
  const defender = state[opponentKey];

  if (state.turn !== playerKey) return { error: 'ليس دورك.' };
  if (state.phase !== 'battle') return { error: 'لست في مرحلة القتال.' };

  const attackerCard = attacker.field[attackerSlot];
  const defenderCard = defender.field[defenderSlot];

  if (!attackerCard) return { error: 'لا يوجد وحش في فتحة المهاجم.' };
  if (!defenderCard) return { error: 'لا يوجد وحش في فتحة المدافع.' };
  if (attackerCard.justSummoned) return { error: 'هذا الوحش تم استدعاؤه تواً ولا يمكنه الهجوم.' };
  
  // Track attack per monster
  if (attacker.attackedMonsterIds.includes(attackerCard.id)) return { error: 'هاجم هذا الوحش بالفعل.' };

  // Rule 5: Combat Calculation
  // Damage = ATK M مهاجم - DEF or ATK M مدافع
  const defenderStat = defenderCard.position === 'attack' ? defenderCard.atk : defenderCard.def;
  const damage = attackerCard.atk - defenderStat;

  state.log.push(`${attackerCard.name} يهاجم ${defenderCard.name}.`);

  if (damage > 0) {
    // Reduce Monster HP
    defenderCard.currentHP -= damage;
    state.log.push(`تضرر ${defenderCard.name} بمقدار ${damage} نقاط حياة. المتبقي: ${defenderCard.currentHP}`);

    // If HP <= 0, destroy monster and apply LP damage
    if (defenderCard.currentHP <= 0) {
      defender.field[defenderSlot] = null;
      defender.lp -= damage; // Apply difference to player LP as requested
      state.log.push(`تم تدمير ${defenderCard.name}! خسر ${defender.username}ـ ${damage} LP.`);
    }
  } else if (damage < 0) {
    // Reflected damage to attacker HP
    const absorb = Math.abs(damage);
    attackerCard.currentHP -= absorb;
    state.log.push(`${attackerCard.name} خسر ${absorb} HP بسبب دفاع الخصم القوي.`);
    if (attackerCard.currentHP <= 0) {
      attacker.field[attackerSlot] = null;
      state.log.push(`تم تدمير ${attackerCard.name}!`);
    }
  } else {
    state.log.push(`تعادل القوى! لم يتأثر أي وحش.`);
  }

  attacker.attackedMonsterIds.push(attackerCard.id);
  checkWin(state);
  return { success: true };
}

/**
 * Direct attack the opponent.
 */
function directAttack(state, playerKey, attackerSlot) {
  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
  const attacker = state[playerKey];
  const defender = state[opponentKey];

  if (state.turn !== playerKey) return { error: 'ليس دورك.' };
  if (state.phase !== 'battle') return { error: 'لست في مرحلة القتال.' };

  const opponentHasMonsters = defender.field.some(slot => slot !== null);
  if (opponentHasMonsters) return { error: 'الخصم لديه وحوش في الساحة.' };

  const attackerCard = attacker.field[attackerSlot];
  if (!attackerCard) return { error: 'لا يوجد وحش مهاجم.' };
  if (attackerCard.justSummoned) return { error: 'هذا الوحش استدعي تواً.' };
  if (attacker.attackedMonsterIds.includes(attackerCard.id)) return { error: 'هاجم بالفعل.' };

  // Rule 5: Full ATK to LP
  defender.lp -= attackerCard.atk;
  attacker.attackedMonsterIds.push(attackerCard.id);
  state.log.push(`هاجم ${attackerCard.name} مباشرة! خسر ${defender.username}ـ ${attackerCard.atk} LP.`);

  checkWin(state);
  return { success: true };
}

/**
 * Set a Spell or Trap card Face Down.
 */
function setSpellTrap(state, playerKey, cardId, slotIndex) {
  const player = state[playerKey];
  if (state.turn !== playerKey) return { error: 'ليس دورك.' };
  if (state.phase !== 'main') return { error: 'المرحلة غير صالحة.' };
  
  if (slotIndex < 0 || slotIndex >= FIELD_SLOTS) return { error: 'فتحة غير صالحة.' };
  if (player.spellTrapField[slotIndex] !== null) return { error: 'الفتحة مشغولة بالفعل.' };

  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return { error: 'البطاقة ليست في اليد.' };
  const card = player.hand[cardIndex];

  if (card.type === 'Monster') return { error: 'لا يمكنك وضع وحش هنا!' };

  player.hand.splice(cardIndex, 1);
  player.spellTrapField[slotIndex] = { ...card, setThisTurn: true, faceUp: false };
  state.log.push(`${player.username} وضع ${card.name} مقلوبة.`);
  return { success: true };
}

/**
 * Activate a Spell card.
 */
function activateSpell(state, playerKey, cardId, slotIndex = -1) {
  const player = state[playerKey];
  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
  const opponent = state[opponentKey];

  if (state.turn !== playerKey) return { error: 'ليس دورك.' };
  if (state.phase !== 'main') return { error: 'المرحلة غير صالحة.' };

  let card;
  let fromField = false;

  if (slotIndex !== -1) {
    card = player.spellTrapField[slotIndex];
    if (!card) return { error: 'لا توجد بطاقة هنا.' };
    fromField = true;
  } else {
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { error: 'البطاقة ليست معك.' };
    card = player.hand[cardIndex];
  }

  if (card.type !== 'Spell') return { error: 'هذه ليست بطاقة سحر!' };

  state.log.push(`تفعيل بطاقة ${card.name}!`);

  // Basic Spell Effects
  if (card.name === "نور الشفاء") {
    player.lp = Math.min(8000, player.lp + 1000);
    state.log.push(`${player.username} استعاد 1000 نقطة حياة.`);
  } else if (card.name === "غضب التنين") {
    player.field.forEach(m => { if (m) m.atk += 500; });
    state.log.push("زادت قوة هجوم جميع وحوشك بمقدار 500.");
  } else if (card.name === "درع الكريستال") {
    player.field.forEach(m => { if (m) m.currentHP = m.hp; });
    state.log.push("تمت استعادة نقاط حياة جميع وحوشك.");
  } else if (card.name === "ثقب أسود") {
    state.player1.field = Array(5).fill(null);
    state.player2.field = Array(5).fill(null);
    state.log.push("تم تدمير جميع الوحوش في الساحة!");
  } else if (card.name === "إعصار مدمر") {
    opponent.spellTrapField = Array(5).fill(null);
    state.log.push("تم تدمير جميع أوراق فخ وسحر الخصم.");
  }

  // Remove spell after use
  if (fromField) {
    player.spellTrapField[slotIndex] = null;
  } else {
    const freshIdx = player.hand.findIndex(c => c.id === cardId);
    if (freshIdx !== -1) player.hand.splice(freshIdx, 1);
  }
  
  return { success: true };
}

/**
 * Advance phases.
 */
function goToBattlePhase(state, playerKey) {
  if (state.turn !== playerKey) return { error: 'ليس دورك.' };
  if (state.phase !== 'main') return { error: 'يجب أن تكون في المرحلة الرئيسية.' };
  state.phase = 'battle';
  state.log.push(`${state[playerKey].username} دخل مرحلة القتال.`);
  return { success: true };
}

function endTurn(state, playerKey) {
  if (state.turn !== playerKey) return { error: 'ليس دورك.' };
  if (state.phase === 'draw') return { error: 'سحب بطاقة أولاً.' };

  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';

  // Reset flags
  const currentPlayer = state[playerKey];
  currentPlayer.field.forEach(c => { if (c) c.justSummoned = false; });
  currentPlayer.summonedThisTurn = false;
  currentPlayer.attackedMonsterIds = [];

  state.turn = opponentKey;
  state.phase = 'draw';
  state.log.push(`بدأ دور ${state[opponentKey].username}.`);
  return { success: true };
}

/**
 * Rule 13: Winners
 */
function checkWin(state) {
  if (state.player1.lp <= 0) {
    state.winner = 'player2';
    state.log.push(`انتصر ${state.player2.username}!`);
  } else if (state.player2.lp <= 0) {
    state.winner = 'player1';
    state.log.push(`انتصر ${state.player1.username}!`);
  }
}

module.exports = {
  createGameState,
  drawCard,
  summonMonster,
  setSpellTrap,
  activateSpell,
  attackMonster,
  directAttack,
  goToBattlePhase,
  endTurn,
  checkWin,
};

/**
 * Check for a winner and update state.winner.
 */
function checkWin(state) {
  if (state.player1.lp <= 0 && state.player2.lp <= 0) {
    state.winner = 'draw';
    state.log.push('تعادل! كلا اللاعبين لديهم 0 نقطة حياة.');
  } else if (state.player1.lp <= 0) {
    state.winner = 'player2';
    state.log.push(`انتصر ${state.player2.username}!`);
  } else if (state.player2.lp <= 0) {
    state.winner = 'player1';
    state.log.push(`انتصر ${state.player1.username}!`);
  }
}

module.exports = {
  createGameState,
  drawCard,
  summonMonster,
  setSpellTrap,
  activateSpell,
  attackMonster,
  directAttack,
  goToBattlePhase,
  endTurn,
  checkWin,
};
