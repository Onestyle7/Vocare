// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { privacy_policy } from '@/features/marketing/constants/privacy-policy';
import {
  termsOfServiceSections,
  withdrawalFormAnnex,
} from '@/features/marketing/constants/terms-of-service';
import { renderLegalPdf } from '@/features/marketing/pdf/renderLegalPdf';

describe('renderLegalPdf', () => {
  it('renders the terms of service with the withdrawal form annex as a PDF', async () => {
    const buffer = await renderLegalPdf({
      title: 'Regulamin',
      subtitle: 'Obowiązuje od',
      sections: termsOfServiceSections,
      annex: withdrawalFormAnnex,
    });

    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  }, 30_000);

  it('renders the privacy policy as a PDF', async () => {
    const buffer = await renderLegalPdf({
      title: privacy_policy.title,
      subtitle: privacy_policy.lastUpdated,
      sections: privacy_policy.sections,
    });

    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  }, 30_000);
});
