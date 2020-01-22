<template>
  <div class="main-content" ref="main-content" :class="{'content-focus-active': focusMode }">

    <alert v-if="loadingFailed" type="error"> {{ this.$t('error', {'step': this.$t('loading.title')}) }}</alert>
    <template v-else>

      <template v-if="question.credits_open>userCreditsRemaining">
        <!-- warning if not enough credits available -->
        <alert type="warning">
          <!-- at the end of the month it will be sufficient -->
          <span v-if="question.credits_open<=user.subscription.plan.credits_monthly">
            {{ $t('billing.not_enough_credits_month', {
              rows: question.credits_open,
              of_this_entity: $t('question.of_this'),
              credits_remaining: userCreditsRemaining })
            }}
          </span>
          <!-- it will never be sufficient without purchasing further credits -->
          <span v-else>
            {{ $t('billing.not_enough_credits_ever', {
              rows: question.credits_open,
              of_this_entity: $t('question.of_this'),
              credits: user.subscription.plan.credits_monthly
            }) }}
          </span>
          <div style="text-align: center">
            <v-btn :to="{ name: 'subscription' }">
              {{ $t('billing.buy_additional') }}
            </v-btn>
          </div>
        </alert>
      </template>

      <!-- ====== Project Info BOX ====== -->
      <div style="margin-bottom: 0; min-height: 143px; display: flex">
        <div style="flex: 35">
          <div style="padding-top: 0" v-if="loaded">
            <div class="headline">{{ question.project_name }} </div>
            <div class="subtitle-1">{{ question.name }} </div>
            <div style="font-size: 14px">
              <div class="grey--text"><em>{{ question.description }}</em></div>
              <div class="grey--text"
                   v-html="$t('question.description_long', {'created': $options.filters.dateshort(question.created), 'owner': question.owner, 'last_modified': $options.filters.fromnow(question.last_modified)})"/>
              <br >
              <div class="grey--text" v-if="question.translated===3"
                   v-html="$t('question.translated', {'lang': translateLanguages[question.language] })"/>
              <div class="grey--text" v-if="question.translated===2"
                   v-html="$t('question.translation_failed')"/>
              <div class="grey--text" v-if="question.inherits_from!==null"
                   v-html="$t('question.inherits', { ancestor: question.inherits_from_name })"/>
            </div>
          </div>

        </div>

        <div style="display: flex; flex: 65">
          <james v-if="loaded"/>
        </div>

      </div>

      <!-- ====== Coding BOX ====== -->
      <div style="margin-bottom:12px">
        <coding ref="coding" @download-frequency-chart="$refs['coding-tabs'].downloadChart()"/>
      </div>

      <alert v-if="!editable" type="warning">
        <template v-if="['multiple_users', 'takeover_by'].indexOf(sessionIssue.type) !== -1">
          {{ this.$t('alert_not_editable_other_user') }}
        </template>
        <template v-else>
          {{ this.$t('alert_not_editable_permissions') }}
        </template>
      </alert>

      <!-- ====== Coding functions ====== -->

      <div style="margin-top: 20px">
        <coding-tabs ref="coding-tabs"
                     @request-predictions="$refs.coding.requestPredictions(true)"
                     @set-codes-filter="$refs.coding.setCodesFilter($event)" />
      </div>

    </template>

    <!-- ====== New features modal ====== -->
    <v-dialog v-model="newFeatureOpen" max-width="600" @keydown.esc="newFeatureOpen=false">
      <v-card>
        <v-card-title class="title" primary-title>
          {{ (newFeature!==null ? $t(`new_feature.${newFeature}.title`) : '') }}
        </v-card-title>

        <v-card-text v-html="(newFeature!==null ? $t(`new_feature.${newFeature}.content`) : '')" />

        <v-card-actions>
          <v-spacer />
          <v-btn outlined color="primary" @click="closeNewFeature(false)">{{ $t('new_feature.close_once') }}</v-btn>
          <v-btn color="primary" @click="closeNewFeature(true)">{{ $t('new_feature.close_forever') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <transition name="fade">
      <div ref="overlaybox" id="overlaybox" v-if="focusMode" @click="focusModeOff"/>
    </transition>

  </div>
</template>

<script>
'use strict'

import Vuex from 'vuex'
import axios from 'axios'

import Coding from '@/components/coding/Coding'
import CodingTabs from '@/components/coding/CodingTabs'
import James from '@/components/coding/James'

import tourMixin from '@/mixins/tour.js'

import CodingStore from '@/store/Coding'

import { MIN_TRAIN_ANSWERS } from '../settings/coding.js'

export default {
  codit: true,
  name: 'CodingFullyOpen',
  components: {
    'james': James,
    'coding-tabs': CodingTabs,
    'coding': Coding
  },
  mixins: [tourMixin],
  data () {
    return {
      isDemoQuestion: false,
      // Training
      reviewedSinceLastTrain: 0,
      changedCurrent: false,

      setQuestionTimeout: null,

      timeMounted: null,

      loadingFailed: false,

      // If a new feature was implemented that hasn't been seen by the user yet, display popup for it
      newFeature: null,
      newFeatureOpen: false,

      // Misc
      tour: [
        {
          title: 'tour.codebook.title',
          content: 'tour.codebook.description',
          target: '#codesList',
          placement: 'top',
          yOffset: -10,
          onShow: () => { this.$refs['coding-tabs'].highlightCodebookActions() }
        },
        {
          title: 'tour.graph.title',
          content: 'tour.graph.description',
          target: '#frequencyGraph',
          placement: 'top',
          yOffset: -10
        },
        {
          title: 'tour.score.title',
          content: 'tour.score.description',
          target: '#scoreGraph',
          placement: 'top',
          yOffset: -10
        },
        {
          title: 'tour.shortcuts.title',
          content: 'tour.shortcuts.description',
          target: '#keyboardshortcuts',
          placement: 'top'
        },
        {
          title: 'tour.download.title',
          content: 'tour.download.description',
          target: '#export',
          placement: 'right',
          yOffset: -10
        }
      ]
    }
  },

  computed: {
    // Objects from store
    ...Vuex.mapState({
      translateLanguages: 'translateLanguages',
      user: 'user',
      question: state => state.coding.question,
      loaded: state => state.coding.loaded,
      focusMode: state => state.coding.focusMode,
      editable: state => state.coding.editable,
      dialogIsOpen: state => state.coding.dialogIsOpen,
      sessionIssue: state => state.coding.sessionIssue
    }),

    MIN_TRAIN_ANSWERS: {
      cache: false,
      get: () => MIN_TRAIN_ANSWERS
    },

    ...Vuex.mapGetters([
      'userCreditsRemaining', 'isListQuestion'
    ])
  },

  created () {
    this.$store.registerModule('coding', CodingStore)

    this.loadQuestion(this.$route.params.id)
  },

  mounted () {
    this.timeMounted = new Date().getTime()
  },

  destroyed () {
    clearTimeout(this.setQuestionTimeout)
    this.$store.unregisterModule('coding')
  },

  methods: {
    loadQuestion (id) {
      let question = null
      let answers = null
      // Fetch question info and codebook
      let axiosQuestion = api.get('/api/questions/' + id).then((res) => {
        question = res.data
      }).catch((err) => {
        this.$maybeRaiseAPIPromiseErr(err)
        this.loadingFailed = true
        // Re-raise the error, such that axios.all doesn't think it's a success
        throw err
      })

      let axiosAnswers = this.$store.dispatch('loadAnswers', id).then((res) => {
        answers = res.data
      }).catch((err) => {
        this.loadingFailed = true
        this.$maybeRaiseAPIPromiseErr(err)
        // Re-raise the error, such that axios.all doesn't think it's a success
        throw err
      })

      axios.all([axiosQuestion, axiosAnswers]).then(v => {
        // Check if at least 1s have elapsed since mounting, to give the page enough time to render smoothly
        let diff = new Date().getTime() - this.timeMounted
        if (diff < 1000) {
          this.setQuestionTimeout = setTimeout(() => { this.setQuestion(question, answers) }, 1000 - diff)
        } else this.setQuestion(question, answers)
      }).catch((err) => {
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },

    setQuestion (question, answers) {
      // If this is a demo question, add some specific information on that
      if (!this.$hasPermission('projects_edit', question)) this.$store.commit('isNotEditable')
      if (question.project_name === 'Demo [Open-ends] - Mobile Carrier NPS | Fine tuned') this.isDemoQuestion = 'open'
      if (question.project_name === 'Demo [List] - Banks brand awareness') this.isDemoQuestion = 'list'
      if (this.isDemoQuestion === 'open') {
        this.tour.splice(0, 0, {
          title: 'tour.coding.title',
          content: 'tour.coding.description',
          target: '#coding',
          placement: 'top',
          xOffset: 120
        })

        this.tour.splice(1, 0, {
          title: 'tour.navigate.title',
          content: ['tour.navigate.description', { jumpTo: 500 }],
          target: '.pagination-jump',
          placement: 'bottom'
        })

        this.tour.splice(2, 0, {
          title: 'tour.smart_sort.title',
          content: ['tour.smart_sort.description'],
          target: '.pagination-jump',
          placement: 'bottom'
        })
      } else {
        this.tour.splice(0, 0, {
          title: 'tour.ai.title',
          content: ['tour.ai.description', { n: MIN_TRAIN_ANSWERS }],
          target: '#modelInfo',
          placement: 'left'
        })
      }

      if (this.isDemoQuestion === 'list') {
        this.tour.splice(0, 0, {
          title: 'tour.list.title',
          content: 'tour.list.description',
          target: '#list-autocoder-btn',
          placement: 'top'
        })
      }

      this.$store.commit('setQuestion', question)
      this.$store.commit('setAnswers', answers)

      this.$store.commit('setBreadcrumbProps', {
        projectID: question.project,
        projectName: question.project_name,
        questionID: question.id,
        questionName: question.name
      })

      if (this.question.is_training_bert) this.$store.commit('setTrainingRequestedTime', moment())

      this.$nextTick(() => {
        this.$store.commit('isLoaded')
        this.$store.dispatch('countCodes')
      })

      setTimeout(this.checkIfNewFeature, 1500)
    },
    /**
     * Checks if there is a new feature the user hasn't seen yet and displays a popup for that
     * @return {void}
     */
    checkIfNewFeature () {
      if (!this.$store.state.coding) return // check to see if user has navigated away already
      /* if (!this.isDemoQuestion && !this.isListQuestion && !this.dialogIsOpen && this.question.smart_sort && this.$root.user.profile.pages_visited.indexOf('feature:smart_sort') === -1) {
        this.newFeature = 'smart_sort'
        this.newFeatureOpen = true
      } */
    },

    /**
     * Closes the new feature popup and optionally saves it as seen to the profile
     * @param  {Boolean}  forever   If the message should never be saved again (saved to profile)
     * @return {void}
     */
    closeNewFeature (forever) {
      this.newFeature = null
      this.newFeatureOpen = false
      if (forever) this.$root.markPageAsVisited('feature:smart_sort')
    },

    ...Vuex.mapMutations([
      'focusModeOn',
      'focusModeOff'
    ])
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang=scss scoped>

#overlaybox {
  position: fixed;
  overflow: hidden;

  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  z-index: 49;
  background: rgba(0, 0, 0, 0.8);
}

.content-focus-active {
  min-height: 2000px;
}

</style>

<i18n src='@/i18n/pages/CodingFullyOpen.json'></i18n>
<i18n src='@/i18n/pages/Billing.json'></i18n>
