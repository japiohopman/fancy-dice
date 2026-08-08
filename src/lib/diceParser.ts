import { DieType, RollParsedResult, SingleDieResult } from '../types';

export function parseAndRollFormula(formula: string): RollParsedResult {
  const cleanFormula = formula.trim().toLowerCase().replace(/\s+/g, '');
  const timestamp = new Date();

  // Split formula into tokens around + and - operators while retaining the sign
  const regex = /([+-]?)(?:(\d*)d(4|6|8|10|12|20|100|fate|f)(!(?:\d*)?|kh\d*|kl\d*|dh\d*|dl\d*)?|(\d+))/gi;

  let match: RegExpExecArray | null;
  const diceGroupResults: RollParsedResult['diceGroupResults'] = [];
  let modifierTotal = 0;
  let overallIsCrit = false;
  let overallIsFumble = false;

  // Global regex iteration
  while ((match = regex.exec(cleanFormula)) !== null) {
    const sign = match[1] === '-' ? -1 : 1;

    // If it's a fixed number modifier
    if (match[5] !== undefined) {
      modifierTotal += sign * parseInt(match[5], 10);
      continue;
    }

    // It's a dice roll group
    const count = match[2] ? parseInt(match[2], 10) : 1;
    const rawType = match[3];
    const modifierStr = match[4] || '';

    const dieType: DieType = rawType === 'f' || rawType === 'fate' ? 'dfate' : (`d${rawType}` as DieType);

    const maxSides = getDieSides(dieType);
    const rolls: SingleDieResult[] = [];

    // Parse options: exploding (!), keep high (khX), keep low (klX)
    const isExploding = modifierStr.startsWith('!');
    let keepType: 'kh' | 'kl' | undefined = undefined;
    let keepCount: number | undefined = undefined;

    if (modifierStr.startsWith('kh')) {
      keepType = 'kh';
      keepCount = parseInt(modifierStr.slice(2), 10) || 1;
    } else if (modifierStr.startsWith('kl')) {
      keepType = 'kl';
      keepCount = parseInt(modifierStr.slice(2), 10) || 1;
    } else if (modifierStr.startsWith('dh')) { // drop highest -> keep lowest
      keepType = 'kl';
      keepCount = Math.max(0, count - (parseInt(modifierStr.slice(2), 10) || 1));
    } else if (modifierStr.startsWith('dl')) { // drop lowest -> keep highest
      keepType = 'kh';
      keepCount = Math.max(0, count - (parseInt(modifierStr.slice(2), 10) || 1));
    }

    // Execute individual rolls
    for (let i = 0; i < count; i++) {
      let val = rollSingleDie(dieType);
      let isCrit = false;
      let isFumble = false;

      if (dieType === 'd20') {
        if (val === 20) { isCrit = true; overallIsCrit = true; }
        if (val === 1) { isFumble = true; overallIsFumble = true; }
      } else if (dieType !== 'dfate') {
        if (val === maxSides) isCrit = true;
      }

      let text = String(val);
      if (dieType === 'dfate') {
        text = val === 1 ? '+' : val === -1 ? '-' : '0';
      }

      rolls.push({
        id: `${dieType}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        type: dieType,
        value: val,
        text,
        isCrit,
        isFumble
      });

      // Handle exploding dice
      if (isExploding && val === maxSides && dieType !== 'dfate') {
        let explosions = 0;
        let explodeVal = val;
        while (explodeVal === maxSides && explosions < 5) { // cap explosions to avoid infinite loops
          explosions++;
          explodeVal = rollSingleDie(dieType);
          rolls.push({
            id: `${dieType}-explode-${explosions}-${Math.random().toString(36).substring(2, 7)}`,
            type: dieType,
            value: explodeVal,
            text: `${explodeVal}!`,
            exploded: true,
            isCrit: explodeVal === maxSides
          });
        }
      }
    }

    // Process keep / drop logic if specified
    if (keepType && keepCount !== undefined && keepCount < rolls.length) {
      // Sort copies to determine which ones to keep
      const sortedIndices = rolls
        .map((r, idx) => ({ idx, val: r.value }))
        .sort((a, b) => keepType === 'kh' ? b.val - a.val : a.val - b.val);

      const keptIndices = new Set(sortedIndices.slice(0, keepCount).map(item => item.idx));

      rolls.forEach((r, idx) => {
        if (!keptIndices.has(idx)) {
          r.dropped = true;
        }
      });
    }

    // Sum up kept rolls
    const sum = rolls.reduce((acc, r) => acc + (r.dropped ? 0 : r.value), 0) * sign;

    diceGroupResults.push({
      count,
      dieType,
      rolls,
      sum,
      droppedCount: rolls.filter(r => r.dropped).length,
      keepType
    });
  }

  // Calculate final total
  const diceTotal = diceGroupResults.reduce((acc, grp) => acc + grp.sum, 0);
  const finalTotal = diceTotal + modifierTotal;

  // Fallback if formula couldn't be parsed at all
  if (diceGroupResults.length === 0) {
    const defaultRoll = rollSingleDie('d20');
    return {
      rawFormula: formula || '1d20',
      diceGroupResults: [{
        count: 1,
        dieType: 'd20',
        rolls: [{
          id: `d20-0-${Math.random().toString(36).substring(2, 7)}`,
          type: 'd20',
          value: defaultRoll,
          text: String(defaultRoll),
          isCrit: defaultRoll === 20,
          isFumble: defaultRoll === 1
        }],
        sum: defaultRoll
      }],
      modifier: 0,
      total: defaultRoll,
      isCrit: defaultRoll === 20,
      isFumble: defaultRoll === 1,
      timestamp
    };
  }

  return {
    rawFormula: cleanFormula,
    diceGroupResults,
    modifier: modifierTotal,
    total: finalTotal,
    isCrit: overallIsCrit,
    isFumble: overallIsFumble,
    timestamp
  };
}

export function rollSingleDie(dieType: DieType): number {
  switch (dieType) {
    case 'd4': return Math.floor(Math.random() * 4) + 1;
    case 'd6': return Math.floor(Math.random() * 6) + 1;
    case 'd8': return Math.floor(Math.random() * 8) + 1;
    case 'd10': return Math.floor(Math.random() * 10) + 1;
    case 'd12': return Math.floor(Math.random() * 12) + 1;
    case 'd20': return Math.floor(Math.random() * 20) + 1;
    case 'd100': return Math.floor(Math.random() * 100) + 1;
    case 'dfate': return Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    default: return Math.floor(Math.random() * 6) + 1;
  }
}

export function getDieSides(dieType: DieType): number {
  switch (dieType) {
    case 'd4': return 4;
    case 'd6': return 6;
    case 'd8': return 8;
    case 'd10': return 10;
    case 'd12': return 12;
    case 'd20': return 20;
    case 'd100': return 100;
    case 'dfate': return 3;
  }
}
