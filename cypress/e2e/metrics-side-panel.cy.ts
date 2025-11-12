describe('Metrics Side Panel', () => {
    beforeEach(() => {
      cy.intercept('/api/query/123', { fixture: 'standard-query.json' });
      cy.visit('/query/123');
      cy.get('[data-testid="node-fragment-3"]').dblclick(); // Open panel
    });
  
    it('should display the correct fragment ID and summary metrics', () => {
      cy.get('[data-testid="metrics-side-panel"] [data-testid="fragment-id"]').should('contain', 'fragment-3');
      cy.get('[data-testid="metrics-side-panel"] [data-testid="metric-cpu-time"]').should('contain', '1.25s');
    });
  
    it('should expand a collapsible metric section on click', () => {
      cy.get('[data-testid="metric-group-memory"]').click();
      cy.get('[data-testid="metric-peak-memory"]').should('be.visible')
        .and('contain', '2.5GB');
    });
  
    it('should close the panel when the "X" button is clicked', () => {
      cy.get('[data-testid="metrics-side-panel"] [data-testid="close-button"]').click();
      cy.get('[data-testid="metrics-side-panel"]').should('not.be.visible');
    });
  
    // --- Edge Cases ---
    it('should display "N/A" for missing or null metric values', () => {
      // Load a fixture where some metrics are null
      cy.intercept('/api/query/null-metrics', { fixture: 'null-metrics.json' });
      cy.visit('/query/null-metrics');
      cy.get('[data-testid="node-fragment-1"]').dblclick();
      cy.get('[data-testid="metric-input-rows"]').should('contain', 'N/A');
    });
  
    it('should correctly format very large or very small numbers (e.g., bytes vs. GB)', () => {
      // Fixture with large numbers
      cy.get('[data-testid="metric-output-bytes"]').should('contain', '10.5 GB');
      // Fixture with small numbers
      cy.get('[data-testid="metric-cpu-time"]').should('contain', '5ms');
    });
  });