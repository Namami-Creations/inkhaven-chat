// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

// Custom command to login via Supabase
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/register')
    cy.get('[data-cy="email-input"]').type(email)
    cy.get('[data-cy="password-input"]').type(password)
    cy.get('[data-cy="register-button"]').click()
  })
})

// Custom command to start anonymous chat
Cypress.Commands.add('startAnonymousChat', () => {
  cy.visit('/')
  cy.get('[data-cy="anonymous-start-button"]').click()
})

// Custom command to send a message
Cypress.Commands.add('sendMessage', (message: string) => {
  cy.get('[data-cy="message-input"]').type(message)
  cy.get('[data-cy="send-button"]').click()
})

// Custom command to wait for AI response
Cypress.Commands.add('waitForAIResponse', () => {
  cy.get('[data-cy="message"]').should('have.length.greaterThan', 1)
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      startAnonymousChat(): Chainable<void>
      sendMessage(message: string): Chainable<void>
      waitForAIResponse(): Chainable<void>
    }
  }
}
