/// <reference types="cypress" />

Cypress.Commands.add('injectAxe', () => {
  cy.log('injectAxe stub');
});

Cypress.Commands.add('checkA11y', () => {
  cy.log('checkA11y stub');
});

Cypress.Commands.add(
  'tab',
  { prevSubject: 'element' },
  (subject, options?: { shift?: boolean }) => {
    const shift = options?.shift ?? false;
    const focusableSelectors = 'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
    cy.wrap(subject).then(($el) => {
      const focusable = Array.from(
        document.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex >= 0);

      const current = document.activeElement as HTMLElement | null;
      const currentIndex = current ? focusable.indexOf(current) : -1;
      let nextIndex = shift ? currentIndex - 1 : currentIndex + 1;

      if (focusable.length === 0) return;
      if (nextIndex >= focusable.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = focusable.length - 1;

      focusable[nextIndex].focus();
    });

    return cy.focused();
  }
);

Cypress.Commands.add(
  'lighthouse',
  (
    thresholds: Partial<Record<'performance' | 'accessibility' | 'best-practices' | 'seo' | string, number>>,
    config?: Record<string, unknown>
  ) => {
    cy.log('Lighthouse audit (stub)', JSON.stringify({ thresholds, config }));
  }
);

declare global {
  namespace Cypress {
    interface AxeCheckOptions {
      rules?: Record<string, { enabled: boolean }>;
    }

    interface Chainable<Subject = any> {
      injectAxe(): Chainable<Subject>;
      checkA11y(context?: any, options?: AxeCheckOptions): Chainable<Subject>;
      tab(options?: { shift?: boolean }): Chainable<JQuery<HTMLElement>>;
      lighthouse(
        thresholds: Partial<Record<'performance' | 'accessibility' | 'best-practices' | 'seo' | string, number>>,
        config?: Record<string, unknown>
      ): Chainable<Subject>;
    }
  }
}

export {};