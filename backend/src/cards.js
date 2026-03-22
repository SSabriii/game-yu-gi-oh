// Monster Cards (48), Spell Cards (20), Trap Cards (12)
// Added HP property as requested (Yu-Gi-Oh rule customization)
const MONSTER_CARDS = [
  { id: 1, name: "الساحر الأزرق", atk: 2500, def: 2000, hp: 4000, level: 6, effect: "عند تدميره يمكنك إعادة وحش من المقبرة.", type: "Monster", effectType: "revive_on_destruct" },
  { id: 2, name: "تنين النار", atk: 3000, def: 2500, hp: 5000, level: 7, effect: "يمكنه مهاجمة الوحوش مرتين في نفس الدور.", type: "Monster", effectType: "double_attack" },
  { id: 3, name: "مقاتل الظلام", atk: 1800, def: 1200, hp: 3000, level: 4, effect: "عند مهاجمته يزيد ATK 500 مؤقت.", type: "Monster", effectType: "atk_boost_on_attack" },
  { id: 4, name: "فرسان الرياح", atk: 1500, def: 1600, hp: 3500, level: 4, effect: "يمكنه التحرك بين مواقع الوحوش.", type: "Monster", effectType: "move_slot" },
  { id: 5, name: "وحش الثلج", atk: 2000, def: 2200, hp: 4000, level: 5, effect: "عند مهاجمته يخفض ATK للوحش الخصم 300.", type: "Monster", effectType: "reduce_opp_atk" },
  { id: 6, name: "ملاك الحماية", atk: 1000, def: 3000, hp: 6000, level: 5, effect: "كل وحش في الدفاع بجانبه يحصل على +200 DEF.", type: "Monster", effectType: "side_def_boost" },
  { id: 7, name: "فارس البرق", atk: 2300, def: 1500, hp: 3500, level: 6, effect: "يمكنه مهاجمة وحوش الدفاع مباشرة.", type: "Monster", effectType: "pierce_def" },
  { id: 8, name: "عفريت الظلال", atk: 1700, def: 1200, hp: 2500, level: 4, effect: "عند تدميره، يمكنك سحب بطاقة إضافية.", type: "Monster", effectType: "draw_on_destruct" },
  { id: 9, name: "تنين البحيرة", atk: 2600, def: 2100, hp: 4500, level: 6, effect: "عند مهاجمته وحش في الدفاع يخفض DEF 300.", type: "Monster", effectType: "reduce_opp_def" },
  { id: 10, name: "مقاتل النار", atk: 1900, def: 1400, hp: 3200, level: 4, effect: "إذا هاجم مباشرة يزيد ATK مؤقت +500.", type: "Monster", effectType: "direct_atk_boost" },
  { id: 11, name: "روح الغابة", atk: 1500, def: 1800, hp: 4200, level: 4, effect: "يمكن استدعاؤه من المقبرة مرة واحدة.", type: "Monster", effectType: "self_revive" },
  { id: 12, name: "وحش البركان", atk: 2800, def: 2400, hp: 5500, level: 7, effect: "عند تدميره يدمر وحش خصم عشوائي.", type: "Monster", effectType: "destroy_opp_on_destruct" },
  { id: 13, name: "فارس البحر", atk: 2100, def: 1900, hp: 3800, level: 5, effect: "يمكنه حماية وحش بجانبه من هجوم واحد.", type: "Monster", effectType: "protect_side" },
  { id: 14, name: "عاصفة الثلج", atk: 2200, def: 2000, hp: 4000, level: 6, effect: "عند مهاجمته يقلل ATK للخصم 200.", type: "Monster", effectType: "reduce_opp_atk_minor" },
  { id: 15, name: "روح الشمس", atk: 2500, def: 2000, hp: 4500, level: 6, effect: "عند هجومه مباشرة يضيف +300 ATK للوضع التالي.", type: "Monster", effectType: "next_turn_boost" },
  { id: 16, name: "فارس الليل", atk: 1800, def: 1700, hp: 3400, level: 5, effect: "يمكنه تفادي الهجوم مرة واحدة.", type: "Monster", effectType: "evade_once" },
  { id: 17, name: "مجنون الرياح", atk: 1600, def: 1400, hp: 3000, level: 4, effect: "إذا تم تدميره يسحب اللاعب بطاقة.", type: "Monster", effectType: "draw_on_destruct" },
  { id: 18, name: "تنين الغابة", atk: 2400, def: 2100, hp: 4200, level: 6, effect: "يمكنه مهاجمة أي وحش بغض النظر عن الوضع.", type: "Monster", effectType: "attack_any_pos" },
  { id: 19, name: "ملاك النار", atk: 2000, def: 2500, hp: 4800, level: 5, effect: "يعيد وحشك إلى يدك عند تدميره.", type: "Monster", effectType: "return_to_hand_on_destruct" },
  { id: 20, name: "فارس الظلال", atk: 1900, def: 1600, hp: 3200, level: 4, effect: "يمكنه التحرك بين مواقع الوحوش.", type: "Monster", effectType: "move_slot" },
  { id: 21, name: "روح الجبل", atk: 1500, def: 2800, hp: 5500, level: 5, effect: "كل هجوم ضدها يخفض الضرر 200 فقط.", type: "Monster", effectType: "reduce_battle_damage" },
  { id: 22, name: "تنين البرق", atk: 2700, def: 2200, hp: 4600, level: 7, effect: "عند مهاجمته مباشرة يضيف 400 ATK مؤقت.", type: "Monster", effectType: "direct_atk_boost_lightning" },
  { id: 23, name: "محارب الرياح", atk: 1800, def: 1500, hp: 3000, level: 4, effect: "يمكن استدعاؤه من المقبرة إذا تم تدمير وحش.", type: "Monster", effectType: "revive_on_ally_destruct" },
  { id: 24, name: "ملاك الليل", atk: 2000, def: 2100, hp: 4000, level: 5, effect: "يمكنه منع وحش الخصم من مهاجمة الدور التالي.", type: "Monster", effectType: "stun_opp" },
  { id: 25, name: "تنين الماء", atk: 2300, def: 1900, hp: 3900, level: 6, effect: "عند مهاجمته يخفض ATK للوحش الخصم 300.", type: "Monster", effectType: "reduce_opp_atk" },
  { id: 26, name: "روح الظلال", atk: 1700, def: 1500, hp: 3100, level: 4, effect: "عند تدميره يتم سحب بطاقة واحدة.", type: "Monster", effectType: "draw_on_destruct" },
  { id: 27, name: "وحش الصحراء", atk: 2200, def: 2000, hp: 4000, level: 5, effect: "يمكنه مهاجمة أكثر من وحش واحد في دور واحد.", type: "Monster", effectType: "multi_attack" },
  { id: 28, name: "فارس الشمس", atk: 2500, def: 2000, hp: 4400, level: 6, effect: "عند مهاجمته مباشرة يزيد ATK 500 مؤقت.", type: "Monster", effectType: "direct_atk_boost" },
  { id: 29, name: "تنين القمر", atk: 2800, def: 2400, hp: 5400, level: 7, effect: "عند تدميره يدمر وحش خصم عشوائي.", type: "Monster", effectType: "destroy_opp_on_destruct" },
  { id: 30, name: "روح البركان", atk: 2100, def: 1800, hp: 3800, level: 5, effect: "عند مهاجمته يضيف 300 ATK مؤقت.", type: "Monster", effectType: "atk_boost_on_attack_minor" },
  { id: 31, name: "محارب الظلام", atk: 1900, def: 1500, hp: 3200, level: 4, effect: "يمكن استدعاؤه من المقبرة مرة واحدة.", type: "Monster", effectType: "self_revive" },
  { id: 32, name: "ساحر الرياح", atk: 2000, def: 1900, hp: 4000, level: 5, effect: "يقلل ATK وحش الخصم 200 عند مهاجمته.", type: "Monster", effectType: "reduce_opp_atk_minor" },
  { id: 33, name: "تنين الثلج", atk: 2600, def: 2200, hp: 4800, level: 6, effect: "عند مهاجمته يخفض DEF للخصم 300.", type: "Monster", effectType: "reduce_opp_def" },
  { id: 34, name: "فارس الجليد", atk: 1800, def: 2200, hp: 5000, level: 4, effect: "كل هجوم ضد وحشك يقلل الضرر 200.", type: "Monster", effectType: "reduce_battle_damage" },
  { id: 35, name: "روح النار", atk: 2400, def: 2000, hp: 4400, level: 6, effect: "عند مهاجمته مباشرة يسحب بطاقة.", type: "Monster", effectType: "draw_on_direct_atk" },
  { id: 36, name: "ملاك الرياح", atk: 2100, def: 1800, hp: 3800, level: 5, effect: "يمكنه منع هجوم وحش مرة واحدة.", type: "Monster", effectType: "block_attack_once" },
  { id: 37, name: "تنين الليل", atk: 2700, def: 2300, hp: 5000, level: 7, effect: "عند تدميره يمكن استدعاء وحش من المقبرة.", type: "Monster", effectType: "revive_ally_on_destruct" },
  { id: 38, name: "محارب الشمس", atk: 2000, def: 1900, hp: 4000, level: 5, effect: "يزيد ATK مؤقت 300 عند مهاجمته.", type: "Monster", effectType: "atk_boost_on_attack_minor" },
  { id: 39, name: "روح القمر", atk: 1600, def: 1700, hp: 3500, level: 4, effect: "عند تدميره تسحب بطاقة واحدة.", type: "Monster", effectType: "draw_on_destruct" },
  { id: 40, name: "فارس الثلج", atk: 1800, def: 2000, hp: 3800, level: 5, effect: "عند مهاجمته يقلل ATK للوحش الخصم 200.", type: "Monster", effectType: "reduce_opp_atk_minor" },
  { id: 41, name: "تنين الرياح", atk: 2500, def: 2100, hp: 4500, level: 6, effect: "يمكنه مهاجمة أكثر من وحش واحد.", type: "Monster", effectType: "multi_attack" },
  { id: 42, name: "ساحر الظلام", atk: 2000, def: 1800, hp: 3600, level: 5, effect: "يمكن استدعاؤه من المقبرة مرة واحدة.", type: "Monster", effectType: "self_revive" },
  { id: 43, name: "محارب الجليد", atk: 1800, def: 1600, hp: 3000, level: 4, effect: "يزيد ATK مؤقت 300 عند مهاجمته.", type: "Monster", effectType: "atk_boost_on_attack_minor" },
  { id: 44, name: "روح البحر", atk: 2100, def: 1900, hp: 4000, level: 5, effect: "عند مهاجمته يقلل ATK وحش الخصم 200.", type: "Monster", effectType: "reduce_opp_atk_minor" },
  { id: 45, name: "تنين الشمس", atk: 2800, def: 2500, hp: 5500, level: 7, effect: "عند تدميره يدمر وحش الخصم عشوائي.", type: "Monster", effectType: "destroy_opp_on_destruct" },
  { id: 46, name: "ملاك النار", atk: 2000, def: 2100, hp: 4200, level: 5, effect: "يعيد وحشك إلى يدك عند تدميره.", type: "Monster", effectType: "return_to_hand_on_destruct" },
  { id: 47, name: "فارس القمر", atk: 1900, def: 1800, hp: 3600, level: 4, effect: "يمكنه مهاجمة مرة إضافية.", type: "Monster", effectType: "double_attack" },
  { id: 48, name: "روح البرق", atk: 2200, def: 2000, hp: 4000, level: 6, effect: "عند مهاجمته يزيد ATK 300 مؤقت.", type: "Monster", effectType: "atk_boost_on_attack_minor" },
];

