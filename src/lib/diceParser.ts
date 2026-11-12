import { DieType, RollParsedResult, SingleDieResult } from '../types';

export type DiceFormulaErrorCode = 'empty' | 'invalid' | 'unsupported' | 'limit';

export class DiceFormulaError extends Error {
  readonly code: DiceFormulaErrorCode;

  constructor(message: string, code: DiceFormulaErrorCode = 'invalid') {
    super(message);
    this.name = 'DiceFormulaError';
    this.code = code;
  }
}

const MAX_FORMULA_LENGTH = 128;
const MAX_DICE_PER_GROUP = 100;
const MAX_TOTAL_DICE = 100;
const MAX_EXPLOSIONS_PER_DIE = 5;
const MAX_EXPANDED_ROLLS = 200;

function invalidNear(formula: string, index: number): DiceFormulaError {
  const fragment = formula.slice(index, index + 12);
  return new DiceFormulaError(
    fragment
      ? 'Invalid dice notation near "' + fragment + '". Check the formula and its operators.'
      : 'The dice formula ends unexpectedly. Check the last dice group or modifier.'
  );
}

function parseSafeInteger(raw: string, fallback: number, description: string): number {
  const value = raw.length > 0 ? Number(raw) : fallback;
  if (!Number.isSafeInteger(value)) {
    throw new DiceFormulaError(description + ' must be a safe whole number.', 'limit');
  }
  return value;
}

/**
 * Validates and evaluates a complete dice expression.
 *
 * Supported syntax: d4/d6/d8/d10/d12/d20/d100, dF/dFate,
 * signed dice groups and numeric modifiers, kh/kl/dh/dl, and
 * exploding dice with an optional 1–5 explosion cap (default 5).
 */
