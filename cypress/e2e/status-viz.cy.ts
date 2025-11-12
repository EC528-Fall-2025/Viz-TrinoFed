describe('Status Cards & Chips', () => {
    it('should display a "Running" chip for an in-progress query', () => {
      cy.intercept('/api/query/running', { fixture: 'running-query.json' });
      cy.visit('/query/running');
      cy.get('[data-testid="query-status-chip"]').should('contain', 'RUNNING')
        .and('have.class', 'status-running');
    });
  
    it('should display a "Failed" card for a failed query', () => {
      cy.intercept('/api/query/failed', { fixture: 'failed-query.json' });
      cy.visit('/query/failed');
      cy.get('[data-testid="query-status-card"]').should('contain', 'Query Failed')
        .and('have.class', 'status-error');
    });
  
    it('should display a "Success" card for a completed query', () => {
      cy.intercept('/api/query/success', { fixture: 'standard-query.json' });
      cy.visit('/query/success');
      cy.get('[data-testid="query-status-card"]').should('contain', 'Query Succeeded')
        .and('have.class', 'status-success');
    });
  });
  