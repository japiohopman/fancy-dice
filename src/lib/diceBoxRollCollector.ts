import type { DiceBoxDieCompleteResult, DiceBoxPhysicalDieResult } from '../types';

/** Collects one result per physical die, ignoring duplicate callbacks for composite dice. */
export class DiceBoxRollCollector {
  private readonly results = new Map<string, DiceBoxPhysicalDieResult>();

  constructor(private readonly expectedCount: number) {
    if (!Number.isSafeInteger(expectedCount) || expectedCount < 1) {
      throw new Error('A DiceBox collection must contain at least one physical die.');
    }
  }

  /** Returns the complete normalized batch once every unique die ID has landed. */
  add(rawResult: unknown): DiceBoxPhysicalDieResult[] | null {
    if (!isDiceBoxDieCompleteResult(rawResult)) {
      throw new Error('DiceBox returned an invalid die completion event. Please try the roll again.');
    }

    const rollId = String(rawResult.rollId);
    if (this.results.has(rollId)) return null;

    if (this.results.size >= this.expectedCount) {
      throw new Error('DiceBox returned more unique dice than requested. Please try again.');
    }

    const { rollId: _rollId, ...physicalResult } = rawResult;
    this.results.set(rollId, physicalResult);

    return this.results.size === this.expectedCount
      ? Array.from(this.results.values())
      : null;
  }
}

/** DiceBox receives simple notation strings, so their leading counts define the batch size. */
export function getExpectedPhysicalDiceCount(notations: string[]): number {
  return notations.reduce((total, notation) => {
    const match = /^(\d+)d(?:4|6|8|10|12|20|100)$/i.exec(notation);
    if (!match) {
      throw new Error('DiceBox received unsupported notation while starting a physical roll.');
    }

    const count = Number(match[1]);
    if (!Number.isSafeInteger(count) || count < 1) {
      throw new Error('DiceBox notation must request at least one physical die.');
    }
    return total + count;
  }, 0);
}

function isDiceBoxDieCompleteResult(value: unknown): value is DiceBoxDieCompleteResult {
  if (typeof value !== 'object' || value === null) return false;
  const die = value as Record<string, unknown>;
  const hasRollId = typeof die.rollId === 'string'
    ? die.rollId.length > 0
    : typeof die.rollId === 'number' && Number.isSafeInteger(die.rollId);
  const hasDieType = typeof die.dieType === 'string' && die.dieType.trim().length > 0;
  const hasSides = typeof die.sides === 'number' || typeof die.sides === 'string';

  return hasRollId && typeof die.value === 'number' && Number.isFinite(die.value) && (hasDieType || hasSides);
}
