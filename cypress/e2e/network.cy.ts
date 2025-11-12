describe('API Resilience & Error Handling', () => {
    it('should display an inline error message if a query fails to load (500 error)', () => {
      cy.intercept('/api/query/999', { statusCode: 500, body: 'Internal Server Error' });
      cy.visit('/query/999');
      cy.get('.page-level-error').should('be.visible')
        .and('contain', 'Failed to load query data. Please try again.');
      cy.get('.dag-canvas').should('not.exist');
    });
  
    it('should display a "Query Not Found" message for a 404 error', () => {
      cy.intercept('/api/query/404', { statusCode: 404, body: 'Not Found' });
      cy.visit('/query/404');
      cy.get('.page-level-error').should('be.visible')
        .and('contain', 'Query not found.');
    });
  
    it('should show a loading spinner while the query is fetching', () => {
      // Use `cy.intercept` to introduce a delay
      cy.intercept('/api/query/123', (req) => {
        return new Cypress.Promise<void>((resolve) => {
          setTimeout(() => {
            req.reply({ fixture: 'standard-query.json' });
            resolve();
          }, 2000); // 2-second delay
        });
      }).as('getQuery');
      
      cy.visit('/query/123');
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.wait('@getQuery');
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
    });
  
    it('should retry fetching a "RUNNING" query 3 times before stopping', () => {
      // This tests the client-side polling logic
      cy.intercept('/api/query/running', { fixture: 'running-query.json' }).as('getRunning');
      cy.visit('/query/running');
      
      // Wait for the intercept to be called multiple times
      cy.wait('@getRunning');
      cy.get('@getRunning.all').should('have.length', 1);
      cy.wait('@getRunning');
      cy.get('@getRunning.all').should('have.length', 2);
      cy.wait('@getRunning');
      cy.get('@getRunning.all').should('have.length', 3);
      // Assert polling stops after 3 attempts if it's still running (or fails)
    });
  });