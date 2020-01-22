<template>
  <div class="main-content uspg" ref="main-content">
    <no-permission v-if="!$hasPermission('projects_create')" />

    <!-- ====== Stepper BOX ====== -->
    <alert v-else-if="!user.profile.upload_allowed" type="info">
      <h2>{{ $t('upload_not_allowed.to_upload') }}
        <strong><a class="accent--text" target="_external" href="https://app.hubspot.com/meetings/maurice3">
          {{ $t('upload_not_allowed.link_text') }}
        </a></strong>.<br>
      </h2>
      <span v-html="$t('upload_not_allowed.subtitle-1')" />

      <!-- {{ $t('save.not_enough_credits_month', { rows: nAnswerRows, credits_remaining: userCreditsRemaining }) }} -->
    </alert>

    <v-stepper v-model="step" v-else>
      <v-stepper-header>
        <v-divider />
        <v-stepper-step :complete="validAnswersUpload"
                        :editable="!loading.active"
                        :edit-icon="'$vuetify.icons.complete'"
                        step="1">
          {{ $t('answers.title') }}
        </v-stepper-step>

        <v-divider />

        <v-stepper-step :complete="validAnswersUpload&&validCodesUpload"
                        :editable="!loading.active&&validAnswersUpload"
                        :edit-icon="'$vuetify.icons.complete'"
                        step="2">
          {{ $t('codes.title') }}
        </v-stepper-step>

        <v-divider />

        <v-stepper-step :editable="!loading.active&&validCodesUpload&&validAnswersUpload"
                        step="3">
          {{ $t('save.title') }}
        </v-stepper-step>
        <v-divider />
      </v-stepper-header>

      <v-stepper-items>

        <!-- ====== Step: UPLOAD ANSWERS ====== -->
        <v-stepper-content step="1">

          <div class="headline">{{ $t('answers.title') }}</div>
          <p/>

          <upload-answers v-model="validAnswersUpload"
                          :answers-input.sync="answersInput"
                          :answers-res.sync="answersRes"
                          :loading.sync="loading.active"
                          :project.sync="project"
                          :question-template="questionTemplate"
                          :show-n-sample-rows="showNSampleRows"
                          :encoding-options="encodingOptions"
                          :header-options="headerOptions"
                          ref="uploadAnswers" />

          <v-btn :disabled="!validAnswersUpload||loading.active"
                 @click="clickAnswersNext" color="primary">
            {{ $t('next') }}
          </v-btn>

        </v-stepper-content>

        <!-- ====== Step: UPLOAD CODES ====== -->
        <v-stepper-content step="2">

          <v-stepper v-model="codebookStepper" vertical :complete="false" ref="codebookStepper">
            <template v-for="(question, qIdx) in project.questions">
              <v-stepper-step :step="qIdx+1" :key="`step-${question._id}`">
                <div class="headline" v-html="$t('codes.headline', { question: question.name })" />
              </v-stepper-step>

              <v-stepper-content :step="qIdx+1" :key="`content-${question._id}`">
                <upload-codes v-model="question._codebookReady"
                              :loading.sync="loading.active"
                              :inheritable-projects="inheritableProjects"
                              :show-n-sample-rows="showNSampleRows"
                              :encoding-options="encodingOptions"
                              :header-options="headerOptions"
                              :merge-options="mergeOptions[qIdx]"
                              ref="uploadCodes" />

                <v-btn :disabled="loading.active" @click="codeStepperPrevious">
                  {{ $t('back') }}
                </v-btn>

                <v-btn :disabled="loading.active||question._codebookReady===false" @click="codeStepperNext" color="primary">
                  {{ $t('next') }}
                </v-btn>

              </v-stepper-content>
            </template>

          </v-stepper>

        </v-stepper-content>

        <!-- ====== Step: SAVE Project ====== -->
        <v-stepper-content step="3">

          <loading v-model="loading.percentage"
                   :is-loading="loading.active"
                   :dont-animate-entry="true"
                   :title="$t('processing')"
                   :tagline="loading.eta">
            <div class="headline">{{ $t('save.title') }}</div>
            <p/>

            <div class="subheading" style="margin-bottom: 40px">{{ $t('save.info') }}</div>

            <!-- warning if not enough credits available, but only if not on free ;) -->
            <template v-if="nAnswerRows>userCreditsRemaining && user.subscription.plan.id !== 10">
              <!-- at the end of the month it will be sufficient -->
              <alert v-if="nAnswerRows<=user.subscription.plan.credits_monthly"
                     type="warning" style="width: 45%">
                {{ $t('save.not_enough_credits_month', { rows: nAnswerRows, credits_remaining: userCreditsRemaining }) }}
              </alert>

              <!-- it will never be sufficient without purchasing further credits -->
              <alert v-else type="warning" style="width: 45%">
                {{ $t('save.not_enough_credits_ever', {
                  rows: nAnswerRows,
                  credits: user.subscription.plan.credits_monthly })
                }}
              </alert>
            </template>

            <alert v-if="loading.failed !== null" type="error" style="width: 45%">
              {{ loading.failed }}

            </alert>

            <v-text-field v-model="project.name"
                          :error="errors.name.length > 0"
                          :error-messages="errors.name"
                          @input="checkProjectNameDebounced"
                          required
                          counter
                          maxlength="50"
                          :label="$t('save.name')"
                          style="width: 45%" />

            <label-select v-model="project.labels"
                          class="save-labels"
                          :options="labels"
                          :sync="true"
                          allow-new
                          :placeholder="$t('save.labels_placeholder')"
                          max-height="300px"
                          @new-label="saveAttachLabel"/>

            <v-autocomplete v-model="project.language"
                            :label="$t('save.language')"
                            :items="uploadLanguages"
                            item-value="value"
                            item-text="text"
                            style="width: 45%" />

            <div style="display: flex" v-if="!allQuestionsAreList">
              <v-select v-model="project.translated"
                        :items="[{ text: $t('no'), value: 0 }, { text: $t('yes'), value: 1 }]"
                        :label="$t('save.translate.input')"
                        style="flex: 0 0 45%" />

              <div style="padding: 25px 0 0 20px">
                <helptip position="top" :width="650" :anchor-text="$t('helptip_anchor')">
                  <div v-html="$t('save.translate.helptip_content', { link: 'https://cloud.google.com/translate/docs/languages'})"/>
                </helptip>
              </div>
            </div>

            <alert v-if="project.translated" type="warning" style="width: 45%">
              {{ $t('save.translate.warning') }}
            </alert>

            <advanced-options divider-top divider-bottom style="width: 45%">
              <div class="switch-with-helptip">
                <v-switch v-model="questionSettings.smart_sort"
                          color="success"
                          :label="$t('smart_sort.title')" />
                <helptip position="top" :width="510" :anchor-text="$t('helptip_anchor')">
                  <div v-html="$t('smart_sort.helptip')"/>
                </helptip>
              </div>

              <div class="switch-with-helptip">
                <v-switch v-model="questionSettings.group_identical"
                          :label="$t('group_identical.title')"
                          color="success" />
                <helptip position="top" :width="510" :anchor-text="$t('helptip_anchor')">
                  <div v-html="$t('group_identical.helptip')"/>
                </helptip>
              </div>

              <div v-if="questionSettings.group_identical" class="switch-with-helptip">
                <v-text-field v-model="questionSettings.group_identical_exclude"
                              maxlength="255"
                              counter
                              :label="$t('group_identical.exclude_regex')" />
                <helptip position="top" :width="510" :anchor-text="$t('helptip_anchor')" style="margin-top: 21px">
                  <div v-html="$t('group_identical.exclude_regex_helptip')"/>
                </helptip>
              </div>

            </advanced-options>

          </loading>

          <div style="margin-top: 10px">
            <v-btn :disabled="loading.active" @click="step='2'">
              {{ $t('back') }}
            </v-btn>

            <v-btn :disabled="project.name.length<5||loading.active" @click="saveProject" color="primary">
              {{ $t('save.save') }}
            </v-btn>
          </div>

        </v-stepper-content>
      </v-stepper-items>

    </v-stepper>
  </div>
