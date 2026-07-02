import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const env = createEnv({
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  server: {
    API_BASE_URL: z.string().url(),
    OAUTH_REDIRECT_URL_BASE: z.string().url(),
    OAUTH_GOOGLE_CLIENT_SECRET: z.string(),
    OAUTH_GOOGLE_CLIENT_ID: z.string(),
  },
  experimental__runtimeEnv: process.env,
  onValidationError: (issues) => {
    console.error('\nEnvironment configuration error:');
    const errorDetails = issues
      .map((issue) => `- ${issue.path?.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Application terminated due to configuration errors\n${errorDetails}\n\n`);
  },
});

export default env;
