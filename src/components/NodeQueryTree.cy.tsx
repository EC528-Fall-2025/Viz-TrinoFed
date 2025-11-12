import React from 'react'
import { QueryTree } from './Node'

describe('<QueryTree />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<QueryTree />)
  })
})