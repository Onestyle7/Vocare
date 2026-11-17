import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TextWithLinks } from '../components/LegalDocument';
import { privacy_policy } from '../constants/privacy-policy';

afterEach(cleanup);

describe('TextWithLinks', () => {
  it('links every https address and leaves the closing punctuation out of the link', () => {
    const { container } = render(
      <p>
        <TextWithLinks text="Polityki: https://www.tiktok.com/legal/page/eea/privacy-policy/pl oraz https://www.facebook.com/privacy/policy. Dalej tekst." />
      </p>
    );

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://www.tiktok.com/legal/page/eea/privacy-policy/pl',
      'https://www.facebook.com/privacy/policy',
    ]);
    expect(container.textContent).toBe(
      'Polityki: https://www.tiktok.com/legal/page/eea/privacy-policy/pl oraz https://www.facebook.com/privacy/policy. Dalej tekst.'
    );
  });

  it('leaves text without addresses unchanged', () => {
    render(<TextWithLinks text="Zgody zmienisz na stronie vocare.pl/preferences." />);

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Zgody zmienisz na stronie vocare.pl/preferences.')).toBeTruthy();
  });

  it("links TikTok's privacy notice in the privacy policy, as its joint controller terms require", () => {
    const points = privacy_policy.sections.flatMap((section) => section.points);
    const text = points.find(
      (point): point is string =>
        typeof point === 'string' && point.includes('tiktok.com/legal/page/eea/privacy-policy')
    );

    render(<TextWithLinks text={text ?? ''} />);

    expect(
      screen
        .getAllByRole('link')
        .some((link) => link.getAttribute('href')?.startsWith('https://www.tiktok.com/legal/'))
    ).toBe(true);
  });
});
