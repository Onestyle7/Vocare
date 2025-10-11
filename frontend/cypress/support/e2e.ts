import './commands';

beforeEach(() => {
  cy.log('Starting test: ' + Cypress.currentTest.titlePath.join(' > '));
});
