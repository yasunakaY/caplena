<template>
  <div class="upload-codes">
    <div class="select-question-type" :class="{ 'one-selected': questionType !== null }">
      <v-hover close-delay="0">
        {{ questionType }}
        <v-card class="question-type list-type"
                slot-scope="{ hover }"
                :class="{ 'selected': questionType === 'list', [`elevation-${hover || questionType === 'list' ? 5 : 2}`]: true }"
                @click.native="questionType = 'list'">
          <div class="media">
            <v-icon>mdi-format-list-bulleted-square</v-icon><div class="display-1">{{ $t('question_type.list.title') }}</div>
          </div>
          <v-card-text v-if="questionType === null"><span v-html="$t('question_type.list.description')" />
            <ul>
              <li v-for="(sample, idx) in $ta('question_type.list.examples')" :key="idx">{{ sample }}</li>
            </ul>
          </v-card-text>

        </v-card>
      </v-hover>

      <!-- ===== OPEN TYPE ===== -->
      <v-hover close-delay="0">
        <v-card class="question-type open-type"
                :class="{ 'selected': questionType === 'open', [`elevation-${hover || questionType === 'open' ? 5 : 2}`]: true }"
                slot-scope="{ hover }"
                @click.native="questionType = 'open'; questionCategory = null">
          <div class="media">
            <v-icon>mdi-comment-text-outline</v-icon><div class="display-1">{{ $t('question_type.open.title') }}</div>
          </div>
          <v-card-text v-if="questionType === null"><span v-html="$t('question_type.open.description')" />
            <ul>
              <li v-for="(sample, idx) in $ta('question_type.open.examples')" :key="idx">{{ sample }}</li>
            </ul>
          </v-card-text>
        </v-card>
      </v-hover>
    </div>

    <transition name="fade-height">
      <div v-if="questionType === 'open' && questionCategory === null">
        <v-card style="margin-left:10px; background: #FAFAFAFA" class="elevation-1">
          <v-card-text class="select-detail">
            <div class="subtitle-1">{{ $t('question_type.question_category_subtitle-1') }}</div>
            <v-autocomplete
              v-model="questionCategory"
              :items="questionCategoriesItems"
              outlined
              hide-details
              :label="$t('question.category.title')" />

          </v-card-text>

        </v-card>
      </div>
    </transition>

    <div style="height: 20px">&nbsp;</div>

    <v-tabs background-color="primary" v-model="codesInput.tab" icons-and-text dark v-if="questionType !== null">
      <v-tab key="later">
        {{ $t('later') }}
        <v-icon :class="{ 'theme--dark': true }">mdi-clock-outline</v-icon>
      </v-tab>

      <v-tab key="inherit">
        {{ $t('inherit') }}
        <v-icon :class="{ 'theme--dark': true }">mdi-content-copy</v-icon>
      </v-tab>

      <v-tab key="merge" v-if="showTabMerge">
        {{ $t('merge') }}
        <v-icon :class="{ 'theme--dark': true }">merge_type</v-icon>
      </v-tab>

      <v-tab key="file" v-if="showTabFile">
        {{ $t('upload') }}
        <v-icon :class="{ 'theme--dark': true }">mdi-attachment</v-icon>
      </v-tab>

      <v-tab key="input" v-if="showTabInput">
        {{ $t('input') }}
        <v-icon :class="{ 'theme--dark': true }">mdi-keyboard</v-icon>
      </v-tab>

      <v-tab-item key="later" style="padding: 10px 0 10px 5px">
        <div class="subtitle-1">{{ (questionType === 'list' ? $t('codes.list_question') : $t('codes.later_description')) }}</div>
      </v-tab-item>

      <v-tab-item key="inherit">

        <!-- ====== Inheritable projects ====== -->

        <div id="flip-card" :class="{'flip': inheritQuestion !== null}">
          <div class="flip-content">
            <div class="front">
              <project-list v-show="inheritQuestion === null"
                            :projects="inheritableProjectsFiltered"
                            :loading="loading"
                            :hide-columns="{nanswers: true, last_modified: true}"
                            search-filter-enable
                            labels-filter-enable
                            hide-incomplete-filter-enable
                            in-dialog
                            :rows-per-page-options="[5]"
                            :rows-per-page-default="5"
                            ref="projectList">
                <template slot="title">{{ $t('codes.inherit.title') }}</template>

                <template slot="action" slot-scope="{ question }">
                  <v-btn outlined
                         color="primary"
                         @click="selectInheritanceQuestion(question)"
                         v-html="$t('codes.inherit.copy_from_question')" />
                </template>
              </project-list>
            </div>

            <div class="back">
              <div class="title" style="margin-top: 20px; display: flex">
                <span v-if="inheritQuestion!==null" v-html="$t('codes.inherit.existing_codebook',
                                                               { question: inheritQuestion.name,
                                                                 project: inheritQuestion.project_obj.name})" />

                <v-spacer />
                <v-btn @click="deselectInheritanceQuestion" color="accent" style="margin: 0 10px">
                  {{ $t('codes.inherit.other_question') }}
                </v-btn>
              </div>
              <v-data-table class="importSample"
                            :no-data-text="$t('codes.inherit.no_codes')"
                            :items-per-page="1000"
                            hide-default-footer
                            :items="inheritedCodebook"
                            :headers="[
                              { text: $t('codes.inherit.code'), value: 'label', sortable: true },
                              { text: $t('codes.inherit.category'), value: 'category', sortable: true },
                              { text: $t('codes.inherit.id'), value: 'id', sortable: true, align: 'right' }
              ]">
                <tr slot="item" slot-scope="{ item }">
                  <td>{{ item.label }}</td>
                  <td :style="{ background: $color.getSoft(codeCats.indexOf( item.category )) }">
                    {{ item.category }}
                  </td>
                  <td class="right">{{ item.id }}</td>
                </tr>
              </v-data-table>

              <v-divider />

              <div style="display: flex">
                <v-switch v-model="codesInput.inherit"
                          :label="$t('codes.inherit.switch')"
                          color="success"
                          style="flex: 0 0 auto" />
                <helptip position="bottom" :width="650" style="margin: 22px 0 0 5px">
                  <div v-html="$t('codes.inherit.helptip')"/>
                </helptip>
              </div>
            </div>
          </div>
        </div>
      </v-tab-item>

      <v-tab-item key="merge" style="padding: 10px 0 10px 5px" v-if="showTabMerge">
        <div class="subheading" v-html="$t('codes.merge.description')" />
        <v-select v-model="mergeQuestion"
                  :label="$t('codes.merge.label')"
                  :items="mergeOptions"
                  item-text="name"
                  item-value="_id"
                  class="optselect"
                  required />
      </v-tab-item>

      <v-tab-item key="file" v-if="showTabFile">
        <ol style="margin-top: 20px">
          <li>
            <div class="subtitle-1">{{ $t('upload_file') }}</div>
            <div style="display: flex">
              <input-file v-model="codesInput.file"
                          :label="$t('choose_file')"
                          required
                          :accept="acceptFileTypes"
                          class="optselect" />

              <span style="margin: 29px 0 0 30px">
                {{ $t('download_sample') }}
                <a href="/static/upload_example_codes_fullyopen.xlsx"
                   :download="`Caplena_${$t('sample')}_${$t('codes')}.xlsx`">Excel</a> |
                <a href="/static/upload_example_codes_fullyopen.csv"
                   :download="`Caplena_${$t('sample')}_${$t('codes')}.csv`">CSV</a> |
                <a href="/static/upload_example_codes_fullyopen.txt"
                   :download="`Caplena_${$t('sample')}_${$t('codes')}.txt`">Plaintext</a>
              </span>
            </div>
            <alert type="error" v-if="codesRes.errorMsg">
              <span v-html="codesRes.errorMsg" />
            </alert>
            <alert type="warning" v-if="codesRes.warn">
              <span v-html="codesRes.warn" />
            </alert>

          </li>
          <loading v-if="loading||codesRes.success"
                   :is-loading="loading"
                   :dont-animate-entry="true"
                   :title="$t('processing')"
                   tagline="">
            <li>
              <div class="subtitle-1" v-html="$t('codes.verify')" />

              <div style="display: flex">
                <v-select v-model="codesInput.labelColumn"
                          :label="$t('codes.codes_column')"
                          :items="codesRes.columns"
                          item-text="name"
                          item-value="name"
                          :error-messages="codesInput.labelColumnInvalid"
                          class="optselect highlight0"
                          required />

                <v-select v-model="codesInput.codeColumn"
                          :label="$t('codes.numeric_codes_column')"
                          :items="codesRes.columns"
                          item-text="name"
                          item-value="name"
                          :error-messages="codesInput.codeColumnInvalid"
                          class="optselect highlight1"
                          required />

                <v-select v-model="codesInput.categoryColumn"
                          :label="$t('codes.category_column')"
                          :items="codesRes.columns"
                          item-text="name"
                          item-value="name"
                          :error-messages="codesInput.categoryColumnInvalid"
                          class="optselect highlight2"
                          required />

              </div>

              <advanced-options divider-top divider-bottom>

                <div style="display: flex;">
                  <v-select v-if="codesRes.type==='csv'||codesRes.type==='txt'"
                            v-model="codesInput.encoding"
                            :label="$t('encoding')"
                            :items="encodingOptions"
                            class="optselect" />

                  <v-select v-model="codesInput.hasHeader"
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
                      <th v-for="(col, colIdx) in codesRes.columns" :key="colIdx">{{ String(col.name) }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, rowIdx) in importSampleCodes" :key="rowIdx">
                      <td v-for="(col, col_idx) in codesRes.columns"
                          :class="{ 'highlight0' : col.name == codesInput.labelColumn,
                                    'highlight1' : col.name == codesInput.codeColumn,
                                    'highlight2' : col.name == codesInput.categoryColumn }"
                          :key="col_idx">{{ row[col.name] }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </li>
          </loading>
        </ol>

      </v-tab-item>

      <v-tab-item key="input" v-if="showTabInput">
        <v-textarea :label="$t('codes.input_placeholder')"
                    outlined
                    style="margin: 10px 0"
                    v-model="codesInput.input" />

      </v-tab-item>
    </v-tabs>
  </div>

</template>

<script>
'use strict'

import ProjectList from '@/components/ProjectList'

import { MAX_CODES_PER_SURVEY, ACCEPT_UPLOAD_FILETYPES, MAX_UPLOAD_FILESIZE_MB } from '@/settings/coding.js'
import { QUESTION_CATEGORIES, QUESTION_CATEGORY_LIST, QUESTION_CATEGORY_NONE } from '@/settings/constants'

const codesInputTemplate = {
  tab: 0,
  input: '',
  file: null,
  inherit: true,
  inherit_from: null,
  codeColumn: null,
  codeColumnInvalid: '',
  labelColumn: null,
  labelColumnInvalid: '',
  categoryColumn: null,
  categoryColumnInvalid: '',
  encoding: 'Auto',
  hasHeader: 'auto'
}

const codesResTemplate = { columns: [], data: [], type: null, errorMsg: null, dropped: 0, questionType: null }

export default {
  codit: true,
  name: 'UploadCodes',
  components: {
    'project-list': ProjectList
  },
  props: {
    value: { type: Boolean, default: false },
    headerOptions: { type: Array, default: () => [] },
    encodingOptions: { type: Array, default: () => [] },
    inheritableProjects: { type: Array, default: () => [] },
    showNSampleRows: { type: Number, default: 10 },
    mergeOptions: { type: Array, default: () => [] }
  },
  data () {
    return {
      loading: false,

      acceptFileTypes: ACCEPT_UPLOAD_FILETYPES,

      inheritQuestion: null,
      questionType: null,
      questionCategory: null,

      mergeQuestion: null,

      codesInput: _.clone(codesInputTemplate),
      codesRes: _.clone(codesResTemplate)
    }
  },

  computed: {
    showTabFile () { return this.questionType === 'open' },
    showTabInput () { return this.questionType === 'open' },
    showTabMerge () { return this.mergeOptions.length && this.questionType === 'list' },

    availableTabs () {
      let tabs = ['later', 'inherit']
      if (this.showTabMerge) tabs.push('merge')
      if (this.showTabFile) tabs.push('file')
      if (this.showTabInput) tabs.push('input')
      return tabs
    },

    codesInputType () { return this.availableTabs[this.codesInput.tab] },

    isValid () {
      if (this.questionType === null) return false
      if (this.codesInputType === 'file' && this.codesRes.success && this.codesInput.labelColumn) return true
      else if (this.codesInputType === 'input' && this.codesInput.input.length > 0) return true
      else if (this.codesInputType === 'inherit' && this.inheritQuestion !== null) return true
      else if (this.codesInputType === 'merge' && this.mergeQuestion !== null) return true
      else if (this.codesInputType === 'later') return true
      else return false
    },

    codeCats () {
      return _.keys(_.groupBy(this.inheritedCodebook, 'category'))
    },

    inheritedCodebook () {
      if (this.inheritQuestion === null || this.questionType === 'list') return []
      else return this.inheritQuestion.codebook
    },

    questionCategoriesItems () {
      let it = _.filter(QUESTION_CATEGORIES, c => (c !== QUESTION_CATEGORY_LIST && c !== QUESTION_CATEGORY_NONE))
      return _.map(it, c => ({ value: c, text: this.$t(`question.category.${c}`) }))
    },

    importSampleCodes: {
      get () { return this.codesRes.data.slice(0, this.showNSampleRows) }
    },

    inheritableProjectsFiltered () {
      if (this.questionType === 'list') {
        let res = []
        this.inheritableProjects.forEach(p => {
          let pFiltered = _.clone(p)
          pFiltered.questions = p.questions.filter(q => q.question_category === QUESTION_CATEGORY_LIST)
          if (pFiltered.questions.length) res.push(pFiltered)
        })
        return res
      } else return this.inheritableProjects
    }
  },

  watch: {
    loading: {
      handler (val) { this.$emit('update:loading', val) }
    },

    isValid: {
      immediate: true,
      handler (val) { this.$emit('input', val) }
    },

    mergeOptions () { this.mergeQuestion = null },

    questionType () {
      this.$set(this, 'codesInput', _.clone(codesInputTemplate))
      this.$set(this, 'codesRes', _.clone(codesResTemplate))
    },

    'codesInput.file' (file) {
      // Check that max upload file size is not violated
      if (file === undefined || file === null) return
      if (file.size > MAX_UPLOAD_FILESIZE_MB * 1024 * 1024) {
        this.codesRes.errorMsg = this.$t('error_file_too_big', { maxSize: MAX_UPLOAD_FILESIZE_MB })
        return
      }
      this.codesRes.errorMsg = ''
      this.uploadCodes()
      this.codesInput.labelColumn = this.codesInput.codeColumn = this.codesInput.categoryColumn = null
      this.codesInput.labelColumnInvalid = this.codesInput.codeColumnInvalid = this.codesInput.categoryColumnInvalid = ''
    },

    'codesInput.labelColumn' (val) {
      if (val === null) return
      if (this.codesInput.codeColumn === val) this.codesInput.codeColumn = null
      if (this.codesInput.categoryColumn === val) this.codesInput.categoryColumn = null
      if (this.codesRes.data.length > MAX_CODES_PER_SURVEY) {
        this.$nextTick(() => { this.codesInput.labelColumn = null })
        this.codesInput.labelColumnInvalid = this.$t('codes.errors.too_many', { allowed: MAX_CODES_PER_SURVEY })
      } else if (this.codesRes.data.filter(r => r[val].length === 0).length) {
        this.$nextTick(() => { this.codesInput.labelColumn = null })
        this.codesInput.labelColumnInvalid = this.$t('codes.errors.label_empty', { column: val })
      } else this.codesInput.labelColumnInvalid = ''
    },

    'codesInput.categoryColumn' (val) {
      if (val === null) return
      if (this.codesInput.codeColumn === val) this.codesInput.codeColumn = null
      if (this.codesInput.labelColumn === val) this.codesInput.labelColumn = null
      if (this.codesRes.data.filter(r => r[val].length === 0).length) {
        this.$nextTick(() => { this.codesInput.categoryColumn = null })
        this.codesInput.categoryColumnInvalid = this.$t('codes.errors.cat_empty', { column: val })
      } else this.codesInput.categoryColumnInvalid = ''
    },

    'codesInput.codeColumn' (val) {
      if (val === null) return
      if (this.codesInput.labelColumn === val) this.codesInput.labelColumn = null
      if (this.codesInput.categoryColumn === val) this.codesInput.categoryColumn = null
      // If the type is float64, convert it to int and then run the checks
      if (_.find(this.codesRes.columns, { name: val }).dtype !== 'int64') {
        // Try to convert it to integers
        let allValid = true
        let newVals = []
        this.codesRes.data.forEach(row => {
          let intVal = parseInt(row[val])
          if (!isNaN(intVal)) newVals.push(intVal)
          else allValid = false
        })
        if (allValid) {
          this.codesRes.data.forEach((row, idx) => { row[val] = newVals[idx] })
          _.find(this.codesRes.columns, { name: val }).dtype = 'int64'
        }
      }
      if (_.find(this.codesRes.columns, { name: val }).dtype !== 'int64') {
        this.$nextTick(() => { this.codesInput.codeColumn = null })
        this.codesInput.codeColumnInvalid = this.$t('codes.errors.id_not_int', { column: val })
      } else if (_.uniqBy(this.codesRes.data, val).length !== this.codesRes.data.length) {
        this.$nextTick(() => { this.codesInput.codeColumn = null })
        this.codesInput.codeColumnInvalid = this.$t('codes.errors.id_not_unique', { column: val })
      } else if (_.minBy(this.codesRes.data, val)[val] < 0) {
        this.$nextTick(() => { this.codesInput.codeColumn = null })
        this.codesInput.codeColumnInvalid = this.$t('codes.errors.id_smaller_zero', { column: val })
      } else this.codesInput.codeColumnInvalid = ''
    },

    'codesInput.encoding' (vnew, vold) { this.uploadCodes() },
    'codesInput.hasHeader' (vnew, vold) { this.uploadCodes() }
  },

  methods: {
    selectInheritanceQuestion (question) {
      this.$refs.projectList.hideQuestions()
      this.inheritQuestion = question
    },

    deselectInheritanceQuestion () {
      this.inheritQuestion = null
    },

    result () {
      if (!this.isValid) throw Error('Codebook input not valid')
      let codebook = null
      let inheritsFrom = null
      let isList = this.questionType === 'list'
      let questionCategory = (this.questionCategory === null ? QUESTION_CATEGORY_NONE : this.questionCategory)
      questionCategory = (isList ? QUESTION_CATEGORY_LIST : questionCategory)
      let noTraining = isList

      const DEFAULT_CAT = 'CODES'
      if (this.codesInputType === 'later') codebook = []
      else if (this.codesInputType === 'input') {
        // Split input lines
        codebook = _.map(this.codesInput.input.split(/\r?\n/).filter(v => v.length > 0), (v, idx) => {
          return { id: (idx + 1), label: _.trim(v), category: DEFAULT_CAT }
        })
      } else if (this.codesInputType === 'file') {
        codebook = []
        this.codesRes.data.forEach((v, idx) => {
          codebook.push({
            id: (this.codesInput.codeColumn !== null ? v[this.codesInput.codeColumn] : idx),
            label: String(v[this.codesInput.labelColumn]),
            category: String(v[this.codesInput.categoryColumn] || DEFAULT_CAT).toUpperCase()
          })
        })
      } else if (this.codesInputType === 'inherit') {
        codebook = this.inheritedCodebook
        if (this.codesInput.inherit) inheritsFrom = this.inheritQuestion.id
      }

      return { codebook, inheritsFrom, questionCategory, noTraining, merge: this.codesInputType === 'merge' && this.mergeQuestion }
    },

    uploadCodes () {
      this.loading = true
      let data = new FormData()
      data.append('file', this.codesInput.file)
      if (this.codesInput.encoding) data.append('encoding', this.codesInput.encoding)
      if (this.codesInput.hasHeader !== 'auto') data.append('has-header', this.codesInput.hasHeader)

      api.post('/api/parse-upload', data, { dontReport: [400] }).then((res) => {
        if (res.data.warning) this.$root.snackMsg(this.$t('warning') + res.data.warning)
        if (res.status >= 400) {
          // this.$root.snackMsg(this.$t('error', {'step': this.$t('upload')}))
          this.codesRes.errorMsg = res.data.error
          this.codesRes.success = false
        } else {
          this.$set(this, 'codesRes', res.data)
          // If there is only one column automatically select that one as code name
          if (this.codesRes.columns.length === 1) this.codesInput.labelColumn = this.codesRes.columns[0].name
          this.codesRes.success = true
        }
        this.loading = false
      }).catch((err) => {
        this.loading = false
        this.$root.snackMsg(this.$t('error', {'step': this.$t('dataprocessing')}))
        this.codesRes.success = false
        this.$maybeRaiseAPIPromiseErr(err)
      })
      this.$nextTick(() => { this.loading = false })
    }
  }
}
</script>

<style lang=scss>

.upload-codes {
  .fade-height-enter-active,
  .fade-height-leave-active {
    transition: all 0.25s ease-in-out;
    max-height: 130px;
  }
  .fade-height-enter,
  .fade-height-leave-to
  {
    opacity: 0;
    max-height: 0px;
  }

  .v-card {
    border-radius: 0;
  }

  .select-question-type {
    display: flex;
  }

  .select-question-type.one-selected .media {
    color: #FFF;
    .v-icon { color: #FFF }
  }

  .question-type {
    flex: 1;
    margin: 0 10px 20px 10px;
    transition: all 0.3s ease-in-out;
    cursor: pointer;

    .media {
      transition: all 0.3s ease-in-out;
      display: flex;
      align-items: center;
      padding: 20px 30px;
      .v-icon {
        font-size: 60px;
        margin: 0 15px 0 10px;
      }
    }

    .v-card__text {
      line-height: 1.3em;
      ul {
        margin-top: 8px;
        font-style: italic;
        li { line-height: 1.3em; }
      }
    }

    &.list-type {
      height: 0%;
      &:hover, .media, &.selected { background: $col-soft-green; }
      &.selected { background: $col-medium-green; }

    }

    &.open-type {
      &:hover, .media, &.selected { background: $col-soft-red; }
      &.selected { background: $col-medium-red; }
    }
  }

  .select-detail .subtitle-1 {
    font-style: italic;
    margin-bottom: 10px;
    text-align: center;
  }

  .v-tabs, > .c-alert {
    margin: 0 10px;
  }

  #flip-card {
    width: 100%;
    height: 470px;
    overflow-y: hidden;
    perspective: 2000px;

    .flip-content {
      position: absolute;
      width: 100%;
      height: 100%;

      transition: transform 0.5s;
      transform-style: preserve-3d;
    }

    &.flip .flip-content {
      transform: rotateX( 180deg );
      transition: transform 0.5s;
    }

    .front,
    .back {
      position: absolute;
      height: 100%;
      width: 100%;
      background: white;
      overflow-x: hidden;
      backface-visibility: hidden;
    }

    .back {
      transform: rotateX( 180deg );
    }
  }
}

</style>

<i18n src='@/i18n/pages/Upload.json'></i18n>
