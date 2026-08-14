// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { DatePickerWithCurrent } from '../components/DatePickerWithCurrent';

describe('DatePickerWithCurrent responsive trigger', () => {
  it('keeps long placeholder text inside the trigger', () => {
    const markup = renderToStaticMarkup(
      <DatePickerWithCurrent
        value=""
        onChange={vi.fn()}
        isCurrent={false}
        onCurrentChange={vi.fn()}
        placeholder="Wybierz datę rozpoczęcia"
      />
    );

    expect(markup).toContain('min-w-0');
    expect(markup).toContain('overflow-hidden');
    expect(markup).toContain('truncate');
    expect(markup).toContain('title="Wybierz datę rozpoczęcia"');
  });
});
