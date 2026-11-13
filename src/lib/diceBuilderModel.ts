import { DieType } from '../types';

export type DiceBuilderAdvantage = 'none' | 'advantage' | 'disadvantage';

export interface DiceBuilderState {
  stagedDice: Record<DieType, number>;
  modifier: number;
  advantage: DiceBuilderAdvantage;
}

const DIE_TYPES: DieType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100', 'dfate'];
const DICE_TOKEN = /^(\d*)d(100|12|10|20|8|6|4|fate|f)(?:(kh|kl)(\d*))?/i;
const EMPTY_DICE: Record<DieType, number> = {
  d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0, dfate: 0,
};

/** Creates an empty, representable builder state. */
export function createEmptyDiceBuilderState(): DiceBuilderState {
  return { stagedDice: { ...EMPTY_DICE }, modifier: 0, advantage: 'none' };
}

/** The picker reset target matches the app's default roll. */
export function createDefaultDiceBuilderState(): DiceBuilderState {
  return { stagedDice: { ...EMPTY_DICE, d20: 1 }, modifier: 0, advantage: 'none' };
}

/**
 * Converts formulas supported by the visual picker into its state model.
 * Returns null for advanced/custom notation so callers can preserve it unchanged.
 */
export function parseDiceBuilderFormula(formula: string): DiceBuilderState | null {
  if (typeof formula !== 'string') return null;
  const trimmed = formula.trim();
  if (!trimmed) return createEmptyDiceBuilderState();

  // Match the main parser's whitespace rule: spaces may surround operators only.
  for (const match of trimmed.matchAll(/\s+/g)) {
    const before = trimmed[match.index! - 1];
    const after = trimmed[match.index! + match[0].length];
    if (before !== '+' && before !== '-' && after !== '+' && after !== '-') return null;
  }

  const normalized = trimmed.toLowerCase().replace(/\s+/g, '');
  if (normalized.length > 128) return null;

  const state = createEmptyDiceBuilderState();
  let index = 0;
  let totalDice = 0;
  let hasDice = false;
  let modifierSeen = false;
  let advantageGroupSeen = false;

  while (index < normalized.length) {
    let sign = 1;
    if (normalized[index] === '+' || normalized[index] === '-') {
      sign = normalized[index] === '-' ? -1 : 1;
      index += 1;
    } else if (index > 0) {
      return null;
    }
    if (index >= normalized.length || normalized[index] === '+' || normalized[index] === '-') return null;

    const remaining = normalized.slice(index);
    const diceMatch = DICE_TOKEN.exec(remaining);

    if (diceMatch) {
      if (sign < 0 || modifierSeen) return null;

      const count = diceMatch[1] ? Number(diceMatch[1]) : 1;
      if (!Number.isSafeInteger(count) || count < 1) return null;

      const rawType = diceMatch[2].toLowerCase();
      const dieType: DieType = rawType === 'f' || rawType === 'fate'
        ? 'dfate'
        : ('d' + rawType) as DieType;
      const keepType = diceMatch[3];
      const keepCount = diceMatch[4] ? Number(diceMatch[4]) : 1;

      if (keepType) {
        // The builder only models the standard two-d20 advantage/disadvantage pair.
        if (
          dieType !== 'd20' ||
          count !== 2 ||
          keepCount !== 1 ||
          state.stagedDice.d20 !== 0 ||
          advantageGroupSeen
        ) return null;
        state.advantage = keepType === 'kh' ? 'advantage' : 'disadvantage';
        advantageGroupSeen = true;
      } else {
        if (dieType === 'd20' && advantageGroupSeen) return null;
        state.stagedDice[dieType] += count;
      }

      if (keepType) state.stagedDice.d20 = 2;
      totalDice += count;
      if (totalDice > 100) return null;
      hasDice = true;
      index += diceMatch[0].length;
      continue;
    }

    const numberMatch = /^\d+/.exec(remaining);
    if (!numberMatch || modifierSeen || !hasDice) return null;
    const value = Number(numberMatch[0]);
    if (!Number.isSafeInteger(value)) return null;
    state.modifier = sign * value;
    modifierSeen = true;
    index += numberMatch[0].length;
  }

  return hasDice ? state : null;
}

/** Builds the canonical notation represented by the picker without changing its meaning. */
export function buildDiceFormulaFromBuilderState(state: DiceBuilderState): string {
  const parts: string[] = [];

  if (state.stagedDice.d20 > 0) {
    if (state.advantage !== 'none') {
      if (state.stagedDice.d20 !== 2) return '';
      parts.push(state.advantage === 'advantage' ? '2d20kh1' : '2d20kl1');
    } else {
      parts.push(`${state.stagedDice.d20}d20`);
    }
  } else if (state.advantage !== 'none') {
    return '';
  }

  for (const dieType of DIE_TYPES) {
    if (dieType === 'd20') continue;
    const count = state.stagedDice[dieType];
    if (!Number.isSafeInteger(count) || count < 0) return '';
    if (count > 0) {
      parts.push(dieType === 'dfate' ? `${count}dF` : `${count}${dieType}`);
    }
  }

  if (parts.length === 0) return '';
  const totalDice = DIE_TYPES.reduce((total, dieType) => total + state.stagedDice[dieType], 0);
  if (!Number.isSafeInteger(totalDice) || totalDice > 100) return '';

  let formula = parts.join('+');
  if (!Number.isSafeInteger(state.modifier)) return '';
  if (state.modifier > 0) formula += `+${state.modifier}`;
  if (state.modifier < 0) formula += `${state.modifier}`;
  return formula;
}
