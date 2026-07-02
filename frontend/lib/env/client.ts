import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const env = createEnv({
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_PERSONAL_PRICE_ID: z.string(),
    NEXT_PUBLIC_GROWTH_PRICE_ID: z.string(),
    NEXT_PUBLIC_INDIVIDUAL_PRICE_ID: z.string(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PERSONAL_PRICE_ID: process.env.NEXT_PUBLIC_PERSONAL_PRICE_ID,
    NEXT_PUBLIC_GROWTH_PRICE_ID: process.env.NEXT_PUBLIC_GROWTH_PRICE_ID,
    NEXT_PUBLIC_INDIVIDUAL_PRICE_ID: process.env.NEXT_PUBLIC_INDIVIDUAL_PRICE_ID,
  },
  onValidationError: (issues) => {
    console.error('\n[ERROR LOGGER] Environment configuration error');
    const errorDetails = issues
      .map((issue) => `- ${issue.path?.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Application terminated due to configuration errors\n${errorDetails}\n\n`);
  },
});

export default env;