const SPELL_CARDS = [
  { id: 101, name: "سحر الشفاء", effect: "استرجاع 1000 LP.", type: "Spell", effectType: "heal_lp", value: 1000 },
  { id: 102, name: "سحر القوة", effect: "يزيد ATK وحشك +500 لمدة دور واحد.", type: "Spell", effectType: "atk_boost", value: 500, duration: 1 },
  { id: 103, name: "سحر الانعكاس", effect: "يعكس الضرر القادم من هجوم خصم وحش.", type: "Spell", effectType: "reflect_damage" },
  { id: 104, name: "سحر السحب", effect: "اسحب 2 بطاقة إضافية.", type: "Spell", effectType: "draw_cards", value: 2 },
  { id: 105, name: "سحر التضحية", effect: "تدمر وحشك لإعادة وحش أقوى من المقبرة.", type: "Spell", effectType: "tribute_revive" },
  { id: 106, name: "سحر الهجوم المباشر", effect: "يسمح لوحشك مهاجمة LP للخصم مباشرة.", type: "Spell", effectType: "enable_direct_attack" },
  { id: 107, name: "سحر الغطاء", effect: "يحمي وحشك من تدمير واحد.", type: "Spell", effectType: "protect_once" },
  { id: 108, name: "سحر النقل", effect: "تنقل وحشك من دفاع لهجوم.", type: "Spell", effectType: "change_position" },
  { id: 109, name: "سحر الإضعاف", effect: "خفض ATK كل وحش خصم 300.", type: "Spell", effectType: "reduce_all_opp_atk", value: 300 },
  { id: 110, name: "سحر الطوفان", effect: "يدمر كل وحوش الخصم الدفاعية.", type: "Spell", effectType: "destroy_all_opp_def" },
  { id: 111, name: "سحر البرق", effect: "يضيف +400 ATK لوحشك.", type: "Spell", effectType: "atk_boost_permanent", value: 400 },
  { id: 112, name: "سحر الظلال", effect: "يمنع وحش الخصم مهاجمة دور واحد.", type: "Spell", effectType: "prevent_attack", duration: 1 },
  { id: 113, name: "سحر النور", effect: "يشفي كل وحوشك 500 DEF.", type: "Spell", effectType: "heal_all_def", value: 500 },
  { id: 114, name: "سحر التجديد", effect: "استدعي وحش من المقبرة.", type: "Spell", effectType: "revive_monster" },
  { id: 115, name: "سحر السرعة", effect: "يسمح بالهجوم مرتين لوحش واحد.", type: "Spell", effectType: "enable_double_attack" },
  { id: 116, name: "سحر الدفاع", effect: "يزيد DEF لوحشك +600 لمدة دور واحد.", type: "Spell", effectType: "def_boost", value: 600, duration: 1 },
  { id: 117, name: "سحر الحماية العامة", effect: "جميع وحوشك لا تتأثر بالهجوم هذا الدور.", type: "Spell", effectType: "global_protection", duration: 1 },
  { id: 118, name: "سحر الهجوم الكوني", effect: "دمر وحش الخصم الأقوى.", type: "Spell", effectType: "destroy_strongest_opp" },
  { id: 119, name: "سحر إعادة اليد", effect: "أعد بطاقتين من يدك إلى الطاولة.", type: "Spell", effectType: "return_to_deck_draw" },
  { id: 120, name: "سحر السيطرة", effect: "سيطر على وحش خصم لدور واحد.", type: "Spell", effectType: "control_monster", duration: 1 },
];

