<template>
  <v-tabs background-color="primary" v-model="answersInput.tab" icons-and-text dark>
    <v-tab key="file">
      {{ $t('upload') }}
      <v-icon :class="{ 'theme--dark': true }">mdi-attachment</v-icon>
    </v-tab>

    <v-tab key="input" v-if="showInputTab">
      {{ $t('input') }}
      <v-icon :class="{ 'theme--dark': true }">mdi-keyboard</v-icon>

    </v-tab>

    <v-tab-item>
      <ol style="margin-top: 20px">
        <li>
          <div class="subtitle-1">{{ $t('upload_file') }}</div>
          <div style="display: flex">
            <input-file v-model="answersInput.file"
                        :label="$t('choose_file')"
                        required
                        :accept="acceptFileTypes"
                        class="optselect" />

            <span style="margin: auto 0; padding-bottom: 16px">
              {{ $t('download_sample') }}
              <a href="/static/upload_example_answers_fullyopen.xlsx" :download="`Caplena_${$t('sample')}_${$t('answers')}.xlsx`">Excel</a> |
              <a href="/static/upload_example_answers_fullyopen.csv" :download="`Caplena_${$t('sample')}_${$t('answers')}.csv`">CSV</a> |
              <a href="/static/upload_example_answers_fullyopen.txt" :download="`Caplena_${$t('sample')}_${$t('answers')}.txt`">Plaintext</a>
            </span>
          </div>
          <alert type="error" v-if="answersRes.error">
            <span v-html="answersRes.error" />
          </alert>
          <alert type="warning" v-if="answersRes.warn">
            <span v-html="answersRes.warn" />
          </alert>

        </li>
        <loading v-if="loading||answersRes.success"
                 :is-loading="loading"
                 :dont-animate-entry="true"
                 :title="$t('processing')"
                 tagline="">
          <li>
            <div class="subtitle-1">{{ $t('answers.verify') }}</div>

            <v-form ref="answerSelectForm" v-model="fileFormIsValid">

              <div style="display: flex; position: relative"
                   v-for="(qCol, qIdx) in answersInput.questionColumns"
                   :key="qIdx">
                <v-autocomplete v-model="answersInput.questionColumns[qIdx]"
                                :label="questionColumnSelectLabels(qIdx)"
                                :items="answersRes.columns"
                                item-text="name"
                                item-value="name"
                                :class="['optselect', `highlight${qIdx}`]"
                                required
                                style="flex: 1"
                                @change="questionColumnSelected(qIdx)"
                                :rules="questionSelectValidators"
                                :no-data-text="$t('answers.question_column_no_data')" />

                <template v-if="!append">
                  <v-text-field v-model="project.questions[qIdx].name"
                                :label="$t('answers.question_name', { question: (qIdx + 1) })"
                                :rules="questionNameValidators"
                                required
                                maxlength="50"
                                counter
                                style="flex: 1"
                                class="optselect" />

                  <v-textarea v-model="project.questions[qIdx].description"
                              rows="1"
                              counter
                              :label="$t('answers.question_description', { question: (qIdx + 1) })"
                              maxlength="255"
                              style="flex: 2; margin-top: 3px; margin-right: 20px" />

                  <v-btn color="accent"
                         fab
                         icon
                         @click="removeQuestion(qIdx)"
                         v-if="answersInput.questionColumns.length>1"
                         style="margin-top: 12px">
                    <v-icon>mdi-minus-circle</v-icon>
                  </v-btn>

                  <!-- Spacer, so description doesn't jump -->
                  <div v-else style="width: 56px" />

                </template>

              </div>
            </v-form>

            <div>
              <v-btn color="primary"
                     style="margin: 0 0 20px 0"
                     @click="addQuestion"
                     v-if="!append"
                     :disabled="!fileFormIsValid || answersInput.questionColumns.length >= MAX_QUESTIONS_PER_PROJECT">
                <v-icon>mdi-plus</v-icon> {{ $t('answers.add_text_column') }}
              </v-btn>
            </div>

            <advanced-options divider-top divider-bottom>

              <div style="display: flex;">
                <v-select v-if="answersRes.type==='csv'||answersRes.type==='txt'"
                          v-model="answersInput.encoding"
                          :label="$t('encoding')"
                          :items="encodingOptions"
                          class="optselect" />

                <v-select v-model="answersInput.hasHeader"
                          :label="$t('header.title')"
                          :items="headerOptions"
                          item-text="text"
                          item-value="value"
                          class="optselect" />

              </div>

            </advanced-options>

            <div class="body" style="margin:30px 0 5px">{{ $t('sampledata') }}</div>
            <div class="importSample">
              <table>
                <thead>
                  <tr>
                    <th v-for="(col, colIdx) in answersRes.columns" :key="colIdx">{{ String(col.name) }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowIdx) in importSampleAnswers" :key="rowIdx">
                    <td v-for="(col, col_idx) in answersRes.columns"
                        :class="tableHighlightClasses[col.name]"
                        :key="col_idx">{{ row[col.name] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- <v-data-table :items="importSampleAnswers"
                          :headers="$_.map(answersRes.columns, c => { return { text: String(c.name), sortable: false } })"
                          :items-per-page="1000"
                          hide-default-footer
                          class="importSample">

              <tr slot="item" slot-scope="{ item }">
                <td v-for="(col, col_idx) in answersRes.columns"
                    :class="tableHighlightClasses[col.name]"
                    :key="col_idx">{{ item[col.name] }}</td>
              </tr>
            </v-data-table> -->

            <div style="margin-top: 20px">
              <span style="width: 200px; display: inline-block;" class="grey--text">{{ $t('ncolumns') }}:</span>
              <code>{{ answersRes.columns.length }}</code>
            </div>
            <div>
              <span style="width: 200px; display: inline-block;" class="grey--text">{{ $t('nrows') }}:</span>
              <code>{{ answersRes.data.length }}</code>
            </div>
            <div style="margin-bottom: 20px">
              <span style="width: 200px; display: inline-block;" class="grey--text">{{ $t('ndropped') }}:</span>
              <code>{{ answersRes.dropped }}</code>
            </div>

            <alert type="warning" v-if="appendWarning">{{ appendWarning }}</alert>
          </li>
        </loading>
      </ol>

    </v-tab-item>

    <v-tab-item v-if="showInputTab">

      <v-textarea :label="$t('answers.input_placeholder')"
                  outlined
                  style="margin: 10px 0"
                  v-model="answersInput.input" />

    </v-tab-item>
  </v-tabs>
</template>

<script>
import { MAX_ANSWERS_PER_SURVEY, MAX_QUESTIONS_PER_PROJECT, ACCEPT_UPLOAD_FILETYPES, MAX_UPLOAD_FILESIZE_MB } from '@/settings/coding.js'

export default {
  codit: true,
  name: 'UploadAnswers',
  props: {
    // Value is the validation state
    value: { type: Boolean, default: false },
    headerOptions: { type: Array, default: () => [] },
    encodingOptions: { type: Array, default: () => [] },
    auxiliaryColumnNames: { type: Array, default: () => [] },
    project: { type: Object, default: () => {} },
    append: { type: Boolean, default: false },
    showNSampleRows: { type: Number, default: 10 },
    questionTemplate: { type: Object, default: () => {} }
  },
  data () {
    return {
      loading: false,
      acceptFileTypes: ACCEPT_UPLOAD_FILETYPES,
      answersInput: {
        tab: 0,
        input: '',
        file: null,
        questionColumns: [null],
        questionColumnsInvalid: [''],
        encoding: 'Auto',
        hasHeader: 'auto'
      },
      answersRes: { columns: [], data: [], type: null, error: '', warn: '', success: false, dropped: 0 },
      appendWarning: '',
      questionNameValidators: [
        v => v !== null && v.length >= 2 || this.$t('answers.errors.name_short', { n: 2 }),
        v => _.filter(this.project.questions, { name: v }).length <= 1 || this.$t('answers.errors.name_duplicate')
      ],
      questionSelectValidators: [v => v !== null ||
                                 this.$tc('answers.errors.no_col_selected', this.append ? 1 : this.answersInput.questionColumns.length)],

      fileFormIsValid: false
    }
  },

  computed: {
    answersInputType () { return ['file', 'input'][this.answersInput.tab] },

    importSampleAnswers: {
      get () { return this.answersRes.data.slice(0, this.showNSampleRows) }
    },

    showInputTab () {
      // Only show input option if this is a new project or the existing project has no auxiliary columns -->
      return !this.append || (this.project.auxiliary_column_names.length === 0 && this.project.questions.length === 1)
    },

    tableHighlightClasses () {
      let colToClassMap = {}
      this.answersRes.columns.forEach(c => {
        let selCol = this.answersInput.questionColumns.indexOf(c.name)
        colToClassMap[c.name] = (selCol === -1 ? [] : `highlight${selCol}`)
      })
      return colToClassMap
    },

    isValid () {
      if (this.answersInputType === 'input') return this.answersInput.input.length > 0
      else return this.fileFormIsValid
    },

    MAX_QUESTIONS_PER_PROJECT: {
      cache: false,
      get: () => MAX_QUESTIONS_PER_PROJECT
    }
  },
  watch: {
    isValid: {
      immediate: true,
      handler (val) { this.$emit('input', val) }
    },

    answersInput: {
      deep: true,
      handler (val) { this.$emit('update:answersInput', val) }
    },
    answersRes: {
      handler (val) { this.$emit('update:answersRes', val) }
    },
    loading: {
      handler (val) { this.$emit('update:loading', val) }
    },
    'answersInput.file' (file) {
      // Check that max upload file size is not violated
      if (file === undefined || file === null) return
      if (file.size > MAX_UPLOAD_FILESIZE_MB * 1024 * 1024) {
        this.answersRes.error = this.$t('error_file_too_big', { maxSize: MAX_UPLOAD_FILESIZE_MB })
        return
      }
      this.answersRes.error = ''
      this.answersRes.warn = ''
      this.uploadAnswers()
      if (!this.append) this.resetQuestions()
      else {
        this.project.questions.forEach((q, qIdx) => {
          this.answersInput.questionColumns[qIdx] = null
          this.answersInput.questionColumnsInvalid[qIdx] = ''
        })
      }
      this.validAnswersUpload = false
    },

    // Reset the questions objects. If going to the "input" tab, set the name of the new question
    'answersInput.tab' (val) {
      if (!this.append) this.resetQuestions((val === 1 ? { name: 'Text' } : undefined))
    },

    'answersInput.questionColumns' () {
      if (this.append) {
        // Check if the auxiliary column names match up
        let auxColsOld = this.project.auxiliary_column_names
        let auxColsNew = this.auxiliaryColumnNames
        // Only notify the user if the number of auxiliary columns match up
        // i.e. he has made a selection for every question
        if (auxColsOld.length === auxColsNew.length && !_.isEqual(auxColsOld, auxColsNew)) {
          this.appendWarning = this.$t('answers.warnings.auxiliary_columns_name_missmatch', {
            names_existing: auxColsOld.join(', '),
            names_new: auxColsNew.join(', ')
          })
        } else this.appendWarning = ''
      }
    },
    'answersInput.encoding' (vnew, vold) { this.uploadAnswers() },
    'answersInput.hasHeader' (vnew, vold) { this.uploadAnswers() },

    project: {
      immediate: true,
      handler () {
        if (this.append) {
          this.answersInput.questionColumns.splice(0)
          this.answersInput.questionColumnsInvalid.splice(0)
          // For each question add an element to the questionColumns array
          while (this.answersInput.questionColumns.length < this.project.questions.length) {
            this.answersInput.questionColumns.push(null)
            this.answersInput.questionColumnsInvalid.push('')
          }
        }
      }
    }
  },

  methods: {
    /**
     * Returns a clone of the question template with some properties adapted to current state
     * @return {object} the new question
     */
    getNewQuestionObject () {
      let qObj = _.clone(this.questionTemplate)
      // Every question needs an identifier for the frontend to distinguish it
      // This is just a continuous counter
      qObj._id = _.last(this.project.questions)._id + 1
      return qObj
    },

    questionColumnSelectLabels (qIdx) {
      if (this.append) return this.$t('answers.question_column', { question: this.project.questions[qIdx].name })
      else return this.$t('answers.question_column', { question: `${qIdx + 1}` })
    },

    resetQuestions (newQuestionAttributes = {}) {
      let l = this.answersInput.questionColumns.length
      this.answersInput.questionColumns.splice(0, l, null)
      this.$nextTick(() => {
        this.project.questions.splice(0, l, { ...this.getNewQuestionObject(), ...newQuestionAttributes })
      })
    },

    addQuestion () {
      // Add a further question select and text input field
      if (this.isValid) {
        this.answersInput.questionColumns.push(null)
        this.project.questions.push(this.getNewQuestionObject())
      }
    },

    removeQuestion (qIdx) {
      // Remove the question given by the index
      this.answersInput.questionColumns.splice(qIdx, 1)
      this.project.questions.splice(qIdx, 1)
    },

    /**
     * @change handler for question column selects
     * sets the name of the question to the column name and makes sure no column is selected multiple times
     *
     * @param  {int} qIdx index of the question being changed
     * @return void
     */
    questionColumnSelected (qIdx) {
      let colSelected = this.answersInput.questionColumns[qIdx]

      // If the column has been deselected, do nothing
      if (colSelected === null) return

      // Set the value of the question name to the column name
      if (!this.append) this.$set(this.project.questions[qIdx], 'name', colSelected.substr(0, 50))

      // Check if this column has already been chosen for another question
      // If yes, remove it from the other question and run validation (so that the user notices it)
      let previouslySelected = _.findIndex(this.answersInput.questionColumns, (v, idx) => idx !== qIdx && v === colSelected)
      if (previouslySelected !== -1) {
        this.answersInput.questionColumns.splice(previouslySelected, 1, null)
      }
    },

    uploadAnswers () {
      this.loading = true
      let data = new FormData()
      data.append('file', this.answersInput.file)
      if (this.answersInput.encoding) data.append('encoding', this.answersInput.encoding)
      if (this.answersInput.hasHeader !== 'auto') data.append('has-header', this.answersInput.hasHeader)

      api.post('/api/parse-upload', data, { dontReport: [400] }).then((res) => {
        if (res.data.warning) this.answersRes.warn = this.$t('warning') + res.data.warning
        if (res.status >= 400) {
          this.answersRes.error = res.data.detail
          this.answersRes.success = false
        } else if (res.data.data.length > MAX_ANSWERS_PER_SURVEY) {
          this.answersRes.error = this.$t('answers.errors.too_many', { allowed: MAX_ANSWERS_PER_SURVEY })
          this.answersRes.success = false
        } else {
          // It wer're appending to existing project, perform ome further checks
          if (this.append) {
            // Check that the number of columns of the uploaded files matches that of the project
            let nColsOld = this.project.auxiliary_column_names.length + this.project.questions.length
            let nColsNew = res.data.columns.length
            if (nColsOld !== nColsNew) {
              this.answersRes.error = this.$t('answers.errors.auxiliary_columns_count_missmatch', {
                length_old: nColsOld, length_new: nColsNew
              })
              this.answersRes.success = false
            }
          }
          if (!this.answersRes.error) {
            Object.freeze(res.data.data)
            this.$set(this, 'answersRes', res.data)
            // If there is only one column automatically select that one as text column
            if (this.answersRes.columns.length === 1) {
              this.answersInput.questionColumns.splice(0, 1, this.answersRes.columns[0].name)
              if (!this.append) this.$set(this.project.questions[0], 'name', this.answersRes.columns[0].name.substr(0, 50))
            } else if (this.append) {
              // Try to already match columns with question names
              let colNames = _.map(res.data.columns, 'name')
              this.project.questions.forEach((q, qIdx) => {
                const idxMatch = colNames.indexOf(q.name)
                if (idxMatch !== -1) this.$set(this.answersInput.questionColumns, qIdx, q.name)
              })
            }
            // If the file type was input, go to next step automatically
            this.answersRes.success = true
          }
        }
        this.$nextTick(() => { this.loading = false })
      }).catch((err) => {
        this.loading = false
        this.$root.snackMsg(this.$t('error', {'step': this.$t('dataprocessing')}))
        this.answersRes.success = false
        this.$maybeRaiseAPIPromiseErr(err)
      })
    }
  }
}

</script>

<i18n src='@/i18n/pages/Upload.json'></i18n>
