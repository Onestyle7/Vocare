describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('/sign-in');
  });

  it('should allow a user to log in', () => {
    cy.intercept('POST', '/login').as('login');
    cy.get('input[placeholder="joedoe@gmail.com.."]').type('user@example.com');
    cy.get('input[placeholder="Password"]').type('password');
    cy.get('button[type="submit"]').click();
    cy.wait('@login');
  });
});
