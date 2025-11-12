/// <reference types="cypress" />
/// <reference path="../support/commands.ts" />

describe('Page Load Performance (Lighthouse)', () => {
    it('should pass Lighthouse performance audit for the main query page', () => {
      cy.visit('/query/123');
      cy.lighthouse({
        performance: 90,
        accessibility: 100,
        'best-practices': 95,
        seo: 90,
      });
    });
  
    it('should pass Lighthouse performance audit for the History page', () => {
      cy.visit('/history');
      cy.lighthouse({
        performance: 95, // Expect this to be faster
        accessibility: 100,
      });
    });
  });