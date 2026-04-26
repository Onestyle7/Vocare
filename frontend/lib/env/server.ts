import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const env = createEnv({
  emptyStringAsUndefined: true,
  server: {
    API_BASE_URL: z.string().url(),
    OAUTH_REDIRECT_URL_BASE: z.string().url(),
    OAUTH_GOOGLE_CLIENT_SECRET: z.string(),
    OAUTH_GOOGLE_CLIENT_ID: z.string(),
  },
  experimental__runtimeEnv: process.env,
});

export default env;
