import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const env = createEnv({
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  client: {
    // Trailing slash stripped so consumers can safely concatenate paths
    // (`${NEXT_PUBLIC_APP_URL}/blog/...`) without producing a double slash.
    NEXT_PUBLIC_APP_URL: z
      .string()
      .url()
      .transform((url) => url.replace(/\/+$/, '')),
    NEXT_PUBLIC_PERSONAL_PRICE_ID: z.string(),
    NEXT_PUBLIC_GROWTH_PRICE_ID: z.string(),
    // Opcjonalne – bez niego pricing nie pokazuje przełącznika na plan kwartalny
    NEXT_PUBLIC_GROWTH_QUARTERLY_PRICE_ID: z.string().optional(),
    NEXT_PUBLIC_INDIVIDUAL_PRICE_ID: z.string(),
    NEXT_PUBLIC_GA_ID: z.string(),
    // Opcjonalne – bez niego TikTok Pixel nie jest ładowany
    NEXT_PUBLIC_TIKTOK_PIXEL_ID: z.string().optional(),
    // Opcjonalne – bez niego Meta Pixel nie jest ładowany
    NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PERSONAL_PRICE_ID: process.env.NEXT_PUBLIC_PERSONAL_PRICE_ID,
    NEXT_PUBLIC_GROWTH_PRICE_ID: process.env.NEXT_PUBLIC_GROWTH_PRICE_ID,
    NEXT_PUBLIC_GROWTH_QUARTERLY_PRICE_ID: process.env.NEXT_PUBLIC_GROWTH_QUARTERLY_PRICE_ID,
    NEXT_PUBLIC_INDIVIDUAL_PRICE_ID: process.env.NEXT_PUBLIC_INDIVIDUAL_PRICE_ID,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_TIKTOK_PIXEL_ID: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
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
