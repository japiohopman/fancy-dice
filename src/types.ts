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
  }[];
  modifier: number;
  total: number;
  isCrit: boolean;
  isFumble: boolean;
  timestamp: Date;
}

export interface DicePreset {
  id: string;
  name: string;
  category: 'D&D 5e' | 'Pathfinder' | 'Fate' | 'CoC' | 'Custom';
  formula: string;
  description?: string;
  iconName?: string;
}

export interface RollHistoryEntry {
  id: string;
  result: RollParsedResult;
  presetName?: string;
}

export interface ShakeSettings {
  enabled: boolean;
  sensitivity: number; // 1 (low force) to 10 (gentle shake)
  vibrationEnabled: boolean;
  soundEnabled: boolean;
}