export function parseAndRollFormula(formula: string): RollParsedResult {
  const cleanFormula = typeof formula === 'string'
    ? formula.trim().toLowerCase().replace(/\s+/g, '')
    : '';

  if (!cleanFormula) {
    throw new DiceFormulaError('Enter a dice formula, for example 1d20.', 'empty');
  }
  if (cleanFormula.length > MAX_FORMULA_LENGTH) {
    throw new DiceFormulaError('The dice formula is too long. Use at most ' + MAX_FORMULA_LENGTH + ' characters.', 'limit');
  }

  const timestamp = new Date();
  const diceGroupResults: RollParsedResult['diceGroupResults'] = [];
  let modifierTotal = 0;
  let overallIsCrit = false;
  let overallIsFumble = false;
  let index = 0;
  let termCount = 0;
  let totalBaseDice = 0;
  let maximumExpandedRolls = 0;

  const dicePattern = /^(\d*)d(100|12|10|20|8|6|4|fate|f)(?:(kh|kl|dh|dl)(\d*)|!(\d*))?/i;

  while (index < cleanFormula.length) {
    let sign = 1;
    const current = cleanFormula[index];

    if (current === '+' || current === '-') {
      sign = current === '-' ? -1 : 1;
      index += 1;
      if (index >= cleanFormula.length || cleanFormula[index] === '+' || cleanFormula[index] === '-') {
        throw invalidNear(cleanFormula, index);
      }
    } else if (termCount > 0) {
      throw new DiceFormulaError(
        'Expected "+" or "-" before "' + cleanFormula.slice(index, index + 12) + '".',
        'invalid'
      );
    }

    const remaining = cleanFormula.slice(index);
    const diceMatch = dicePattern.exec(remaining);

    if (diceMatch) {
      const count = parseSafeInteger(diceMatch[1], 1, 'Dice count');
      if (count < 1) {
        throw new DiceFormulaError('Each dice group must roll at least one die.', 'invalid');
      }
      if (count > MAX_DICE_PER_GROUP) {
        throw new DiceFormulaError('A dice group may contain at most ' + MAX_DICE_PER_GROUP + ' dice.', 'limit');
      }

      totalBaseDice += count;
      if (totalBaseDice > MAX_TOTAL_DICE) {
        throw new DiceFormulaError('A formula may roll at most ' + MAX_TOTAL_DICE + ' dice before explosions.', 'limit');
      }

      const rawType = diceMatch[2].toLowerCase();
      const dieType: DieType = rawType === 'f' || rawType === 'fate'
        ? 'dfate'
        : ('d' + rawType) as DieType;
      const modifierKind = diceMatch[3] || '';
      const modifierAmount = diceMatch[4] || '';
      const explosionAmount = diceMatch[5] || '';

      let keepType: 'kh' | 'kl' | undefined;
      let keepCount: number | undefined;
      let maxExplosions = 0;

      if (modifierKind === 'kh' || modifierKind === 'kl') {
        keepType = modifierKind;
        keepCount = parseSafeInteger(modifierAmount, 1, 'Keep count');
        if (keepCount < 1 || keepCount > count) {
          throw new DiceFormulaError('Keep count must be between 1 and the number of dice in that group.');
        }
      } else if (modifierKind === 'dh' || modifierKind === 'dl') {
        const dropCount = parseSafeInteger(modifierAmount, 1, 'Drop count');
        if (dropCount < 0 || dropCount >= count) {
          throw new DiceFormulaError('Drop count must leave at least one die in the group.');
        }
        keepType = modifierKind === 'dh' ? 'kl' : 'kh';
        keepCount = count - dropCount;
      } else if (diceMatch[0].includes('!')) {
        if (dieType === 'dfate') {
          throw new DiceFormulaError('Exploding dice are not supported for Fate dice.', 'unsupported');
        }
        maxExplosions = parseSafeInteger(explosionAmount, MAX_EXPLOSIONS_PER_DIE, 'Explosion limit');
        if (maxExplosions < 1 || maxExplosions > MAX_EXPLOSIONS_PER_DIE) {
          throw new DiceFormulaError('Explosion limit must be between 1 and ' + MAX_EXPLOSIONS_PER_DIE + '.', 'limit');
        }
      }

      maximumExpandedRolls += count * (1 + maxExplosions);
      if (maximumExpandedRolls > MAX_EXPANDED_ROLLS) {
        throw new DiceFormulaError(
          'This formula could generate more than ' + MAX_EXPANDED_ROLLS + ' dice results. Reduce the dice count or explosion limit.',
          'limit'
        );
      }

      index += diceMatch[0].length;
      const maxSides = getDieSides(dieType);
      const rolls: SingleDieResult[] = [];

      for (let i = 0; i < count; i++) {
        const value = rollSingleDie(dieType);
        let isCrit = false;
        let isFumble = false;

        if (dieType === 'd20') {
          if (value === 20) {
            isCrit = true;
            overallIsCrit = true;
          }
          if (value === 1) {
            isFumble = true;
            overallIsFumble = true;
          }
        } else if (dieType !== 'dfate' && value === maxSides) {
          isCrit = true;
          overallIsCrit = true;
        }

        const text = dieType === 'dfate'
          ? value === 1 ? '+' : value === -1 ? '-' : '0'
          : String(value);

        rolls.push({
          id: dieType + '-' + i + '-' + Math.random().toString(36).substring(2, 7),
          type: dieType,
          value,
          text,
          isCrit,
          isFumble,
        });

        if (maxExplosions > 0 && value === maxSides) {
          let explosions = 0;
          let explosionValue = value;

          while (explosionValue === maxSides && explosions < maxExplosions) {
            explosions += 1;
            explosionValue = rollSingleDie(dieType);
            const explodedIsCrit = explosionValue === maxSides;
            if (explodedIsCrit) overallIsCrit = true;

            rolls.push({
              id: dieType + '-explode-' + i + '-' + explosions + '-' + Math.random().toString(36).substring(2, 7),
              type: dieType,
              value: explosionValue,
              text: String(explosionValue) + '!',
              exploded: true,
              isCrit: explodedIsCrit,
              isFumble: dieType === 'd20' && explosionValue === 1,
            });
          }
        }
      }

      if (keepType && keepCount !== undefined && keepCount < rolls.length) {
        const sortedIndices = rolls
          .map((roll, rollIndex) => ({ index: rollIndex, value: roll.value }))
          .sort((left, right) => keepType === 'kh'
            ? right.value - left.value
            : left.value - right.value);

        const keptIndices = new Set(sortedIndices.slice(0, keepCount).map(item => item.index));
        rolls.forEach((roll, rollIndex) => {
          if (!keptIndices.has(rollIndex)) {
            roll.dropped = true;
          }
        });
      }

      const sum = rolls.reduce((total, roll) => total + (roll.dropped ? 0 : roll.value), 0) * sign;
      diceGroupResults.push({
        count,
        dieType,
        rolls,
        sum,
        droppedCount: rolls.filter(roll => roll.dropped).length,
        keepType,
      });
    } else {
      const numberMatch = /^\d+/.exec(remaining);
      if (!numberMatch) {
        throw invalidNear(cleanFormula, index);
      }

      const value = parseSafeInteger(numberMatch[0], 0, 'Modifier');
      modifierTotal += sign * value;
      if (!Number.isSafeInteger(modifierTotal)) {
        throw new DiceFormulaError('The combined modifier is outside the supported numeric range.', 'limit');
      }
      index += numberMatch[0].length;
    }

    termCount += 1;
  }

  if (diceGroupResults.length === 0) {
    throw new DiceFormulaError('A formula must contain at least one dice group, for example 1d20.', 'invalid');
  }

  const diceTotal = diceGroupResults.reduce((total, group) => total + group.sum, 0);
  const finalTotal = diceTotal + modifierTotal;
  if (!Number.isSafeInteger(finalTotal)) {
    throw new DiceFormulaError('The final roll total is outside the supported numeric range.', 'limit');
  }

  return {
    rawFormula: cleanFormula,
    diceGroupResults,
    modifier: modifierTotal,
    total: finalTotal,
    isCrit: overallIsCrit,
    isFumble: overallIsFumble,
    timestamp,
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

export function updateParsedResultWithPhysicalRolls(
  parsed: RollParsedResult,
  physicalResults: any
): RollParsedResult {
  // Create a map/list of physical values for each die type
  const physicalValuesByType: Record<string, number[]> = {};

  if (Array.isArray(physicalResults)) {
    physicalResults.forEach((group: any) => {
      if (group && Array.isArray(group.rolls)) {
        group.rolls.forEach((r: any) => {
          const type = r.dieType || `d${r.sides}`;
          if (!physicalValuesByType[type]) {
            physicalValuesByType[type] = [];
          }
          physicalValuesByType[type].push(r.value);
        });
      }
    });
  }

  let overallIsCrit = false;
  let overallIsFumble = false;

  const updatedDiceGroupResults = parsed.diceGroupResults.map(group => {
    const updatedRolls = group.rolls.map(die => {
      const physicalVals = physicalValuesByType[die.type];
      let val = die.value; // Keep original if no physical roll found (fallback)
      if (physicalVals && physicalVals.length > 0) {
        val = physicalVals.shift()!;
      }

      const maxSides = getDieSides(die.type);
      let isCrit = false;
      let isFumble = false;

      if (die.type === 'd20') {
        if (val === 20) { isCrit = true; overallIsCrit = true; }
        if (val === 1) { isFumble = true; overallIsFumble = true; }
      } else if (die.type !== 'dfate') {
        if (val === maxSides) isCrit = true;
      }

      let text = String(val);
      if (die.type === 'dfate') {
        text = val === 1 ? '+' : val === -1 ? '-' : '0';
      } else if (die.exploded) {
        text = `${val}!`;
      }

      return {
        ...die,
        value: val,
        text,
        isCrit,
        isFumble
      };
    });

    const originalKeptRollsSum = group.rolls.reduce((acc, r) => acc + (r.dropped ? 0 : r.value), 0);
    const sign = originalKeptRollsSum === 0 ? (group.sum < 0 ? -1 : 1) : (group.sum / originalKeptRollsSum < 0 ? -1 : 1);
    const sum = updatedRolls.reduce((acc, r) => acc + (r.dropped ? 0 : r.value), 0) * sign;

    return {
      ...group,
      rolls: updatedRolls,
      sum
    };
  });

  // Calculate final total
  const diceTotal = updatedDiceGroupResults.reduce((acc, grp) => acc + grp.sum, 0);
  const finalTotal = diceTotal + parsed.modifier;

  return {
    ...parsed,
    diceGroupResults: updatedDiceGroupResults,
    total: finalTotal,
    isCrit: overallIsCrit,
    isFumble: overallIsFumble,
    timestamp: new Date()
  };
}
