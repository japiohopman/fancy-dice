import assert from 'node:assert/strict';
import test from 'node:test';
import { DiceFormulaError, getPendingExplosionRolls, parseAndRollFormula, updateParsedResultWithPhysicalRolls } from '../src/lib/diceParser';
import { DiceBoxRollCollector, getExpectedPhysicalDiceCount } from '../src/lib/diceBoxRollCollector';

function withRandomSequence<T>(values: number[], run: () => T): T {
  const originalRandom = Math.random;
  let index = 0;
  Math.random = () => values[Math.min(index++, values.length - 1)] ?? 0;

  try {
    return run();
  } finally {
    Math.random = originalRandom;
  }
}

test('parses a normalized d20 formula with a positive modifier', () => {
  const result = withRandomSequence([0.95, 0], () => parseAndRollFormula(' 1D20 + 5 '));

  assert.equal(result.rawFormula, '1d20+5');
  assert.equal(result.diceGroupResults.length, 1);
  assert.equal(result.diceGroupResults[0].rolls[0].value, 20);
  assert.equal(result.modifier, 5);
  assert.equal(result.total, 25);
  assert.equal(result.isCrit, true);
});

test('parses multiple dice groups and a negative numeric modifier', () => {
  const result = withRandomSequence(
    [0, 0.1, 0.5, 0.1, 0.99, 0.1],
    () => parseAndRollFormula('2d6 + 1d4 - 3')
  );

  assert.deepEqual(
    result.diceGroupResults.map((group) => group.rolls.map((roll) => roll.value)),
    [[1, 4], [4]]
  );
  assert.equal(result.modifier, -3);
  assert.equal(result.total, 6);
});

test('supports signed dice groups', () => {
  const result = withRandomSequence([0.5, 0.1], () => parseAndRollFormula('-1d4-2'));

  assert.equal(result.diceGroupResults[0].sum, -3);
  assert.equal(result.modifier, -2);
  assert.equal(result.total, -5);
});

test('supports keep-high and drop-low operators', () => {
  const sequence = [0, 0.1, 0.5, 0.1, 0.99, 0.1, 0.2, 0.1];

  const keepHigh = withRandomSequence(sequence, () => parseAndRollFormula('4d6kh3'));
  const dropLow = withRandomSequence(sequence, () => parseAndRollFormula('4d6dl1'));

  assert.equal(keepHigh.total, 12);
  assert.equal(keepHigh.diceGroupResults[0].droppedCount, 1);
  assert.equal(keepHigh.diceGroupResults[0].rolls[0].dropped, true);
  assert.equal(dropLow.total, 12);
  assert.equal(dropLow.diceGroupResults[0].droppedCount, 1);
});

test('supports keep-low and drop-high operators', () => {
  const sequence = [0, 0.1, 0.5, 0.1, 0.99, 0.1, 0.2, 0.1];

  const keepLow = withRandomSequence(sequence, () => parseAndRollFormula('4d6kl2'));
  const dropHigh = withRandomSequence(sequence, () => parseAndRollFormula('4d6dh2'));

  assert.equal(keepLow.total, 3);
  assert.equal(keepLow.diceGroupResults[0].droppedCount, 2);
  assert.equal(dropHigh.total, 3);
  assert.equal(dropHigh.diceGroupResults[0].droppedCount, 2);
});

test('chains exploding dice from physical landed results only', () => {
  const parsed = withRandomSequence([0, 0], () => parseAndRollFormula('1d6!2'));
  assert.equal(parsed.diceGroupResults[0].rolls.length, 1);
  assert.equal(parsed.diceGroupResults[0].explosionLimit, 2);

  const firstWave = updateParsedResultWithPhysicalRolls(parsed, [
    { dieType: 'd6', sides: 6, value: 6 },
  ]);
  assert.deepEqual(getPendingExplosionRolls(firstWave), ['1d6']);
  assert.equal(firstWave.total, 6);

  const secondWave = updateParsedResultWithPhysicalRolls(firstWave, [
    { dieType: 'd6', sides: 6, value: 6 },
  ]);
  assert.deepEqual(getPendingExplosionRolls(secondWave), ['1d6']);
  assert.equal(secondWave.total, 12);

  const finalWave = updateParsedResultWithPhysicalRolls(secondWave, [
    { dieType: 'd6', sides: 6, value: 2 },
  ]);
  assert.deepEqual(getPendingExplosionRolls(finalWave), []);
  assert.equal(finalWave.total, 14);
  assert.deepEqual(finalWave.diceGroupResults[0].rolls.map((roll) => roll.value), [6, 6, 2]);
  assert.equal(finalWave.diceGroupResults[0].rolls[1].exploded, true);
});

