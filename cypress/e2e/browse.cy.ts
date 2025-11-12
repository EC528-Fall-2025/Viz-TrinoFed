/// <reference types="cypress" />
/// <reference path="../support/commands.ts" />

describe('Browsing Experience & Accessibility', () => {
    // Run this test on multiple viewports
  const viewports: Cypress.ViewportPreset[] = ['macbook-15', 'ipad-2', 'iphone-x'];

  viewports.forEach((viewport) => {
      it(`should be responsive and usable on ${viewport}`, () => {
        cy.viewport(viewport);
        cy.visit('/query/123');
        
        if (viewport === 'iphone-x') {
          // Example: Assert mobile-specific layout
          cy.get('[data-testid="metrics-side-panel"]').should('have.class', 'is-mobile-drawer');
          cy.get('[data-testid="open-panel-button"]').click();
          cy.get('[data-testid="metrics-side-panel"]').should('be.visible');
        } else {
          // Example: Assert desktop layout
          cy.get('[data-testid="metrics-side-panel"]').should('have.class', 'is-desktop-panel');
        }
      });
    });
  
    it('should meet WCAG 2.1 AA accessibility standards', () => {
      cy.visit('/query/123');
      cy.injectAxe(); // Inject axe-core library
      cy.checkA11y(null, {
        rules: {
          'color-contrast': { enabled: true }
          // Add other specific rule checks
        }
      });
    });
  
    it('should be navigable using only the keyboard', () => {
      cy.visit('/query/123');
      cy.get('body').tab();
      cy.get('[data-testid="history-link"]').should('have.focus');
      cy.tab();
      cy.get('[data-testid="docs-link"]').should('have.focus');
      cy.tab();
      // Continue tabbing through the entire application flow
      cy.get('[data-testid="node-fragment-1"]').should('have.focus');
      cy.focused().type('{enter}'); // Simulate keyboard "click"
      cy.get('[data-testid="metrics-side-panel"]').should('be.visible');
    });
  });