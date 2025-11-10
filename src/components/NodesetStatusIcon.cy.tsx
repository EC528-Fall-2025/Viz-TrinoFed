import React from 'react'
import { setStatusIcon } from './Node'

describe('<setStatusIcon />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<setStatusIcon />)
  })
})