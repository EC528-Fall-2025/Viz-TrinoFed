describe('Navigation and Static Pages', () => {
    it('should navigate to the History page and display a list of past queries', () => {
      cy.intercept('/api/history', { fixture: 'history.json' });
      cy.visit('/');
      cy.get('nav [data-testid="history-link"]').click();
      cy.url().should('include', '/history');
      cy.get('.history-list-item').should('have.length.greaterThan', 5);
    });
  
    it('should navigate from History to a specific query detail page', () => {
      cy.get('.history-list-item[data-query-id="123"]').click();
      cy.url().should('include', '/query/123');
      cy.get('.dag-node').should('exist');
    });
  
    it('should render the Documentation page from markdown (or HTML)', () => {
      cy.visit('/');
      cy.get('nav [data-testid="docs-link"]').click();
      cy.url().should('include', '/docs');
      cy.get('h1').should('contain', 'Documentation');
      cy.get('code').should('exist');
    });
  });