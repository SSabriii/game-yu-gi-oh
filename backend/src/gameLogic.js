const { createDeck } = require('./cards');

const STARTING_LP = 8000;
const HAND_SIZE = 5;
const FIELD_SLOTS = 3;

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
      field: [null, null, null],
      summonedThisTurn: false,
      attackedThisTurn: false,
    },
    player2: {
      username: player2Username,
      lp: STARTING_LP,
      hand: hand2,
      deck: deck2,
      field: [null, null, null],
      summonedThisTurn: false,
      attackedThisTurn: false,
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
  if (player.deck.length === 0) {
    return { error: 'لا يوجد المزيد من البطاقات في المجموعة!' };
  }
  if (state.phase !== 'draw') {
    return { error: 'لست في مرحلة السحب.' };
  }
  const card = player.deck.shift();
  player.hand.push(card);
  state.log.push(`${player.username} سحب ${card.name}.`);
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
  if (player.summonedThisTurn) return { error: 'لقد استدعيت وحشاً بالفعل في هذا الدور.' };
  if (slotIndex < 0 || slotIndex >= FIELD_SLOTS) return { error: 'فتحة غير صالحة.' };
  if (player.field[slotIndex] !== null) return { error: 'الفتحة مشغولة بالفعل.' };

  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return { error: 'البطاقة ليست في اليد.' };

  const card = player.hand.splice(cardIndex, 1)[0];
  player.field[slotIndex] = { ...card, justSummoned: true };
  player.summonedThisTurn = true;
  state.log.push(`${player.username} استدعى ${card.name} (هجوم: ${card.atk}) في الفتحة ${slotIndex + 1}.`);
  return { success: true };
}

/**
 * Attack an opponent's monster.
 */
function attackMonster(state, playerKey, attackerSlot, defenderSlot) {
  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
  const attacker = state[playerKey];
  const defender = state[opponentKey];

  if (state.turn !== playerKey) return { error: 'Not your turn.' };
  if (state.phase !== 'battle') return { error: 'Not in battle phase.' };
  if (attacker.attackedThisTurn) return { error: 'Already attacked this turn.' };

  const attackerCard = attacker.field[attackerSlot];
  const defenderCard = defender.field[defenderSlot];

  if (!attackerCard) return { error: 'لا يوجد وحش في فتحة المهاجم.' };
  if (!defenderCard) return { error: 'لا يوجد وحش في فتحة المدافع.' };
  if (attackerCard.justSummoned) return { error: 'هذا الوحش تم استدعاؤه تواً ولا يمكنه الهجوم.' };

  const diff = attackerCard.atk - defenderCard.atk;

  if (diff > 0) {
    // Attacker wins
    defender.lp -= diff;
    defender.field[defenderSlot] = null;
    state.log.push(`وحش ${attacker.username} [${attackerCard.name}] دمر [${defenderCard.name}]! فقد ${defender.username}ـ ${diff} نقطة حياة.`);
  } else if (diff < 0) {
    // Defender wins
    attacker.lp += diff; // diff is negative
    attacker.field[attackerSlot] = null;
    state.log.push(`وحش ${attacker.username} [${attackerCard.name}] تدمر بواسطة [${defenderCard.name}]! فقد ${attacker.username}ـ ${Math.abs(diff)} نقطة حياة.`);
  } else {
    // Tie — both destroyed
    attacker.field[attackerSlot] = null;
    defender.field[defenderSlot] = null;
    state.log.push(`دمر كل من [${attackerCard.name}] و [${defenderCard.name}] بعضهما البعض!`);
  }

  attacker.attackedThisTurn = true;
  checkWin(state);
  return { success: true };
}

/**
 * Direct attack the opponent (no monsters on their field).
 */
function directAttack(state, playerKey, attackerSlot) {
  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
  const attacker = state[playerKey];
  const defender = state[opponentKey];

  if (state.turn !== playerKey) return { error: 'Not your turn.' };
  if (state.phase !== 'battle') return { error: 'Not in battle phase.' };
  if (attacker.attackedThisTurn) return { error: 'Already attacked this turn.' };

  // Check opponent has no monsters
  const opponentHasMonsters = defender.field.some(slot => slot !== null);
  if (opponentHasMonsters) return { error: 'الخصم لديه وحوش في الساحة. استهدفهم بدلاً من ذلك.' };

  const attackerCard = attacker.field[attackerSlot];
  if (!attackerCard) return { error: 'لا يوجد وحش في فتحة المهاجم.' };
  if (attackerCard.justSummoned) return { error: 'هذا الوحش تم استدعاؤه تواً ولا يمكنه الهجوم.' };

  defender.lp -= attackerCard.atk;
  attacker.attackedThisTurn = true;
  state.log.push(`وحش ${attacker.username} [${attackerCard.name}] يهاجم مباشرة! فقد ${defender.username}ـ ${attackerCard.atk} نقطة حياة.`);

  checkWin(state);
  return { success: true };
}

/**
 * Advance to battle phase (from main).
 */
function goToBattlePhase(state, playerKey) {
  if (state.turn !== playerKey) return { error: 'ليس دورك.' };
  if (state.phase !== 'main') return { error: 'يجب أن تكون في المرحلة الرئيسية.' };
  state.phase = 'battle';
  state.log.push(`${state[playerKey].username} يدخل مرحلة القتال.`);
  return { success: true };
}

/**
 * End the current player's turn.
 */
function endTurn(state, playerKey) {
  if (state.turn !== playerKey) return { error: 'ليس دورك.' };
  if (state.phase === 'draw') return { error: 'يجب سحب بطاقة أولاً.' };

  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';

  // Reset per-turn flags on current player's field
  const currentPlayer = state[playerKey];
  currentPlayer.field = currentPlayer.field.map(card =>
    card ? { ...card, justSummoned: false } : null
  );
  currentPlayer.summonedThisTurn = false;
  currentPlayer.attackedThisTurn = false;

  state.turn = opponentKey;
  state.phase = 'draw';
  state.log.push(`بدأ دور ${state[opponentKey].username}.`);
  return { success: true };
}

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
  attackMonster,
  directAttack,
  goToBattlePhase,
  endTurn,
  checkWin,
};
