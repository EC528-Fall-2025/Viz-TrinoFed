import React from 'react'
import { QueryRFNode } from './Node'

describe('<QueryRFNode />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<QueryRFNode />)
  })
})