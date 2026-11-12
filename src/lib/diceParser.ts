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

function getPhysicalDieType(raw: any): string | null {
  if (typeof raw?.dieType === 'string' && raw.dieType.length > 0) {
    return raw.dieType.toLowerCase();
  }
  if (Number.isFinite(raw?.sides)) {
    return 'd' + raw.sides;
  }
  return null;
}

function getRollFlags(dieType: DieType, value: number): { isCrit: boolean; isFumble: boolean; text: string } {
  const maxSides = getDieSides(dieType);
  const isCrit = dieType === 'd20' ? value === 20 : dieType !== 'dfate' && value === maxSides;
  const isFumble = dieType === 'd20' && value === 1;
  const text = dieType === 'dfate'
    ? value === 1 ? '+' : value === -1 ? '-' : '0'
    : String(value);

  return { isCrit, isFumble, text };
}

/**
 * Validates and evaluates a complete dice expression.
 *
 * Supported syntax: d4/d6/d8/d10/d12/d20/d100, dF/dFate,
 * signed dice groups and numeric modifiers, kh/kl/dh/dl, and
 * exploding dice with an optional 1–5 explosion cap (default 5).
 * Exploding dice are chained from the actual landed face in DiceBox.
 */
export function parseAndRollFormula(formula: string): RollParsedResult {
  const trimmedFormula = typeof formula === 'string' ? formula.trim().toLowerCase() : '';

  if (!trimmedFormula) {
    throw new DiceFormulaError('Enter a dice formula, for example 1d20.', 'empty');
  }
  if (trimmedFormula.length > MAX_FORMULA_LENGTH) {
    throw new DiceFormulaError('The dice formula is too long. Use at most ' + MAX_FORMULA_LENGTH + ' characters.', 'limit');
  }

  // Whitespace is allowed around + / - separators, but never inside a token.
  for (const match of trimmedFormula.matchAll(/\s+/g)) {
    const before = trimmedFormula[match.index! - 1];
    const after = trimmedFormula[match.index! + match[0].length];
    const touchesOperator = before === '+' || before === '-' || after === '+' || after === '-';
    if (!touchesOperator) {
      throw new DiceFormulaError('Spaces are only allowed around "+" or "-" operators. Check the dice notation.');
    }
  }

  const cleanFormula = trimmedFormula.replace(/\s+/g, '');
  const timestamp = new Date();
  const diceGroupResults: RollParsedResult['diceGroupResults'] = [];
  let modifierTotal = 0;
  let overallIsCrit = false;
  let overallIsFumble = false;
  let index = 0;
  let termCount = 0;
  let totalBaseDice = 0;
  let maximumExpandedRolls = 0;
  let maximumAbsoluteDiceTotal = 0;

  const dicePattern = /^(\d*)d(100|12|10|20|8|6|4|fate|f)(?:(kh|kl|dh|dl)(\d*)|!(\d*))?/i;

  while (index < cleanFormula.length) {
    let sign: 1 | -1 = 1;
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
      let explosionLimit = 0;

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
        explosionLimit = parseSafeInteger(explosionAmount, MAX_EXPLOSIONS_PER_DIE, 'Explosion limit');
        if (explosionLimit < 1 || explosionLimit > MAX_EXPLOSIONS_PER_DIE) {
          throw new DiceFormulaError('Explosion limit must be between 1 and ' + MAX_EXPLOSIONS_PER_DIE + '.', 'limit');
        }
      }

      maximumExpandedRolls += count * (1 + explosionLimit);
      if (maximumExpandedRolls > MAX_EXPANDED_ROLLS) {
        throw new DiceFormulaError(
          'This formula could generate more than ' + MAX_EXPANDED_ROLLS + ' dice results. Reduce the dice count or explosion limit.',
          'limit'
        );
      }

      const maxSides = getDieSides(dieType);
      const maxDieValue = dieType === 'dfate' ? 1 : maxSides;
      maximumAbsoluteDiceTotal += count * maxDieValue * (1 + explosionLimit);

      index += diceMatch[0].length;
      const rolls: SingleDieResult[] = [];

      // These are preview values only. Actual dice and any chained explosions
      // are resolved from DiceBox's physical completion callbacks.
      for (let i = 0; i < count; i++) {
        const value = rollSingleDie(dieType);
        const flags = getRollFlags(dieType, value);
        overallIsCrit ||= flags.isCrit;
        overallIsFumble ||= flags.isFumble;

        rolls.push({
          id: dieType + '-' + i + '-' + Math.random().toString(36).substring(2, 7),
          type: dieType,
          value,
          text: flags.text,
          isCrit: flags.isCrit,
          isFumble: flags.isFumble,
        });
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
        keepCount,
        explosionLimit,
        sign,
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

  // Conservative bounds cover every possible physical face and all explosion chains.
  if (Math.abs(modifierTotal) + maximumAbsoluteDiceTotal > Number.MAX_SAFE_INTEGER) {
    throw new DiceFormulaError('The possible roll total is outside the supported numeric range.', 'limit');
  }

  const diceTotal = diceGroupResults.reduce((total, group) => total + group.sum, 0);
  const finalTotal = diceTotal + modifierTotal;

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

export function getPendingExplosionRolls(parsed: RollParsedResult): string[] {
  const pendingByType = new Map<DieType, number>();

  parsed.diceGroupResults.forEach((group) => {
    const pendingCount = group.rolls.filter((roll) => roll.pending).length;
    if (pendingCount > 0) {
      pendingByType.set(group.dieType, (pendingByType.get(group.dieType) ?? 0) + pendingCount);
    }
  });

  return Array.from(pendingByType.entries()).map(([dieType, count]) => {
    const physicalType = dieType === 'dfate' ? 'd6' : dieType;
    return count + physicalType;
  });
}

export function updateParsedResultWithPhysicalRolls(
  parsed: RollParsedResult,
  physicalResults: any
): RollParsedResult {
  const physicalValuesByType: Record<string, number[]> = {};

  if (Array.isArray(physicalResults)) {
    physicalResults.forEach((group: any) => {
      if (group && Array.isArray(group.rolls)) {
        group.rolls.forEach((roll: any) => {
          const type = getPhysicalDieType(roll);
          if (!type || !Number.isFinite(roll.value)) return;
          if (!physicalValuesByType[type]) physicalValuesByType[type] = [];
          physicalValuesByType[type].push(roll.value);
        });
      }
    });
  }

  let overallIsCrit = false;
  let overallIsFumble = false;

  const updatedDiceGroupResults = parsed.diceGroupResults.map((group) => {
    const physicalValues = physicalValuesByType[group.dieType] ?? [];
    const updatedRolls: SingleDieResult[] = [];

    group.rolls.forEach((roll) => {
      if (roll.physical || physicalValues.length === 0) {
        updatedRolls.push(roll);
        return;
      }

      const value = physicalValues.shift()!;
      const flags = getRollFlags(group.dieType, value);
      const explosionDepth = roll.explosionDepth ?? 0;
      const updatedRoll: SingleDieResult = {
        ...roll,
        value,
        text: explosionDepth > 0 ? flags.text + '!' : flags.text,
        isCrit: flags.isCrit,
        isFumble: flags.isFumble,
        physical: true,
        pending: false,
        exploded: explosionDepth > 0,
      };

      updatedRolls.push(updatedRoll);
      overallIsCrit ||= flags.isCrit;
      overallIsFumble ||= flags.isFumble;

      if (
        group.explosionLimit &&
        value === getDieSides(group.dieType) &&
        explosionDepth < group.explosionLimit
      ) {
        const nextDepth = explosionDepth + 1;
        updatedRolls.push({
          id: group.dieType + '-explode-' + roll.id + '-' + nextDepth,
          type: group.dieType,
          value: 0,
          text: '…',
          physical: false,
          pending: true,
          exploded: true,
          explosionDepth: nextDepth,
        });
      }
    });

    // Re-evaluate keep/drop using the landed values, not parser preview values.
    const eligibleIndices = updatedRolls
      .map((roll, index) => ({ roll, index }))
      .filter(({ roll }) => roll.physical && !roll.pending);
    const normalizedRolls = updatedRolls.map((roll) => ({ ...roll, dropped: undefined }));

    if (group.keepType && group.keepCount !== undefined && group.keepCount < eligibleIndices.length) {
      const sorted = eligibleIndices
        .map(({ roll, index }) => ({ index, value: roll.value }))
        .sort((left, right) => group.keepType === 'kh'
          ? right.value - left.value
          : left.value - right.value);
      const keptIndices = new Set(sorted.slice(0, group.keepCount).map((item) => item.index));
      eligibleIndices.forEach(({ index }) => {
        if (!keptIndices.has(index)) {
          normalizedRolls[index] = { ...normalizedRolls[index], dropped: true };
        }
      });
    }

    const sign = group.sign ?? (group.sum < 0 ? -1 : 1);
    const sum = normalizedRolls.reduce(
      (total, roll) => total + (roll.physical && !roll.pending && !roll.dropped ? roll.value : 0),
      0
    ) * sign;

    return {
      ...group,
      rolls: normalizedRolls,
      sum,
      droppedCount: normalizedRolls.filter((roll) => roll.physical && roll.dropped).length,
    };
  });

  const diceTotal = updatedDiceGroupResults.reduce((total, group) => total + group.sum, 0);
  const finalTotal = diceTotal + parsed.modifier;
  if (!Number.isSafeInteger(finalTotal)) {
    throw new DiceFormulaError('The physical roll total is outside the supported numeric range.', 'limit');
  }

  return {
    ...parsed,
    diceGroupResults: updatedDiceGroupResults,
    total: finalTotal,
    isCrit: overallIsCrit,
    isFumble: overallIsFumble,
    timestamp: new Date(),
  };
}
