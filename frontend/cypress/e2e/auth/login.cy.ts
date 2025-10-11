describe('Authentication / Sign in', () => {
  const fallbackEmail = 'test.user@example.com';
  const fallbackPassword = 'Password123!';

  const credentials = {
    email: (Cypress.env('loginEmail') as string) || fallbackEmail,
    password: (Cypress.env('loginPassword') as string) || fallbackPassword,
  };

  beforeEach(() => {
    cy.intercept('POST', '**/api/Auth/login', (req) => {
      cy.fixture('auth/success-login').then((body) => {
        expect(req.body).to.include({ email: credentials.email });
        req.reply({
          statusCode: 200,
          body,
        });
      });
    }).as('loginRequest');
  });

  it('logs the user in with valid credentials', () => {
    cy.visit('/sign-in', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
      },
    });

    cy.get('[data-cy="auth-email"]').should('be.visible').type(credentials.email);
    cy.get('[data-cy="auth-password"]').should('be.visible').type(credentials.password, { log: false });
    cy.get('[data-cy="auth-submit"]').should('be.enabled').click();

    cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);

    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.eq('test-token-123');
    });

    cy.url().should('eq', `${Cypress.config().baseUrl}/`);
  });
});
