describe('Inkhaven Chat E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('loads the homepage', () => {
    cy.contains('Inkhaven Chat').should('be.visible')
    cy.contains('🐾').should('be.visible')
  })

  it('can start anonymous chat', () => {
    cy.startAnonymousChat()
    cy.url().should('include', '/chat')
  })

  it('has working theme selector', () => {
    cy.get('[data-cy="theme-selector"]').should('be.visible')
    cy.get('[data-cy="theme-selector"]').click()
    cy.get('[data-cy="theme-option"]').first().click()
  })

  it('can navigate to help page', () => {
    cy.contains('Help').click()
    cy.url().should('include', '/help')
  })

  it('can navigate to privacy page', () => {
    cy.contains('Privacy').click()
    cy.url().should('include', '/privacy')
  })

  it('can navigate to terms page', () => {
    cy.contains('Terms').click()
    cy.url().should('include', '/terms')
  })
})
