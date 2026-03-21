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
    return { error: 'No cards left in deck!' };
  }
  if (state.phase !== 'draw') {
    return { error: 'Not in draw phase.' };
  }
  const card = player.deck.shift();
  player.hand.push(card);
  state.log.push(`${player.username} drew ${card.name}.`);
  state.phase = 'main';
  return { success: true };
}

/**
 * Summon a monster from hand to a field slot.
 */
function summonMonster(state, playerKey, cardId, slotIndex) {
  const player = state[playerKey];
  if (state.turn !== playerKey) return { error: 'Not your turn.' };
  if (state.phase !== 'main') return { error: 'Can only summon in main phase.' };
  if (player.summonedThisTurn) return { error: 'Already summoned a monster this turn.' };
  if (slotIndex < 0 || slotIndex >= FIELD_SLOTS) return { error: 'Invalid slot.' };
  if (player.field[slotIndex] !== null) return { error: 'Slot is already occupied.' };

  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return { error: 'Card not in hand.' };

  const card = player.hand.splice(cardIndex, 1)[0];
  player.field[slotIndex] = { ...card, justSummoned: true };
  player.summonedThisTurn = true;
  state.log.push(`${player.username} summoned ${card.name} (ATK: ${card.atk}) to slot ${slotIndex + 1}.`);
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

  if (!attackerCard) return { error: 'No monster in attacker slot.' };
  if (!defenderCard) return { error: 'No monster in defender slot.' };
  if (attackerCard.justSummoned) return { error: 'This monster was just summoned and cannot attack.' };

  const diff = attackerCard.atk - defenderCard.atk;

  if (diff > 0) {
    // Attacker wins
    defender.lp -= diff;
    defender.field[defenderSlot] = null;
    state.log.push(`${attacker.username}'s ${attackerCard.name} destroyed ${defenderCard.name}! ${defender.username} loses ${diff} LP.`);
  } else if (diff < 0) {
    // Defender wins
    attacker.lp += diff; // diff is negative
    attacker.field[attackerSlot] = null;
    state.log.push(`${attacker.username}'s ${attackerCard.name} was destroyed by ${defenderCard.name}! ${attacker.username} loses ${Math.abs(diff)} LP.`);
  } else {
    // Tie — both destroyed
    attacker.field[attackerSlot] = null;
    defender.field[defenderSlot] = null;
    state.log.push(`${attackerCard.name} and ${defenderCard.name} destroyed each other!`);
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
  if (opponentHasMonsters) return { error: 'Opponent has monsters on the field. Target them instead.' };

  const attackerCard = attacker.field[attackerSlot];
  if (!attackerCard) return { error: 'No monster in attacker slot.' };
  if (attackerCard.justSummoned) return { error: 'This monster was just summoned and cannot attack.' };

  defender.lp -= attackerCard.atk;
  attacker.attackedThisTurn = true;
  state.log.push(`${attacker.username}'s ${attackerCard.name} attacks directly! ${defender.username} loses ${attackerCard.atk} LP.`);

  checkWin(state);
  return { success: true };
}

/**
 * Advance to battle phase (from main).
 */
function goToBattlePhase(state, playerKey) {
  if (state.turn !== playerKey) return { error: 'Not your turn.' };
  if (state.phase !== 'main') return { error: 'Must be in main phase.' };
  state.phase = 'battle';
  state.log.push(`${state[playerKey].username} enters battle phase.`);
  return { success: true };
}

/**
 * End the current player's turn.
 */
function endTurn(state, playerKey) {
  if (state.turn !== playerKey) return { error: 'Not your turn.' };
  if (state.phase === 'draw') return { error: 'Must draw a card first.' };

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
  state.log.push(`${state[opponentKey].username}'s turn begins.`);
  return { success: true };
}

/**
 * Check for a winner and update state.winner.
 */
function checkWin(state) {
  if (state.player1.lp <= 0 && state.player2.lp <= 0) {
    state.winner = 'draw';
    state.log.push('Draw! Both players have 0 LP.');
  } else if (state.player1.lp <= 0) {
    state.winner = 'player2';
    state.log.push(`${state.player2.username} wins!`);
  } else if (state.player2.lp <= 0) {
    state.winner = 'player1';
    state.log.push(`${state.player1.username} wins!`);
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
