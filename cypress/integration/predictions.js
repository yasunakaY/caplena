
describe('Predictions (Stubbed)', function () {
  it('correctly modifies answers based on predictions', function () {
    const ManualWebSocket = require('manual-web-socket')

    cy.server()

    /** ******** Route Setup ************/
    cy.route('POST', '/api/csrftest/', 'ok').as('postCSRFTest')
    cy.route('GET', '/api/auth/user', 'fixture:auth_user').as('getUser')
    cy.route('PATCH', '/api/auth/user', '{}').as('patchUser')
    cy.route('/api/translate-languages/', 'fixture:translate_languages').as('getTranslateLanguages')
    cy.route('/api/questions/1234567', 'fixture:question_sorting').as('getQuestion')
    cy.route('/api/questions/1234567/answers', 'fixture:answers_sorting').as('getAnswers')
    cy.route('PATCH', '/api/questions/1234567/answers', '').as('patchAnswers')
    cy.route('POST', '/api/questions/1234567/request-training', '').as('request-training')

    // The codes-predicted route is set to return status 204 first, meaning no update should happen in frontend
    cy.fixture('codes-predicted').as('fxCodesPredicted')
    cy.route('/api/surveys/1234567/codes-predicted', routeData => {
      return this.fxCodesPredicted
    }, { status: 204 }).as('getCodesPredicted')


    /** ******** Page Initialization ************/

    let predictions
    cy.fixture('predictions_sorting.json').then(preds => { predictions = preds })

    let loadOptions = {
      onBeforeLoad (win) {
        var script = win.document.createElement('script')
        script.crossorigin = 'use-credentials'
        script.innerText = ManualWebSocket.getScript()
        win.document.head.appendChild(script)

        const mws = win.mws
        let wsURI = 'ws://localhost:8080/ws/question-worker/1234567/'
        mws.track([wsURI])
        mws.trackedConnections.when(wsURI).then(conn => {

          conn.readyState = mws.readyState.OPEN
          // setTimeout(() => { conn.reciveMessage({ data: JSON.stringify({'user_err': 'multiple_tabs'})}) }, 1500)
          //
          setTimeout(() => {
            conn.reciveMessage({ data: JSON.stringify({ predictions })})
            console.log('sent')
          }, 2000)
        })
      }
    }

    // Open the actual page
    cy.visit('/app/coding/1234567', loadOptions)

    cy.contains('Ans 103').click()

    cy.wait(10000)

    // set idxFocused to 21, to test if that answer won't be updated
    /* cy.get('#jumpTo').type(21)
    cy.get('#jumpToForm').submit() */

    // Access to the vuex store
    const getStore = () => cy.window().its('app.$store')
    // The key displayID is added to the answers in the frontend, remove it for comparison
    const removeDisplayID = list => list.map(answer => Cypress._.omit(answer, 'displayID'))


    /*
    cy.reload(false, loadOptions)

    cy.contains('Ans 103').parents('li').should('have.class', 'focused')
    */

    /** ******** Predicted Checks ************/
    // Wait for first prediction call
    /* cy.wait('@getCodesPredicted').then(() => {
      // Overwrite rule, making sure some predictions (with code 200) are served the next time
      cy.route('/api/surveys/1234567/codes-predicted', routeData => {
        return this.fxCodesPredicted
      }, { status: 200 }).as('getCodesPredicted')

      // Give the frontend a little time to parse response (i.e. correctly do nothing)
      cy.wait(500)
      // Get the fixture of the initial state, comparing to store and making sure that actually nothing changed
      cy.fixture('survey_answers_demodata_de').then(answersInput => {
        getStore().its('state.coding.answers').then(removeDisplayID).should('deep.equal', answersInput)
      })
    })

    // Second call to codes predicted
    cy.wait('@getCodesPredicted').then(() => {
      // Give some time for answer processing
      cy.wait(500)

      // Load the manually created "correct predictions"
      // Things that are checked
      // * idxFocused answer codes are not written
      // * reviewed codes are not written
      // * codes below MIN_PREDICTION_ACCURACY threshold are not written
      // * invalid codes are not written
      cy.fixture('survey_answers_demodata_codes-predicted_de').then(answersUpdated => {
        getStore().its(`state.coding.answers`).then(removeDisplayID).each((ansGot, i) => {
          expect(ansGot).to.deep.equal(answersUpdated[i])
        })
      })
    }) */
  })
})