test('does not keep a simulated explosion when the physical die did not explode', () => {
  const parsed = withRandomSequence([0, 0], () => parseAndRollFormula('1d6!2'));
  const finalResult = updateParsedResultWithPhysicalRolls(parsed, [
    { dieType: 'd6', sides: 6, value: 3 },
  ]);

  assert.deepEqual(getPendingExplosionRolls(finalResult), []);
  assert.equal(finalResult.total, 3);
  assert.equal(finalResult.diceGroupResults[0].rolls.length, 1);
});

test('an exploding d20 records a natural 1 on its follow-up physical roll', () => {
  const parsed = withRandomSequence([0, 0], () => parseAndRollFormula('1d20!1'));
  const firstWave = updateParsedResultWithPhysicalRolls(parsed, [
    { dieType: 'd20', sides: 20, value: 20 },
  ]);
  const finalWave = updateParsedResultWithPhysicalRolls(firstWave, [
    { dieType: 'd20', sides: 20, value: 1 },
  ]);

  assert.equal(finalWave.total, 21);
  assert.equal(finalWave.isCrit, true);
  assert.equal(finalWave.isFumble, true);
  assert.equal(finalWave.diceGroupResults[0].rolls[1].isFumble, true);
});

test('maps physical d6 face values to Fate dice results', () => {
  const parsed = withRandomSequence([0, 0, 0, 0, 0, 0], () => parseAndRollFormula('3dFate'));
  const result = updateParsedResultWithPhysicalRolls(parsed, [
    { dieType: 'd6', sides: 6, value: 1 },
    { dieType: 'd6', sides: 6, value: 4 },
    { dieType: 'd6', sides: 6, value: 6 },
  ]);

  assert.deepEqual(result.diceGroupResults[0].rolls.map((roll) => roll.value), [-1, 0, 1]);
  assert.deepEqual(result.diceGroupResults[0].rolls.map((roll) => roll.text), ['-', '0', '+']);
  assert.equal(result.total, 0);
});

test('rejects empty and modifier-only formulas', () => {
  for (const formula of ['', '   ', '+5', '5', '-3']) {
    assert.throws(
      () => parseAndRollFormula(formula),
      (error: unknown) => error instanceof DiceFormulaError
    );
  }
});

test('rejects partial matches, malformed operators and unsupported dice', () => {
  const invalidFormulas = [
    '1d20abc',
    'abc1d20',
    '1d20+',
    '1d20++5',
    '1d20--5',
    '1d20+-5',
    '1d20 1d6',
    '1d2 0',
    '1 d20',
    '1d20 + 1 d6',
    '1d2',
    '1d20khx',
    '1d20!6',
    '2dd20',
  ];

  for (const formula of invalidFormulas) {
    assert.throws(
      () => parseAndRollFormula(formula),
      (error: unknown) => error instanceof DiceFormulaError,
      formula
    );
  }
});

test('rejects zero dice counts and invalid keep/drop ranges', () => {
  const invalidFormulas = [
    '0d20',
    '2d6kh0',
    '2d6kh3',
    '2d6kl3',
    '2d6dh2',
    '2d6dl2',
  ];

  for (const formula of invalidFormulas) {
    assert.throws(
      () => parseAndRollFormula(formula),
      (error: unknown) => error instanceof DiceFormulaError,
      formula
    );
  }
});

test('rejects negative and excessive numeric counts where a count is expected', () => {
  assert.throws(() => parseAndRollFormula('-0d6'), DiceFormulaError);
  assert.throws(() => parseAndRollFormula('101d6'), DiceFormulaError);
  assert.throws(() => parseAndRollFormula('50d6!5'), DiceFormulaError);
});

