// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { reorderResumeItemByOffset, reorderResumeItems } from '../utils/reorderResumeItems';

const items = [{ id: 'first' }, { id: 'second' }, { id: 'third' }];

describe('reorderResumeItems', () => {
  it('moves an item down to the dropped position without mutating the input', () => {
    const result = reorderResumeItems(items, 'first', 'third');

    expect(result.map(({ id }) => id)).toEqual(['second', 'third', 'first']);
    expect(items.map(({ id }) => id)).toEqual(['first', 'second', 'third']);
  });

  it('moves an item up to the dropped position', () => {
    const result = reorderResumeItems(items, 'third', 'first');

    expect(result.map(({ id }) => id)).toEqual(['third', 'first', 'second']);
  });

  it('moves the complete item without rebuilding its data', () => {
    const detailedItems = [
      { id: 'first', name: 'Senior Developer', metadata: { current: true } },
      { id: 'second', name: 'Developer', metadata: { current: false } },
    ];

    const result = reorderResumeItems(detailedItems, 'second', 'first');

    expect(result[0]).toBe(detailedItems[1]);
    expect(result[1]).toBe(detailedItems[0]);
  });

  it('keeps the same reference when the move cannot change the order', () => {
    expect(reorderResumeItems(items, 'second', 'second')).toBe(items);
    expect(reorderResumeItems(items, 'missing', 'first')).toBe(items);
    expect(reorderResumeItems(items, 'first', 'missing')).toBe(items);
  });
});

describe('reorderResumeItemByOffset', () => {
  it('supports moving an item with the keyboard', () => {
    expect(reorderResumeItemByOffset(items, 'second', -1).map(({ id }) => id)).toEqual([
      'second',
      'first',
      'third',
    ]);
    expect(reorderResumeItemByOffset(items, 'second', 1).map(({ id }) => id)).toEqual([
      'first',
      'third',
      'second',
    ]);
  });

  it('does not move an item beyond the list boundaries', () => {
    expect(reorderResumeItemByOffset(items, 'first', -1)).toBe(items);
    expect(reorderResumeItemByOffset(items, 'third', 1)).toBe(items);
  });
});
