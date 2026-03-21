// 20 unique Monster cards for the deck
const MONSTER_CARDS = [
  { id: 1,  name: "Dark Magician",      atk: 2500, type: "Spellcaster", level: 7, color: "#6a0dad" },
  { id: 2,  name: "Blue-Eyes White Dragon", atk: 3000, type: "Dragon",  level: 8, color: "#1a6dbd" },
  { id: 3,  name: "Red-Eyes Black Dragon",  atk: 2400, type: "Dragon",  level: 7, color: "#8b0000" },
  { id: 4,  name: "Summoned Skull",     atk: 2500, type: "Fiend",       level: 6, color: "#4a0080" },
  { id: 5,  name: "Gaia The Fierce Knight", atk: 2300, type: "Warrior",level: 6, color: "#8b4513" },
  { id: 6,  name: "Celtic Guardian",    atk: 1400, type: "Warrior",     level: 4, color: "#2e8b57" },
  { id: 7,  name: "Kuriboh",            atk: 300,  type: "Fiend",       level: 1, color: "#8b6914" },
  { id: 8,  name: "La Jinn",            atk: 1800, type: "Fiend",       level: 4, color: "#b8860b" },
  { id: 9,  name: "Man-Eater Bug",      atk: 450,  type: "Insect",      level: 2, color: "#556b2f" },
  { id: 10, name: "Wall of Illusion",   atk: 1000, type: "Fiend",       level: 4, color: "#483d8b" },
  { id: 11, name: "Feral Imp",          atk: 1300, type: "Fiend",       level: 4, color: "#8b0000" },
  { id: 12, name: "Battle Ox",          atk: 1700, type: "Beast-Warrior",level: 4,color: "#8b4513" },
  { id: 13, name: "Hitotsu-Me Giant",   atk: 1200, type: "Beast-Warrior",level: 4,color: "#556b2f" },
  { id: 14, name: "Giant Soldier of Stone", atk: 1300, type: "Rock",   level: 3, color: "#696969" },
  { id: 15, name: "Mammoth Graveyard",  atk: 1200, type: "Dinosaur",   level: 3, color: "#8b7355" },
  { id: 16, name: "Silver Fang",        atk: 1200, type: "Beast",       level: 3, color: "#b0c4de" },
  { id: 17, name: "Dark Gray",          atk: 800,  type: "Zombie",      level: 3, color: "#2f4f4f" },
  { id: 18, name: "Two-Headed King Rex",atk: 1600, type: "Dinosaur",   level: 4, color: "#006400" },
  { id: 19, name: "Rogue Doll",         atk: 1600, type: "Spellcaster", level: 4, color: "#9400d3" },
  { id: 20, name: "Mystical Elf",       atk: 800,  type: "Spellcaster", level: 4, color: "#ff69b4" },
];

/**
 * Returns a shuffled copy of the full deck (20 cards, one of each).
 */
function createDeck() {
  const deck = MONSTER_CARDS.map(card => ({ ...card }));
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

module.exports = { MONSTER_CARDS, createDeck };
