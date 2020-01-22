export default {
  methods: {
    /**
     * Sets additional properties on each object inside the projects list, based on other object properties
     * @return {[type]} [description]
     */
    computeProjectProperties (projectsKey) {
      let questionIDToQestion = {}

      // Set up mapping of question id to question
      _.get(this, projectsKey).forEach(p => p.questions.forEach(q => {
        questionIDToQestion[q.id] = q
        q.inherits_to_objs = []
      }))

      _.get(this, projectsKey).forEach(p => {
        // Prepare the inheritance properties
        p.inherits_from = p.inherits_to_and_from = p.inherits_final_leaf = false

        // Compute the status per question and for the entire project
        let allCompleted = true
        let allNew = true
        p.questions.forEach(q => {
          // Status isn't an API property, to make it reactive we have to use set here
          this.$set(q, 'status', (q.completed ? 2 : q.nreviewed > 0 ? 1 : 0))
          allCompleted = allCompleted && q.status === 2
          allNew = allNew && q.status === 0

          // Map back to the project, should we ever need that
          q.project_obj = p
          q.inherits_from_obj = null
          q.inherits_final_leaf = false

          // Build up the inherits_to chain
          if (q.inherits_from !== null) {
            q.inherits_from_obj = questionIDToQestion[q.inherits_from]
            // If the question inherits from a question that doesn't belong to the user
            // Create a custom inheritance object
            if (q.inherits_from_obj === undefined) {
              q.inherits_from_obj = {
                name: 'Unknown',
                id: q.inherits_from,
                inherits_from: null,
                inherits_to_objs: [],
                project_obj: { name: 'From other user' }
              }
            }
            q.inherits_from_obj.inherits_to_objs.push(q)
          }
        })

        // All the following properties are not given by the API
        // use $set to make them reactive
        this.$set(p, 'status', (allCompleted ? 2 : (allNew ? 0 : 1)))

        // Do some counting on the question objects
        this.$set(p, 'nanswers', p.questions.length ? p.questions[0].nanswers : 0)
        this.$set(p, 'nquestions', p.questions.length)
        this.$set(p, 'nreviewed', _.sumBy(p.questions, 'nreviewed'))
      })

      // Finally, loop through all questions again and set the inheritance properties on project level
      _.values(questionIDToQestion).forEach(q => {
        // If the question inherits to _and from
        if (q.inherits_to_objs.length && q.inherits_from_obj) q.project_obj.inherits_to_and_from = true
        // If the question only inherits to anywhere
        else if (q.inherits_to_objs.length) q.project_obj.inherits_to = true
        // If the question contains final leaves (no outgoing nodes)
        else if (q.inherits_from_obj) {
          q.inherits_final_leaf = true
          q.project_obj.inherits_final_leaf = true
        }
      })
    }
  }
}
