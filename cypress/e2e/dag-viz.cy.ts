/// <reference types="cypress" />
/// <reference path="../support/commands.ts" />

describe('DAG Visualization', () => {
    beforeEach(() => {
      // Mock API call to return a standard, multi-node graph
    cy.intercept('GET', '**/api/databases', { body: [] }).as('getDatabases');
    cy.intercept('GET', '**/api/queries/123', { fixture: 'standard-query.json' }).as('getQuery');
      cy.visit('/query/123');
    cy.wait(['@getDatabases', '@getQuery']);
    });
  
    it('should render all fragments as nodes and dependencies as edges', () => {
      cy.get('.dag-node').should('have.length', 5);
      cy.get('.dag-edge').should('have.length', 4);
    });
  
    it('should highlight the correct node on click', () => {
      cy.get('[data-testid="node-fragment-3"]').click();
      cy.get('[data-testid="node-fragment-3"]').should('have.class', 'selected');
    });
  
    it('should open the side panel when a node is double-clicked', () => {
      cy.get('[data-testid="node-fragment-3"]').dblclick();
      cy.get('[data-testid="metrics-side-panel"]').should('be.visible');
    });
  
    it('should allow panning the graph by dragging the canvas', () => {
      // Simulate drag event
      cy.get('.dag-canvas').trigger('mousedown', { which: 1, pageX: 300, pageY: 300 })
        .trigger('mousemove', { which: 1, pageX: 400, pageY: 350 })
        .trigger('mouseup');
      // Assert that the graph's transform matrix has changed
      cy.get('.dag-transform-group').should('have.attr', 'transform'); 
    });
  
    it('should allow zooming with the mouse wheel', () => {
      cy.get('.dag-canvas').trigger('wheel', { deltaY: -100 }); // Zoom in
      // Assert transform matrix scale is > 1
    });
  
    // --- Edge Cases ---
    it('should render an empty state message when query data is empty', () => {
      cy.intercept('GET', '**/api/queries/404', {
        body: {
          queryId: '404',
          root: null,
          events: [],
        },
      }).as('getEmptyQuery');
    cy.visit('/query/404');
    cy.wait(['@getDatabases', '@getEmptyQuery']);
      cy.contains('This query has no fragments to display.');
    });
  
    it('should handle a single-node graph (no edges)', () => {
      cy.intercept('GET', '**/api/queries/1', { fixture: 'single-node.json' }).as('getSingleNode');
    cy.visit('/query/1');
    cy.wait(['@getDatabases', '@getSingleNode']);
      cy.get('.dag-node').should('have.length', 1);
      cy.get('.dag-edge').should('not.exist');
    });
  
    it('should handle a graph with a very large number of nodes (e.g., 500+)', () => {
      cy.intercept('GET', '**/api/queries/large', { fixture: 'large-graph.json' }).as('getLarge');
    cy.visit('/query/large');
    cy.wait(['@getDatabases', '@getLarge']);
      cy.get('.dag-node').should('have.length', 500);
      // Further performance assertions are in the SRE suite
    });
  
    it('should correctly display a failed fragment node (e.g., red border)', () => {
      cy.intercept('GET', '**/api/queries/failed', { fixture: 'failed-query.json' }).as('getFailed');
    cy.visit('/query/failed');
    cy.wait(['@getDatabases', '@getFailed']);
      cy.get('[data-testid="node-fragment-error"]').should('have.class', 'node-error');
    });
  });