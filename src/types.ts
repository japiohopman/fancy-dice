export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100' | 'dfate';

export type MaterialTheme = 'obsidian' | 'emerald' | 'ruby' | 'gold' | 'cyber' | 'ivory' | 'galaxy';

export type TableTheme = 'green' | 'blue' | 'crimson' | 'dark' | 'leather';

export interface SingleDieResult {
  id: string;
  type: DieType;
  value: number; // For dfate: -1, 0, or 1. For d100: 1-100 (or tens digit).
  text: string;  // Visual representation e.g. "20", "+", "-", "NAT 20"
  dropped?: boolean;
  exploded?: boolean;
  isCrit?: boolean;
  isFumble?: boolean;
  /** True after this value has come back from a physical DiceBox roll. */
  physical?: boolean;
  /** True while waiting for a chained physical explosion roll. */
  pending?: boolean;
  /** Number of explosion links from the original die (base die = 0). */
  explosionDepth?: number;
}

export interface RollParsedResult {
  rawFormula: string;
  diceGroupResults: {
    count: number;
    dieType: DieType;
    rolls: SingleDieResult[];
    sum: number;
    droppedCount?: number;
    keepType?: 'kh' | 'kl';
    keepCount?: number;
    explosionLimit?: number;
    sign?: 1 | -1;
  }[];
  modifier: number;
  total: number;
  isCrit: boolean;
  isFumble: boolean;
  timestamp: Date;
}

export interface RollHistoryEntry {
  id: string;
  result: RollParsedResult;
  presetName?: string;
}

/** One physical die returned by DiceBox.roll() after its collection has settled. */
export interface DiceBoxPhysicalDieResult {
  dieType?: string;
  sides?: number | string;
  value: number;
}

/** Individual die completion event emitted by DiceBox, keyed by its stable roll ID. */
export interface DiceBoxDieCompleteResult extends DiceBoxPhysicalDieResult {
  rollId: number | string;
}

/** Normalized physical results from one completed roll collection. */
export type DiceBoxRollResults = DiceBoxPhysicalDieResult[];

/** Minimal runtime surface used from the DiceBox package. */
export interface DiceBoxInstance {
  onDieComplete: (result: DiceBoxDieCompleteResult) => void;
  onRollComplete: (results: unknown) => void;
  init(): Promise<unknown>;
  roll(notation: string | string[], options?: { themeColor?: string }): Promise<unknown>;
  clear(): void;
  updateConfig(options: { themeColor?: string; theme?: string }): Promise<unknown>;
}

export interface ShakeSettings {
  enabled: boolean;
  sensitivity: number; // 1 (low force) to 10 (gentle shake)
  vibrationEnabled: boolean;
  soundEnabled: boolean;
}
