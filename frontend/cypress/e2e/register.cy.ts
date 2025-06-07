describe('Register Page', () => {
  beforeEach(() => {
    cy.visit('/sign-up');
  });

  it('should allow a user to register', () => {
    cy.intercept('POST', '/api/register', {
      statusCode: 200,
      body: { success: true },
    }).as('register');

    cy.get('input[placeholder="Joe Doe.."]').type('Test User');
    cy.get('input[placeholder="joedoe@gmail.com.."]').type('newuser@example.com');
    cy.get('input[placeholder="Password"]').first().type('password');
    cy.get('input[placeholder="Confirm Password"]').type('password');
    cy.get('button[type="submit"]').click();

    cy.wait('@register');
    cy.location('pathname').should('include', '/sign-in');
  });
});
