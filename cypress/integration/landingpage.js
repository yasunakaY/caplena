describe('My First Test', function () {
  it('clicks the link "type"', function () {
    cy.server()
    cy.visit('https://codit-dev.caplena.com')

    cy.route('POST', '/api/auth/registration/').as('createAccount')
    cy.contains('Registrieren').click()
    cy.get('#register input[name=Name]').type('Tester')
    cy.get('#register input[name=email]').type('tester@codit.co')
    cy.get('#register input[name=password]').type('somesecurepassword')
    cy.get('#register input[name=password-repeat]').type('somesecurepassword')
    cy.get('#register textarea[name=message]').type('i\'m bot')
    cy.get('#register button').click()
    cy.wait('@createAccount')
    cy.get('#successModal').should('be', 'visible')
  })
})
