import React from 'react'
import { QueryNode } from './Node'

describe('<QueryNode />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<QueryNode />)
  })
})