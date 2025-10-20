import { mount } from 'cypress/react18'
import EnhancedHomepage from '@/components/EnhancedHomepage'

describe('<EnhancedHomepage />', () => {
  it('mounts', () => {
    mount(<EnhancedHomepage />)
    cy.contains('Inkhaven Chat').should('be.visible')
  })

  it('shows features section', () => {
    mount(<EnhancedHomepage />)
    cy.contains('AI-Powered Platform').should('be.visible')
    cy.contains('Dynamic Theme System').should('be.visible')
  })

  it('has call-to-action buttons', () => {
    mount(<EnhancedHomepage />)
    cy.get('button').contains(/start chatting/i).should('be.visible')
    cy.get('button').contains(/register/i).should('be.visible')
  })
})