test('rejects exploding Fate dice and formulas with unsafe modifiers or totals', () => {
  assert.throws(() => parseAndRollFormula('1dF!'), DiceFormulaError);
  assert.throws(
    () => parseAndRollFormula('1d20+999999999999999999999999999999999'),
    DiceFormulaError
  );
  assert.throws(
    () => withRandomSequence([0, 0.1], () => parseAndRollFormula('1d20+9007199254740991')),
    DiceFormulaError
  );
});


test('counts physical dice in DiceBox notation batches', () => {
  assert.equal(getExpectedPhysicalDiceCount(['1d100', '1d6']), 2);
  assert.equal(getExpectedPhysicalDiceCount(['4d6', '1d20']), 5);
  assert.throws(() => getExpectedPhysicalDiceCount(['invalid']), /unsupported notation/);

  const parsed = withRandomSequence([0], () => parseAndRollFormula('1d20'));
  assert.throws(
    () => updateParsedResultWithPhysicalRolls(parsed, []),
    /incomplete physical roll/
  );
});

test('deduplicates percentile die completion events by stable roll ID', () => {
  const collector = new DiceBoxRollCollector(2);

  assert.equal(collector.add({ rollId: 12, dieType: 'd100', sides: 100, value: 47 }), null);
  // DiceBox 1.1.4 can report the same percentile die when either paired body sleeps.
  assert.equal(collector.add({ rollId: 12, dieType: 'd100', sides: 100, value: 47 }), null);

  const results = collector.add({ rollId: 13, dieType: 'd6', sides: 6, value: 4 });
  assert.deepEqual(results, [
    { dieType: 'd100', sides: 100, value: 47 },
    { dieType: 'd6', sides: 6, value: 4 },
  ]);
  assert.equal(collector.add({ rollId: 12, dieType: 'd100', sides: 100, value: 47 }), null);
});

test('rejects invalid physical die faces instead of recording a successful result', () => {
  const parsed = withRandomSequence([0], () => parseAndRollFormula('1d6'));
  assert.throws(
    () => updateParsedResultWithPhysicalRolls(parsed, [
      { dieType: 'd6', sides: 20, value: 7 },
    ]),
    /invalid physical die value/
  );
  assert.throws(
    () => updateParsedResultWithPhysicalRolls(parsed, [
      { dieType: 'd6', sides: 6, value: 0 },
    ]),
    /invalid physical die value/
  );
});


test('waits for late physical dice after the world-complete callback', () => {
  const collector = new DiceBoxRollCollector(3);

  // The non-WebGL renderer can announce world completion before all die timers fire.
  assert.equal(collector.markWorldComplete(), null);
  assert.equal(collector.isWorldComplete, true);
  assert.equal(collector.add({ rollId: 21, dieType: 'd6', sides: 6, value: 2 }), null);
  assert.equal(collector.add({ rollId: 22, dieType: 'd6', sides: 6, value: 4 }), null);

  const finalResults = collector.add({ rollId: 23, dieType: 'd20', sides: 20, value: 17 });
  assert.deepEqual(finalResults, [
    { dieType: 'd6', sides: 6, value: 2 },
    { dieType: 'd6', sides: 6, value: 4 },
    { dieType: 'd20', sides: 20, value: 17 },
  ]);
  assert.equal(collector.isWorldComplete, true);
});

test('waits for world completion when all physical dice arrive first', () => {
  const collector = new DiceBoxRollCollector(2);

  assert.equal(collector.add({ rollId: 31, dieType: 'd6', sides: 6, value: 3 }), null);
  const completedResults = collector.add({ rollId: 32, dieType: 'd8', sides: 8, value: 7 });
  assert.deepEqual(completedResults, [
    { dieType: 'd6', sides: 6, value: 3 },
    { dieType: 'd8', sides: 8, value: 7 },
  ]);
  assert.equal(collector.isWorldComplete, false);

  assert.deepEqual(collector.markWorldComplete(), completedResults);
  assert.equal(collector.isWorldComplete, true);
});
