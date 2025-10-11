import { defineConfig } from 'cypress';

export default defineConfig({
  video: false,
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    env: {
      apiUrl:
        process.env.CYPRESS_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      loginEmail: process.env.CYPRESS_LOGIN_EMAIL,
      loginPassword: process.env.CYPRESS_LOGIN_PASSWORD,
    },
  },
});
