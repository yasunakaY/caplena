let doHash = require('object-hash')

export default {
  data () {
    return {
      answersInput: {
        tab: 0,
        input: '',
        file: null,
        questionColumns: [null],
        encoding: 'Auto',
        hasHeader: 'auto'
      },
      answersRes: { columns: [], data: [], type: null, errorMsg: null, success: false, dropped: 0 },
      encodingOptions: ['Auto', 'UTF8', 'ISO-8859-1', 'Latin_1', 'Windows-1252'],
      headerOptions: [
        { value: 'auto', text: this.$t('header.auto') },
        { value: true, text: this.$t('header.yes') },
        { value: false, text: this.$t('header.no') }
      ],
      uploadIdenticalAnswers: false,
      validAnswersUpload: false
    }
  },

  computed: {
    answersInputType () { return ['file', 'input'][this.answersInput.tab] },

    nAnswerRows () {
      let nanswers = 0
      // If input type is text field, count the number of lines
      if (this.answersInputType === 'input') nanswers = this.answersInput.input.split(/\r\n|\r|\n/).length
      // Otherwise either return all rows, or subtract the identical ones (if in append mode and ignore identical is enabled)
      else nanswers = this.answersRes.data.length - (this.uploadIdenticalAnswers ? 0 : this.identicalRows.size)
      // Multiply by number of questions
      return nanswers * this.nQuestions
    },

    auxiliaryColumnNames () {
      return _.map(this.answersRes.columns, 'name').filter(v => this.answersInput.questionColumns.indexOf(v) === -1)
    },

    identicalRows () {
      // Get a list of identical rows
      let rows = new Set()

      if (this.rowsExistingHashes && this.answersInput.questionColumns.every(e => e !== null)) {
        this.answersRes.data.forEach((a, idx) => {
          // Make the row data to compare to existing hashes
          let aCompare = {
            answers: _.map(this.answersInput.questionColumns, c => a[c]),
            auxiliary_columns: _.map(this.auxiliaryColumnNames, c => a[c])
          }
          let hash = doHash(aCompare)
          if (this.rowsExistingHashes.has(hash)) rows.add(idx)
        })
      }
      return rows
    },

    nQuestions () { return this.answersInput.questionColumns.length }
  },

  methods: {
    _prepareInput (input) {
      // Function for preprocessing input text
      return _.map(input.split(/\r?\n/), v => { return { text: _.trim(v) } }).filter(v => v.text.length > 0)
    },

    hashProjectRows (rows) {
      rows.forEach(r => {
        this.rowsExistingHashes.add(doHash({ answers: _.map(r.answers, 'text'), auxiliary_columns: r.auxiliary_columns }))
      })
    },

    prepareRowsForSubmit (append = false) {
      // Bring answers into right format
      let rows = []

      if (this.answersInputType === 'input') {
        this.answersInput.questionColumns.splice(0, this.answersInput.questionColumns.length, 'text')
        this.answersRes.columns = [{ name: 'text' }]
        this.answersRes.data = this._prepareInput(this.answersInput.input)
      }

      // Filter the columns that will be uploaded (don't upload merged)
      let questionsToConsider = _.map(this.project.questions, (q, qIdx) => (
        { q, qIdx, questionColumn: this.answersInput.questionColumns[qIdx] }
      ))
      questionsToConsider = _.filter(questionsToConsider, qtc => !qtc.q._merge)

      // Map questions to themselves and their question column
      let qAndColMap = _.map(this.project.questions, (q, qIdx) => ({ q, questionColumn: this.answersInput.questionColumns[qIdx] }))
      // Create list of columns that will be merged with every column
      let mergeWith = _.map(this.project.questions, (q, qIdx) => {
        // Filter for those that map to this question
        return _.map(_.filter(qAndColMap, m => !!q._id && m.q._merge === q._id), f => f.questionColumn)
      })

      this.answersRes.data.forEach((dataRow, idx) => {
        // Don't add answer if it's a duplicate and we don't want those
        if (!this.uploadIdenticalAnswers && this.identicalRows.has(idx)) return

        let row = {}

        // Create a list of answers, each referecing it's specific answer by the answer name
        row.answers = _.map(questionsToConsider, ({ q, qIdx, questionColumn }) => ({
          // First create an array of this text column, and all text columns which are matched to this one
          // Then concatenate them together
          // If we only have one text column, this is the same as just taking that
          text:
            [String(dataRow[questionColumn])].concat(_.filter(
              mergeWith[qIdx].map(
                mappedCol => String(dataRow[mappedCol]))
              , v => v.length))
              .join(' || '),
          codes: [],
          reviewed: false,
          changed: false,
          // When the project doesn't exist yet, we set the question by giving it's name
          // if it does exist, reference it by id
          question: (append ? q.id : q.name)
        }))

        row.auxiliary_columns = this.auxiliaryColumnNames.map(col => dataRow[col])
        rows.push(row)
      })

      return rows
    }
  }

}