</template>

<script>
import Vuex from 'vuex'
import UploadAnswersComponent from '@/components/upload/UploadAnswers'
import UploadCodesComponent from '@/components/upload/UploadCodes'
import UploadAnswersMixin from '@/mixins/uploadAnswers'
import ProjectListMixin from '@/mixins/ProjectList'
import LabelSelect from '@/components/LabelSelect'
import ApiTaskMixin from '@/mixins/apitask'

import { QUESTION_CATEGORY_LIST, UPLOAD_LANGUAGES } from '@/settings/constants'

// The template which will be cloned when adding questions
const QUESTION_TEMPLATE = {
  // The properties that will be posted to the API
  name: '',
  completed: false,
  codebook: [],
  inherits_from: null,
  group_identical: true,
  group_identical_exclude: '',
  description: '',
  question_category: null,
  no_training: false,
  smart_sort: true,
  // Frontent props
  _merge: false,
  _codebookReady: false, // if the codebook is valid for this question
  _id: 0 // an identifier, required for the stepper key

}

export default {
  codit: true,
  name: 'Upload',
  components: {
    'upload-answers': UploadAnswersComponent,
    'upload-codes': UploadCodesComponent,
    'label-select': LabelSelect
  },
  mixins: [UploadAnswersMixin, ProjectListMixin, ApiTaskMixin],
  data () {
    return {
      step: '1',
      showNSampleRows: 30,

      inheritableProjects: [],

      codebookStepper: -1,
      codebookWasViewed: false,

      questionTemplate: _.clone(QUESTION_TEMPLATE),

      questionSettings: {
        smart_sort: true,
        group_identical: true,
        group_identical_exclude: ''
      },

      project: {
        name: '',
        language: window.language,
        labels: [],
        auxiliary_column_names: [],
        questions: [_.clone(QUESTION_TEMPLATE)],
        translated: 0
      },

      errors: {
        name: []
      },

      checkProjectNameDebounced: _.debounce(() => {
        if (this.project.name.length < 5) this.errors.name = [this.$t('save.name_too_short')]
        else this.errors.name = []
      }, 250),

      loading: {
        active: false,
        percentage: null,
        eta: '',
        failed: null
      }
    }
  },

  computed: {
    labels () {
      return _.uniq(_.flatten(_.map(this.inheritableProjects, 'labels'))).sort()
    },

    validCodesUpload () {
      return this.codebookWasViewed && _.map(this.project.questions, '_codebookReady').indexOf(false) === -1
    },

    label2idx () {
      let lbl2idx = {}
      this.labels.forEach((lbl, idx) => { lbl2idx[lbl] = idx })
      return lbl2idx
    },

    allQuestionsAreList () {
      return _.every(this.project.questions, { question_category: QUESTION_CATEGORY_LIST })
    },

    uploadLanguages () {
      return _.map(UPLOAD_LANGUAGES, v => ({ text: this.$t(`language.${v}`), value: v }))
    },

    /**
     * Return the list of questions every question can be merged with
     * @return {array} Array of question ids
     */
    mergeOptions () {
      return this.project.questions.map((question, qIdx) => {
        // Every question can only be merged with *previous* questions
        return _.map(_.filter(this.project.questions.slice(0, qIdx), q => q.question_category === QUESTION_CATEGORY_LIST && !q._merge),
          ({ _id, name }) => ({ _id, name })
        )
      })
    },

    ...Vuex.mapState(['user']),
    ...Vuex.mapGetters(['userCreditsRemaining'])
  },

  watch: {
    step (newStep, oldStep) {
      if (oldStep === '1' && newStep === '2') {
        // To force re-render when questions changed, we always want the stepper to change
        // when coming from the first step
        this.codebookStepper = 1
      }
      if (newStep === '1') {
        // Set the stepper value to something else than it currently is, see comment above
        this.codebookStepper = -1
      }
    }
  },

  created () {
    api.get('/api/projects-inheritable/').then((res) => {
      this.$set(this, 'inheritableProjects', res.data)
      this.computeProjectProperties('inheritableProjects')
    }).catch(err => this.$maybeRaiseAPIPromiseErr(err))
  },

  methods: {
    clickAnswersNext () {
      this.step = '2'
      this.codebookWasViewed = true
    },

    codeStepperPrevious () {
      // If there are prevous codebooks to be defined, go to previous one
      if (this.codebookStepper > 1) this.codebookStepper -= 1
      // Otherwise return to answer defintion
      else this.step = '1'
    },

    codeStepperNext () {
      // Set the results of the current question
      let res = this.$refs.uploadCodes[this.codebookStepper - 1].result()
      let q = this.project.questions[this.codebookStepper - 1]
      q.codebook = res.codebook
      q.inherits_from = res.inheritsFrom
      q.question_category = res.questionCategory
      q.no_training = res.noTraining
      q._merge = res.merge

      // If there are more codebooks to be defined, go to next one
      if (this.codebookStepper < this.nQuestions) this.codebookStepper += 1
      // Otherwise go to settings
      else this.step = '3'
    },

    saveProject () {
      this.loading.active = true
      this.loading.failed = false
      this.loading.percentage = null

      // Create the rows with answers and auxiliary column keys
      this.project.rows = this.prepareRowsForSubmit()

      // Set the names of the auxiliary columns on the project
      this.project.auxiliary_column_names = this.auxiliaryColumnNames

      // The codebook and inheritance is alreay set by the watcher of the step
      // Set the additional question properties which are defined globally here
      this.project.questions.forEach(q => _.each(this.questionSettings, (val, key) => { q[key] = val }))

      let postProject = _.clone(this.project)
      // Filter the questions that were merged
      postProject.questions = _.filter(postProject.questions, q => !q._merge)

      // If we're on the local dev env, don't use async, it's a pain to get
      // all stuff required for that running on local
      // let queryParams = (process.env.CODIT_ENV !== 'local' ? '?async' : '')
      let queryParams = '?async'

      api.post(`/api/projects/${queryParams}`, postProject).then((res) => {
        if (!('id' in res.data)) {
          this.$root.snackMsg(this.$t('error', {'step': this.$t('save.saving')}))
          this.loading.failed = this.$t('error', {'step': this.$t('save.saving')})
          this.loading.active = false
        } else {
          let updateCb = (eta, percentage) => {
            this.loading.eta = eta
            this.loading.percentage = percentage
          }
          this.getApiTaskStatus(res.headers['task-id'], parseFloat(res.headers['task-eta']), updateCb).then(() => {
            this.done(res.data.id)
          }).catch(err => {
            this.$root.snackMsg(this.$t('error', {'step': this.$t('save.saving')}))
            this.loading.failed = this.$t('error', {'step': this.$t('save.saving')})
            this.loading.active = false
            this.$onError(err)
          })
        }
      }).catch((err) => {
        this.loading.active = false
        this.$root.snackMsg(this.$t('error', {'step': this.$t('save.saving')}))
        this.loading.failed = this.$t('error', {'step': this.$t('save.saving')})
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },

    done (projectid) {
      this.$root.snackMsg(this.$t('save.done', {'type': this.$t('project.item'), 'name': this.project.name}))
      this.$router.push({ name: 'projects-manage-id', params: { id: projectid } })
    },

    saveAttachLabel (label) {
      if (this.project.labels.indexOf(label) === -1) this.project.labels.push(label)
    }
  }
}

</script>

<style lang=scss scoped>

.save-labels {
  border-bottom: 1px solid #949494;
  width: 45%;
  margin-bottom: 40px;
}

.v-input--switch { margin-left: 14px }

.switch-with-helptip {
  position: relative;
  /* Workaround to give the first element a margin, the subsequent ones not */
  .v-input--switch { flex: 0 0 auto; margin-top: 5px }
  .helptip {
    left: 100%;
    top: 0;
    position: absolute;
    width: auto;
    white-space: nowrap;
    margin-left: 20px;
    margin-top: 4px;
  }
}

</style>

<style lang=scss>

@import '../css/upload.scss';

.uspg .code-chip {
  background: #EEE!important;
}
.uspg .code-chip.selected, .code-chip:hover {
  background: #BDBDBD!important;
}

</style>

<i18n src='../i18n/pages/Upload.json'></i18n>
