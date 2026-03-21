// 20 unique Monster cards for the deck
const MONSTER_CARDS = [
  { id: 1,  name: "المشعوذ الأسود",      atk: 2500, type: "ساحر", level: 7, color: "#6a0dad" },
  { id: 2,  name: "التنين الأبيض أزرق العينين", atk: 3000, type: "تنين",  level: 8, color: "#1a6dbd" },
  { id: 3,  name: "التنين الأسود أحمر العينين",  atk: 2400, type: "تنين",  level: 7, color: "#8b0000" },
  { id: 4,  name: "الجمجمة المستدعاة",     atk: 2500, type: "شيطان",       level: 6, color: "#4a0080" },
  { id: 5,  name: "جاي الفارس العنيد", atk: 2300, type: "محارب",level: 6, color: "#8b4513" },
  { id: 6,  name: "الحارس السلتي",    atk: 1400, type: "محارب",     level: 4, color: "#2e8b57" },
  { id: 7,  name: "كوريبو",            atk: 300,  type: "شيطان",       level: 1, color: "#8b6914" },
  { id: 8,  name: "لا جين",            atk: 1800, type: "شيطان",       level: 4, color: "#b8860b" },
  { id: 9,  name: "حشرة آكلة الرجال",      atk: 450,  type: "حشرة",      level: 2, color: "#556b2f" },
  { id: 10, name: "جدار الأوهام",   atk: 1000, type: "شيطان",       level: 4, color: "#483d8b" },
  { id: 11, name: "العفريت الوحشي",          atk: 1300, type: "شيطان",       level: 4, color: "#8b0000" },
  { id: 12, name: "ثور المعركة",          atk: 1700, type: "وحش محارب",level: 4,color: "#8b4513" },
  { id: 13, name: "العملاق ذو العين الواحدة",   atk: 1200, type: "وحش محارب",level: 4,color: "#556b2f" },
  { id: 14, name: "الجندي الصخري العملاق", atk: 1300, type: "صخرة",   level: 3, color: "#696969" },
  { id: 15, name: "مقبرة الماموث",  atk: 1200, type: "ديناصور",   level: 3, color: "#8b7355" },
  { id: 16, name: "الناب الفضي",        atk: 1200, type: "وحش",       level: 3, color: "#b0c4de" },
  { id: 17, name: "الرمادي المظلم",          atk: 800,  type: "زومبي",      level: 3, color: "#2f4f4f" },
  { id: 18, name: "ريكس الملك ذو الرأسين",atk: 1600, type: "ديناصور",   level: 4, color: "#006400" },
  { id: 19, name: "الدمية المارقة",         atk: 1600, type: "ساحر", level: 4, color: "#9400d3" },
  { id: 20, name: "القزم الغامض",       atk: 800,  type: "ساحر", level: 4, color: "#ff69b4" },
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