const TRAP_CARDS = [
  { id: 201, name: "فخ الانفجار", effect: "عندما يهاجم وحشك يتم تدمير الوحش المهاجم.", type: "Trap", effectType: "destroy_attacker" },
  { id: 202, name: "فخ التجميد", effect: "يمنع وحش الخصم مهاجمة الدور التالي.", type: "Trap", effectType: "freeze_attacker" },
  { id: 203, name: "فخ السرقة", effect: "عند تدمير وحشك، سرق وحش من الخصم.", type: "Trap", effectType: "steal_monster" },
  { id: 204, name: "فخ الانعكاس", effect: "يعكس الضرر لوحش الخصم.", type: "Trap", effectType: "reflect_damage" },
  { id: 205, name: "فخ التضحية", effect: "تدمر وحش الخصم عند مهاجمته لوحش ضعيف.", type: "Trap", effectType: "destroy_on_weak_atk" },
  { id: 206, name: "فخ الشبح", effect: "عندما يهاجم وحشك، يمنع وحش الخصم من العودة للدفاع.", type: "Trap", effectType: "prevent_def_pos" },
  { id: 207, name: "فخ التفكيك", effect: "يقلل ATK لوحش مهاجم بمقدار 500.", type: "Trap", effectType: "reduce_attacker_atk", value: 500 },
  { id: 208, name: "فخ السقوط", effect: "يدمر وحش الخصم العشوائي عند الهجوم.", type: "Trap", effectType: "destroy_random_attacker" },
  { id: 209, name: "فخ النقل", effect: "يعيد وحش مهاجم لوضع الدفاع.", type: "Trap", effectType: "force_def_pos" },
  { id: 210, name: "فخ الظلال", effect: "يمنع وحش الخصم استخدام تأثيره.", type: "Trap", effectType: "negate_effect" },
  { id: 211, name: "فخ الانهيار", effect: "يدمر كل الوحوش الدفاعية عند الهجوم.", type: "Trap", effectType: "destroy_all_def" },
  { id: 212, name: "فخ الحماية", effect: "يمنع تدمير وحشكمدة دور واحد.", type: "Trap", effectType: "protect_once" },
];

const ALL_CARDS = [...MONSTER_CARDS, ...SPELL_CARDS, ...TRAP_CARDS];

/**
 * Returns a shuffled copy of a balanced deck (40 cards exactly as requested).
 * 24 Monsters, 10 Spells, 6 Traps.
 */
function createDeck() {
  const monsters = [...MONSTER_CARDS].sort(() => 0.5 - Math.random()).slice(0, 24);
  const spells = [...SPELL_CARDS].sort(() => 0.5 - Math.random()).slice(0, 10);
  const traps = [...TRAP_CARDS].sort(() => 0.5 - Math.random()).slice(0, 6);
  
  const deck = [...monsters, ...spells, ...traps];
  
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

module.exports = { MONSTER_CARDS, SPELL_CARDS, TRAP_CARDS, ALL_CARDS, createDeck };
