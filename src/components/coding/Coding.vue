<template>
  <div>
    <div ref="coding-container"
         id="coding-container"
         class="elevation-5"
         :class="{'coding-focus-active': focusMode }"
         v-if="loaded">
      <!-- ====== Coding List ====== -->
      <div class="escapeinfo" :class="{ 'hide': !focusMode }">{{ $t('focus_mode.description') }}</div>

      <div id="filter-container">
        <v-btn icon @click.stop="viewOptions.open=true" :class="{ 'hide': focusMode }" class="view-opts">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-icon v-on="on">mdi-view-module</v-icon>
            </template>
            <span>{{ $t('view-opts.title') }}</span>
          </v-tooltip>
        </v-btn>
        <coding-filters v-model="filter"
                        :n-ans-filtered="answersFiltered.length"
                        @filter-special="filterSpecial"
                        @search-is-focused="searchIsFocused=$event"
                        @show-bulk-edit="showBulkEdit=true" />
      </div>

      <ul id="coding" v-if="answersDisplayed.length">
        <answer v-for="(ans, idx) in answersDisplayed"
                :answer="ans"
                :view-options="viewOptions"
                :key="ans.id"
                :focused="(idxFocused - idxFirst) == idx"
                :focus-mode="focusMode"
                :code-select-height="codeSelectHeight"
                :coding-text-container-height="codingTextContainerHeight"
                :is-scrolling="isScrolling"
                @reviewed="reviewedSinceLastTrain += 1"
                @maybe-scroll-to-code-select="maybeScrollToCodeSelect"
                @focus="idxFocused = idxFirst + idx"
                :ref="`answer${ans.id}`" />
      </ul>

      <empty-state v-else
                   icon="mdi-message-bulleted-off"
                   :label="$t('coding.no_answers.title')"
                   :description="$t('coding.no_answers.details')"/>

      <!-- ====== Coding Pagination ====== -->

      <div class="pagination">
        <span style="margin: 0 auto 0 8px" id="export" v-if="!focusMode && $hasPermission('projects_download', question)">
          <v-btn outlined small @click.stop="showDownload=true">{{ $t('download.title') }}</v-btn>

          <v-btn outlined small color="primary" @click="focusModeOn" style="margin-left: 8px">
            {{ $t('focus_mode.title') }}
          </v-btn>

        </span>
        <span class="pagination-label pagination-jump" v-if="!isScrolling">
          {{ $t('pagination.jump_to', {'item': $t('row') }) }}
        </span>
        <form @submit.prevent="idxFocused = jumpToIdx-1; $refs.jumpTo.blur()" v-if="!isScrolling" id="jumpToForm">
          <v-text-field @blur="jumpToIsFocused=false"
                        @focus="jumpToIsFocused=true"
                        v-model="jumpToIdx"
                        class="jump-to"
                        id="jumpTo"
                        ref="jumpTo"
                        type="number"
                        min="1"
                        :max="answersFiltered.length"/>
        </form>

        <span class="pagination-label" v-if="!focusMode && !isScrolling">{{ $t('pagination.description', {'item': $t('rows')}) }}</span>

        <v-select v-if="!focusMode && !isScrolling"
                  v-model="nShowSelected"
                  dense
                  hide-details
                  :items="nShowOptions" />

        <span>{{ idxFirst + 1 }}-{{ Math.min(idxFirst + nShow, answersFiltered.length) }} von {{ answersFiltered.length }}</span>

        <v-btn icon class="pagination-previous"
               @click="idxFocused -= Math.min(nShow, idxFocused); jamesInc('ans_focus_balance')"
               :disabled="idxFocused < 1">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>

        <v-btn icon class="pagination-next"
               @click="idxFocused += Math.min(answersFiltered.length - idxFocused - 1, nShow); jamesInc('ans_focus_balance')"
               :disabled="idxFocused == (answersFiltered.length - 1)">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
    </div>

    <div v-else class="elevation-3" style="width: 100%; padding: 36px 16px 24px; text-align: center">
      <v-progress-circular :size="70" :width="7" indeterminate color="primary"/>
      <div class="subtitle-1" style="margin-top: 30px">{{ $t('loading.item', {item: $t('answers')}) }}</div>
    </div>

    <download-dialog v-model="showDownload"
                     :credits-open="question.credits_open"
                     entity-type="question"
                     :entity-id="question.id"
                     @download="download"
                     :resources="downloadDialogResources" />

    <view-options v-model="viewOptions" @close="closeViewOptions" />

    <bulk-edit v-model="showBulkEdit"
               :answers-filtered="answersFiltered"
               @reviewed="reviewedSinceLastTrain += $event" />

    <connection-error :show="showConnectionError" />

    <!-- ====== Session issue modal ====== -->
    <v-dialog v-model="sessionIssue.show" max-width="600" v-if="sessionIssue.show" persistent>
      <v-card>
        <v-card-title class="title" primary-title>
          {{ $t(`session_issue.${sessionIssue.type}.title`, { user: editingUser }) }}
        </v-card-title>

        <v-card-text v-html=" $t(`session_issue.${sessionIssue.type}.content`, { user: editingUser })" />

        <v-card-actions v-if="['multiple_users', 'takeover_by', 'takeover_confirm'].indexOf(sessionIssue.type) !== -1">
          <v-spacer />
          <v-btn v-if="sessionIssue.type === 'multiple_users'"
                 @click="retakeSessionControl"
                 :loading="socket.waiting"
                 color="accent">
            {{ $t('session_issue.multiple_users.takeover_control', { user: editingUser }) }}
          </v-btn>
          <v-btn outlined :disabled="socket.waiting" @click="sessionIssue.show = false">{{ $t('ok') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import Vuex from 'vuex'
import Filters from '@/components/coding/Filters'
import Answer from '@/components/coding/Answer'
import ViewOptions from '@/components/coding/ViewOptions'
import ConnectionError from '@/components/coding/ConnectionError'
import BulkEdit from '@/components/coding/BulkEdit'
import DownloadDialog from '@/components/DownloadDialog'

import JamesMixin from '@/mixins/james'
import LocalstorageMixin from '@/mixins/localstorage'

let predictionsCached = null
let escapeStrForRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Maximum number of ties we allow socket to fail before irreversibly closing session
const MAX_SOCKET_FAILED_CNT = 15

export default {
  codit: true,
  name: 'Coding',
  components: {
    'coding-filters': Filters,
    'answer': Answer,
    'connection-error': ConnectionError,
    'view-options': ViewOptions,
    'download-dialog': DownloadDialog,
    'bulk-edit': BulkEdit
  },
  mixins: [JamesMixin, LocalstorageMixin],
  data () {
    return {
      answersFilteredSpecial: [],

      filter: {
        text: '',
        codes: [],
        special: {
          value: 'all',
          options: {
            all: { icon: 'mdi-filter', filter: null },
            reviewed: { icon: 'mdi-check', filter: { reviewed: true } },
            unreviewed: { icon: 'mdi-close', filter: { reviewed: false } },
            marked: { icon: 'mdi-star', filter: v => v.marking.length > 0 },
            nocodes: { icon: 'mdi-label-off-outline', filter: v => v.codes.length === 0 }
          }
        },
        options: [],
        isRunningNextTick: false
      },

      answersSorted: [],

      // View Options
      viewOptions: {
        open: false,
        alternativeID: null,
        additionalColumn: null,
        groupIdentical: false,
        groupIdenticalExclude: '',
        smartSort: false,
        fixCodesDisplayOrder: false,
        // Proxy variable for question.show_sentiment option
        showSentiment: true,
        // Proxy variable for question.show_translation option
        showTranslation: false
      },

      // Training
      reviewedSinceLastTrain: 0,
      // trainingHasBeenRequested: false,

      // UI / Pagination
      isScrollingIncubating: false,
      isScrolling: false,
      idxFocused: -1,
      nShowSelected: 5,
      nShowOptions: [1, 3, 5, 10],
      searchIsFocused: false,
      jumpToIdx: '',
      jumpToIsFocused: false,
      codeSelectHeight: 400,
      codingTextContainerHeight: null,
      showBulkEdit: false,

      // Intervals
      updateLastTrainedInterval: null,
      saveAnswersInterval: null,
      socket: {
        conn: null,
        failedCnt: 0,
        waiting: false,
        closeConnectionTimeout: null
      },

      // Download
      showDownload: false
    }
  },

  computed: {
    idxFirst () {
      // Usually is idxFocused minus half nShow, obviously need to stop at 0 and answers.length - nShow
      let idx = this.idxFocused - Math.ceil(this.nShow / 2) + 1
      idx = Math.min(idx, this.answersFiltered.length - this.nShow)
      idx = Math.max(idx, 0)
      return idx
    },

    invFn () {
      const invertActivated = this.filter.options.indexOf('invert') !== -1
      const inv = res => invertActivated ? !res : res
      return inv
    },

    editingUser () {
      if (!this.usersOnline.length) return this.$t('you')
      else return _.find(this.usersOnline, { read_only: false }).name
    },

    answersFiltered () {
      // answers filtered by search text
      let answers = this.answersFilteredSpecial
      // Invert results if activated
      const inv = this.invFn
      if (this.filter.text !== '') {
        let filter = new RegExp(escapeStrForRegex(this.filter.text), 'i')
        answers = answers.filter(v => {
          let textFound = ((this.viewOptions.showTranslation && v.translated ? v.translated_text : v.text).search(filter) !== -1)
          let IdFound = (this.viewOptions.alternativeID === null && String(v.idx_continuous).search(filter) !== -1)
          let alternativeIdFound = (this.viewOptions.alternativeID !== null && String(v.auxiliary_columns[this.viewOptions.alternativeID]).search(filter) !== -1)
          let additionalColumnFound = (this.viewOptions.additionalColumn !== null && String(v.auxiliary_columns[this.viewOptions.additionalColumn]).search(filter) !== -1)
          return inv(textFound || IdFound || alternativeIdFound || additionalColumnFound)
        })
      }
      return answers
    },

    answersDisplayed () {
      return this.answersSorted.slice(this.idxFirst, this.idxFirst + this.nShow)
    },

    nShow () { return this.focusMode ? 1 : this.nShowSelected },

    ansFocused () { return this.answersSorted[this.idxFocused] },

    ansFocusedID () { return (this.ansFocused ? this.ansFocused.id : -1) },

    ansFocusedComponent: {
      cache: false,
      get () { let r = this.$refs[`answer${this.ansFocusedID}`]; if (!!r && r.length) return r[0] }
    },

    showConnectionError () { return this.savingError.cntAnswers >= 2 || this.savingError.cntCodes >= 2 },

    downloadDialogResources () {
      return {
        answers: true,
        codebook: true,
        chart: { label: this.$t('download.graph'), fn: this.downloadChart }
      }
    },

    // Objects from store
    ...Vuex.mapState({
      user: 'user',
      question: state => state.coding.question,
      loaded: state => state.coding.loaded,
      codes: state => state.coding.codes,
      answers: state => state.coding.answers,
      stats: state => state.coding.stats,
      focusMode: state => state.coding.focusMode,
      answerID2Idx: state => state.coding.answerID2Idx,
      answerIdx2SortedIdx: state => state.coding.answerIdx2SortedIdx,
      unsavedAnswers: state => state.coding.unsavedAnswers,
      dialogIsOpen: state => state.coding.dialogIsOpen,
      savingError: state => state.coding.savingError,
      sortingState: state => state.coding.storeState.sorting,
      editable: state => state.coding.editable,
      usersOnline: state => state.coding.usersOnline,
      sessionIssue: state => state.coding.sessionIssue
    }),
    ...Vuex.mapGetters([
      'userCreditsRemaining',
      'codesSorted',
      'codeCats',
      'codeIdToCat',
      'codeIdToCatIdx',
      'codeIdToIdx',
      'nCodesTotal',
      'answerByID'
    ])
  },

  watch: {
    editable (val) {
      if (val) this.saveAnswersInterval = setInterval(this.saveAnswers, 10000)
      else {
        clearInterval(this.saveAnswersInterval)
        this.saveAnswers()
      }
    },

    sortingState: 'computeAnswersSorted',

    loaded  (val) { if (val) this.init() },
    idxFocused () {
      this.setLsQuestionSettings({ idFocused: this.ansFocusedID })
    },

    jumpToIsFocused (isFocused) {
      if (!isFocused) document.getElementById('jumpTo').blur()
    },

    focusMode (val) {
      if (val) this.activateFocusMode()
      else this.deactivateFocusMode()
    },

    showConnectionError (isError) {
      if (isError) this.disableBodyScroll()
      else this.enableBodyScroll()
      this.mutateDialogOpen(isError)
    },

    showDownload: 'mutateDialogOpen',
    'viewOptions.open': 'mutateDialogOpen',

    dialogIsOpen (val) {
      if (val) this.disableBodyScroll()
      else this.enableBodyScroll()
    },

    answersFiltered () {
      this.computeAnswersSorted()
      this.idxFocused = -1
    },

    codes: {
      deep: true,
      handler () {
        // Check that no code ids are in the filter that are not also in the codes
        let codeIDs = _.map(this.codes, 'id')
        // delete the code from the filter
        this.filter.codes.forEach(filterID => {
          if (codeIDs.indexOf(filterID) === -1) {
            this.filter.codes.splice(this.filter.codes.indexOf(filterID), 1)
            this.filterSpecial()
          }
        })
      }
    },

    'question.model_certainty_thresh' (val) {
      if (predictionsCached !== null) {
        this.$store.dispatch('setPredictions', {
          currentAnswerID: (this.idxFocused >= 0 ? this.ansFocused.id : -1),
          predictions: predictionsCached,
          modelCertaintyThresh: val,
          allowCurrentAnswerOverwrite: true
        })
      }
    },

    'filter.codes': 'filterSpecial',
    'filter.special.value': 'filterSpecial',
    'filter.options': 'filterSpecial',

    isScrolling (val) { console.log('isScrolling', val) },

    'stats.nreviewed_unique' (val) {
      if ((this.$store.getters.nextRetrainThresh - this.stats.nreviewed_unique) <= 0) this.requestPredictions()
    }
  },

  created () {
    if (this.loaded) this.init()
  },

  mounted () {
    window.addEventListener('keydown', this.keydown)
    window.addEventListener('keyup', this.keyup)
    window.addEventListener('beforeunload', this.saveAnswers)
  },

  beforeDestroy () {
    this.saveAnswers()
    this.enableBodyScroll()
    window.removeEventListener('keydown', this.keydown)
    window.removeEventListener('keyup', this.keyup)
    window.removeEventListener('beforeunload', this.saveAnswers)
    clearInterval(this.saveAnswersInterval)
    if (this.socket.closeConnectionTimeout) clearTimeout(this.socket.closeConnectionTimeout)
    if (this.socket.conn) this.socket.conn.close()
  },

  methods: {
    init () {
      // Get the values for grouping from the api request
      this.viewOptions.groupIdentical = this.question.group_identical
      this.viewOptions.groupIdenticalExclude = this.question.group_identical_exclude
      this.viewOptions.showSentiment = this.question.show_sentiment
      this.viewOptions.showTranslation = this.question.show_translation
      this.viewOptions.smartSort = this.question.smart_sort

      // Get the first version of answer set
      this.filterSpecial()

      this.$store.commit('setLastSaved', this.$moment())

      // Check if idxFocused is set in localstorage or not
      let idFocused = this.getLsQuestionSettings().idFocused
      if (idFocused !== undefined && idFocused in this.answerID2Idx) {
        setTimeout(() => { this.idxFocused = _.findIndex(this.answersSorted, v => v.id === idFocused) }, 30)
      }

      // Check if view options were specified
      let viewOpts = this.getLsQuestionSettings()
      let isValidAux = v => v !== undefined && !isNaN(parseInt(v)) && v >= 0 && v < this.question.auxiliary_column_names.length
      this.viewOptions.alternativeID = (isValidAux(viewOpts.alternativeID) ? viewOpts.alternativeID : null)
      this.viewOptions.additionalColumn = (isValidAux(viewOpts.additionalColumn) ? viewOpts.additionalColumn : null)

      // Set the fixed code display order from local storage
      this.viewOptions.fixCodesDisplayOrder = viewOpts.fixCodesDisplayOrder === true

      if (this.editable) {
        this.getPredictionsCached()
        // Websockets connection, getting predictions and checking state of other users online
        this.openWs()
        // Interval to save answers
        this.saveAnswersInterval = setInterval(this.saveAnswers, 10000)
      }
    },

    openWs () {
      ws.open(`ws/question-worker/${this.question.id}/`).then(socket => {
        console.log('Question worker connection established')
        if (this.socket.closeConnectionTimeout) clearTimeout(this.socket.closeConnectionTimeout)
        // Close the socket every 20 hours, to prevent error from being closed by server after 24h
        // and to check that authentication session is still valid
        this.socket.closeConnectionTimeout = setTimeout(() => {
          console.log('Closing & reopening websocket worker connection (long-lived connection)')
          this.socket.conn.close()
          this.socket.closeConnectionTimeout = null
          this.openWs()
        }, 1000 * 3600 * 20)
        this.socket.conn = socket
        this.socket.failedCnt = 0
        socket.onmessage = (event) => {
          this.socket.waiting = false
          let data = JSON.parse(event.data)
          if ('error' in data) throw new Error(`Socket returned error: ${event.data.error}`)
          if ('users_online' in data) this.$store.commit('setUsersOnline', data.users_online[this.question.id])
          if ('predictions' in data) this.setPredictions(data.predictions)
          switch (data.user_err) {
            case 'multiple_tabs':
              this.$store.commit('hasSessionIssue', 'multiple_tabs')
              break
            case 'multiple_users':
              this.$store.commit('isNotEditable')
              this.$store.commit('hasSessionIssue', 'multiple_users')
              break
            case 'takeover_by':
              this.$store.commit('isNotEditable')
              this.$store.commit('hasSessionIssue', 'takeover_by')
              break
            case 'rows_uploaded':
              this.$store.commit('hasSessionIssue', 'rows_uploaded')
              break
            case 'takeover_confirm':
              this.$store.commit('isEditable')
              this.$store.commit('hasSessionIssue', 'takeover_confirm')
              break
          }
        }

        socket.onclose = (event) => {
          console.log('Question worker connection closed.')
          if (event.wasClean) return
          // Try reconnecting in 5 seconds
          setTimeout(this.openWs, 5000)
          console.error(`Question worker closed unexpectedly. Code=${event.code} reason=${event.reason}`)
        }
      }).catch(({ err, event }) => {
        if (event.status === 403 || event.status === 401) {
          console.error('Websockets got permission denied.')
          this.$root.on403()
        }
        this.socket.failedCnt += 1
        if (this.socket.failedCnt >= MAX_SOCKET_FAILED_CNT) {
          this.$store.commit('hasSessionIssue', 'connection_lost')
          this.$onError(new Error(`Failed to connect to socket ${MAX_SOCKET_FAILED_CNT} times, stopping session`))
        } else setTimeout(this.openWs, 5000)
        console.error(err)
        console.error('Question observer failed to connect.')
      })
    },

    retakeSessionControl () {
      this.socket.waiting = true
      this.socket.conn.send(JSON.stringify({ 'takeover_control': true }))
    },

    computeAnswersSorted () {
      if (this.question.smart_sort) this.answersSorted = _.clone(this.answersFiltered).sort((a1, a2) => a1.idx_sorted - a2.idx_sorted)
      else this.answersSorted = this.answersFiltered
    },

    openSelectIfNotOpen () {
      if (this.idxFocused === -1) return
      if (this.searchIsFocused || this.jumpToIsFocused) return
      if (!this.editable) return
      this.ansFocusedComponent.codeSelect.openDropdown()
    },
    focusNext () {
      // Still more items to come...
      if (this.idxFocused < (this.answersFiltered.length - 1)) this.idxFocused += 1
      // Last item but filters activated
      else if (this.answers.length !== this.answersFiltered.length) this.$root.snackMsg(this.$t('coding.last_answer_filtered'))
      // Really last answer
      else this.$root.snackMsg(this.$t('coding.last_answer'))
    },

    focusPrev () { if (this.idxFocused >= 0) this.idxFocused -= 1 },
    keydown (e) {
      let prevent = false
      // If a dialog is open, let key values be default
      if (this.dialogIsOpen) return
      switch (e.keyCode) {
        case 8:
          // Prevent backspace from going a page back in firefox
          let doPrevent = true
          const types = ['text', 'password', 'file', 'search', 'email', 'number', 'date', 'color', 'datetime', 'datetime-local', 'month', 'range', 'search', 'tel', 'time', 'url', 'week']
          let d = e.srcElement || e.target
          const disabled = d.readonly || d.disabled
          const tagName = d.tagName.toLowerCase()
          if (!disabled) {
            if (d.isContentEditable) {
              doPrevent = false
            } else if (tagName === 'input') {
              let type = d.type
              if (type) type = type.toLowerCase()
              if (types.indexOf(type) > -1) {
                doPrevent = false
              }
            } else if (tagName === 'textarea') {
              doPrevent = false
            }
          }
          if (doPrevent) prevent = true

          break
        case 9:
          // Tab
          if (this.idxFocused === -1) return
          this.ansFocusedComponent.maybeSelectText()
          prevent = true
          break
        case 13:
          // Enter
          if (e.shiftKey) {
            // Shift modifier, go up instead of down
            // Don't set the current answer as reviewed
            if (this.idxFocused !== -1) this.focusPrev()
          } else {
            // Focus on next answer
            // If we are not in editing mode enter it, otherwise go to next answer
            if (this.idxFocused !== -1 && this.editable && this.ansFocusedComponent.codeSelect.open) {
              if (!this.ansFocused.reviewed) {
                // If there are some codes assigned, mark as reviewed
                if (this.ansFocused.codes.length) this.ansFocusedComponent.setReviewed()
                else this.$root.snackMsg(this.$t('coding.notreviewed_warn'))
              }
              this.focusNext()
            }
          }
          if (this.idxFocused !== -1) this.$nextTick(v => this.openSelectIfNotOpen())
          this.jamesDec('ans_focus_balance')
          break
        case 37:
          // Arrow left
          break
        case 38:
          // Arrow up
          // Focus one previous, if not already at zero
          this.isScrolling = this.isScrollingIncubating && this.idxFocused >= 0
          this.isScrollingIncubating = true
          this.focusPrev()
          prevent = true
          this.jamesDec('ans_focus_balance')
          break
        case 39:
          // Arrow right
          break
        case 40:
          // Arrow down
          // Focus next one, if not at last el
          this.isScrolling = this.isScrollingIncubating && this.idxFocused < (this.answersFiltered.length - 1)
          this.isScrollingIncubating = true
          this.focusNext()
          prevent = true
          this.jamesDec('ans_focus_balance')
          break
        case 49:
          // "1"
          if (e.shiftKey) {
            // Reduce sentiment
            if (this.idxFocused === -1) return
            this.ansFocusedComponent.decSentiment()
            if (!this.viewOptions.showSentiment) this.setSentimentShow(true)
            prevent = true
          }
          break
        case 50:
          // "2"
          if (e.shiftKey) {
            // Increase sentiment
            if (this.idxFocused === -1) return
            this.ansFocusedComponent.incSentiment()
            if (!this.viewOptions.showSentiment) this.setSentimentShow(true)
            prevent = true
          }
          break
        case 27:
          // Escape
          // If in focus mode, stop it (only if code select isn't open)
          if (this.focusMode) this.focusModeOff()
          break
        // default:
        //  pass
      }
      if (prevent) e.preventDefault()
    },

    keyup (e) {
      let prevent = false
      // If a dialog is open, let key values be default
      if (this.dialogIsOpen) return
      switch (e.keyCode) {
        case 38:
          // Arrow up
          // Deactivate scrolling mode
          this.isScrolling = this.isScrollingIncubating = false
          break
        case 40:
          // Arrow down
          // Focus next one, if not at last el
          this.isScrolling = this.isScrollingIncubating = false
          break
      }
      if (prevent) e.preventDefault()
    },

    maybeScrollToCodeSelect (e) {
      // If not entire dropdown is visible, scroll to top of dropdown
      if (this.focusMode || !this.editable) return
      this.$nextTick(v => {
        let bbox = this.ansFocusedComponent.codeSelect.$el.getBoundingClientRect()
        if ((bbox.y + bbox.height + this.codeSelectHeight) > window.innerHeight) {
          this.$vuetify.goTo(window.pageYOffset + Math.round(bbox.y) - 100, { duration: 500 })
        }
      })
    },

    setCodesFilter (codes) {
      this.filter.codes.splice(0, this.filter.codes.length, ...codes)
    },

    filterSpecial () {
      // Do the filtering

      // Check that the filter function will not run in the next tick anyways
      if (this.filter.isRunningNextTick) return
      this.filter.isRunningNextTick = true

      // If the filter is nocodes, remove all codes from the filter
      if (this.filter.special.value === 'nocodes' && this.filter.codes.length) this.filter.codes.splice(0)

      this.$nextTick(() => {
        this.filter.isRunningNextTick = false
        const inv = this.invFn
        let answers = this.answers
        if (this.filter.special.value !== 'all') answers = _.filter(answers, this.filter.special.options[this.filter.special.value].filter)
        if (this.filter.codes.length) {
          const isOr = this.filter.options.indexOf('andCodes') === -1
          const logicOperator = (isOr ? (matches) => matches.length > 0 : (matches, cf) => matches.length === cf.length)
          answers = _.filter(answers, v => inv(logicOperator(_.intersection(v.codes, this.filter.codes), this.filter.codes)))
        }
        this.answersFilteredSpecial = answers
      })
    },

    requestPredictions (force = false) {
      // Negative indicators
      let doRequest = true
      // if ((this.question.nanswers - this.stats.nreviewed) < MIN_REMAINING_FOR_RETRAIN) doRequest = false
      if (this.question.no_training) doRequest = false

      // Finally, force can always override
      if (force) doRequest = true

      if (!doRequest) return

      // this.lastTrainedAt = nRev
      this.trainingHasBeenRequested = true
      this.$store.commit('updateLastTrainedNReviewed')
      api.post(`/api/questions/${this.question.id}/request-training`).then((res) => {
        let requestedAt
        if (res.data.requested_bert_now) requestedAt = this.$moment()
        else requestedAt = this.$moment(res.data.requested_bert_time)
        if (!res.data.requested_bert_time && !res.data.requested_bert_now) console.log('training request wasn\'t approved by server')
        else {
          console.log('training requested at ', requestedAt.toISOString())
          this.$store.commit('setTrainingRequestedTime', requestedAt)
        }
      })
    },

    getPredictionsCached () {
      api.get(`/api/questions/${this.question.id}/codes-predicted-cached?nothresh=True`).then((res) => {
        if (res.status === 204) {
          console.log('No cached predictions')
          return
        } else if (predictionsCached !== null) {
          console.log('Not setting cached predictions, already exist')
          return
        } else {
          console.log('Setting cached predictions')
          predictionsCached = res.data
          this.$store.commit('predictionsCachedReady')
        }
      }).catch(err => this.$maybeRaiseAPIPromiseErr(err))
    },

    setPredictions (predictions) {
      this.$store.dispatch('setPredictions', {
        currentAnswerID: (this.idxFocused >= 0 ? this.ansFocused.id : -1),
        predictions: predictions,
        modelCertaintyThresh: this.question.model_certainty_thresh
      })
      predictionsCached = predictions
      this.$store.commit('predictionsCachedReady')
    },

    saveAnswers () {
      if (this.unsavedAnswers.length < 1) return
      this.$store.dispatch('saveAnswers').then(res => {
        this.$store.commit('setLastSaved', this.$moment())
        console.log('answers saved')
      }).catch(err => {
        this.$root.snackMsg(this.$t('coding.save_error_answers'))
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },

    download (resource) {
      // Dispatch billing request (checks is necessary will be made in there)
      this.$store.dispatch('billQuestion')
    },

    downloadChart () {
      this.$emit('download-frequency-chart')
    },

    activateFocusMode () {
      if (this.idxFocused === -1) this.idxFocused = 0
      this.disableBodyScroll()
      this.codingTextContainerHeight = Math.max(window.innerHeight - 370, 164)
      setTimeout(v => {
        // Scroll to top of coding container minus 20px
        let bbox = this.$refs['coding-container'].getBoundingClientRect()
        this.$vuetify.goTo(bbox.top + document.documentElement.scrollTop - 120, { duration: 400 })
        this.codeSelectHeight = window.innerHeight - this.$refs['coding-container'].offsetHeight - 120
      }, 500)
    },
    deactivateFocusMode () {
      this.enableBodyScroll()
      this.codeSelectHeight = 400
    },

    disableBodyScroll () { document.getElementsByTagName('html')[0].classList.add('no-scroll') },
    enableBodyScroll () { document.getElementsByTagName('html')[0].classList.remove('no-scroll') },

    closeViewOptions () {
      this.viewOptions.open = false

      let requireReloading = false
      let qPropsToUpdate = {}
      if (this.viewOptions.groupIdentical !== this.question.group_identical || this.viewOptions.groupIdenticalExclude !== this.question.group_identical_exclude) {
        requireReloading = true

        qPropsToUpdate.groupIdentical = this.viewOptions.groupIdentical
        qPropsToUpdate.groupIdenticalExclude = this.viewOptions.groupIdenticalExclude
      }

      if (this.viewOptions.showSentiment !== this.question.show_sentiment) {
        qPropsToUpdate.showSentiment = this.viewOptions.showSentiment
        // this.setSentimentShow(this.viewOptions.showSentiment)
      }

      if (this.viewOptions.showTranslation !== this.question.show_translation) {
        qPropsToUpdate.showTranslation = this.viewOptions.showTranslation
      }

      if (this.viewOptions.smartSort !== this.question.smart_sort) {
        this.idxFocused = -1
        qPropsToUpdate.smartSort = this.viewOptions.smartSort
        this.$nextTick(this.computeAnswersSorted)
      }

      this.setLsQuestionSettings({
        alternativeID: this.viewOptions.alternativeID,
        additionalColumn: this.viewOptions.additionalColumn,
        fixCodesDisplayOrder: this.viewOptions.fixCodesDisplayOrder
      })

      if (_.size(qPropsToUpdate)) {
        let p = this.$store.dispatch('saveQuestionProps', qPropsToUpdate)
        if (requireReloading) {
          this.$store.commit('reloading')
          p = p.then((res) => {
            this.$store.dispatch('loadAnswers', this.question.id).then(v => {
              this.$store.commit('setAnswers', v.data)
              this.$store.commit('isLoaded')
            }).catch(err => {
              this.$root.snackMsg(this.$t('error', {'step': this.$t('loading.title')}))
              this.$maybeRaiseAPIPromiseErr(err)
            })
          })
        }
        p.catch(err => this.$maybeRaiseAPIPromiseErr(err))
      }
    },

    setSentimentShow (val) {
      this.viewOptions.showSentiment = val
      this.$store.dispatch('saveQuestionProps', { showSentiment: val })
    },

    ...Vuex.mapActions(['mutateDialogOpen']),

    ...Vuex.mapMutations([
      'focusModeOn',
      'focusModeOff'
    ])
  }
}
</script>

<style lang=scss>

$row-min-height: 84px;

.hide { display: none; }

#overlay-err {
  position: fixed;
  overflow: hidden;

  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.8);

  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFF;
}

#coding-container {
  border-radius: 4px;
  position: relative;
  width: 100%;
  background: #FFF;
  transition: all 0.6s linear;
  border-top: 5px solid var(--v-primary-base);
  margin-top: 6px;
}

.coding-focus-active {
  z-index: 50;
  border-radius: 10px;
  border-top-color: var(--v-primary-lighten2)!important;
  #coding > li { min-height: $row-min-height*2; }
}

.escapeinfo {
  position: absolute;
  top: -150px;
  left: 0;
  max-width: 300px;
  color: #FFF;
}

#filter-container {
  padding: 0px 20px 0 12px;
  align-items: center;
  display: flex;
}

.auto-assigned .code-chip {
  background-image: repeating-linear-gradient(45deg, transparent, transparent 3px, #E3E3E3 3px, #E3E3E3 16px)!important;
}

#coding {
  padding: 0;
  /* margin: 10px 0 0; */
  list-style: none;
  > li {
    display: flex;
    flex-direction: row;
    background: $col-ans-bg;
    margin: 0;
    color: $col-ans-txt; /* #BCAAA4; */
    border-bottom: 2px solid $col-ans-border;
    border-top: 2px solid $col-ans-bg;
    font-size: 16px;
    min-height: $row-min-height;
    cursor: pointer;

    .icn {
      display: flex;
      flex: 0 0 60px;
      padding: 0 10px;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      .v-icon { cursor: pointer; }
    }
    .id {
      display: flex;
      flex: 0 0 60px;
      max-width: 80px;
      align-items: center;
      position: relative;
      .id-col {
        overflow: hidden;
      }
      .badge-identical {
        position: absolute;
        bottom: 0;
        font-size: 12px;
        white-space: nowrap;
        vertical-align: baseline;
        > span {
          display: inline-block;
          vertical-align: bottom;
          margin-bottom: 1px;
        }
        .v-icon {
          margin-bottom: 1px;
        }
      }
    }
    .additional {
      flex: 0 0 13%;
      max-width: 13%;
      display: flex;
      padding: 0 30px 0 15px;
      overflow: hidden;
      align-items: center;
      font-style: italic;
    }
    .text, {
      padding: 8px 0 8px 0;
      flex: 0 0 520px;
      max-width: 520px;
      overflow-wrap: break-word;
      word-wrap: break-word;
      -ms-word-break: break-all;
      word-break: break-word;
      -ms-hyphens: auto;
      -moz-hyphens: auto;
      -webkit-hyphens: auto;
      hyphens: auto;
      align-items: center;
      align-self: center;
      overflow-y: auto;

      > div {
        max-width: 100%;
        overflow: break-word;
      }
      .marking {
        background: var(--v-accent-lighten4);
      }
      /* The actual verbatim text */
      .verb {
        padding: 0 10px 0 25px;
      }
      .verb::selection, .verb > *::selection {
        background: var(--v-secondary-lighten4);
      }
    }
    .sentiment {
      display: flex;
      align-items: center;
      padding: 0 17px 0 8px;
      position: relative;
      .doughnut {
        width: 32px;
        height: 32px;
        border-radius: 32px;
        transform: rotate(45deg);
        border-style: solid;
        border-width: 8px;
        border-color: #DDD;
        margin-top: 2px;
        transition: border-color 0.25s ease-in-out;
        &.negH {
          border-bottom-color: rgba(255,82,82, 0.25);
          border-left-color: rgba(255,82,82, 0.25);
        }
        &.negF {
          border-color: rgba(255,82,82, 0.25);
        }
        &.posH {
          border-right-color: rgba(76, 175, 80, 0.25);
          border-top-color: rgba(76, 175, 80, 0.25);
        }
        &.posF {
          border-color: rgba(76, 175, 80, 0.25);
        }
      }

      .edit-menu {
        position: absolute;
        left: 0;
        top: 50%;
        width: 220px;
        margin-left: -86px;
        margin-top: -31px;
        z-index: 100;
        background-color: #FFF;
        padding: 10px;
        border-radius: 5px;
        box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);
        display: flex;
        justify-content: space-around;
        animation: fadeIn 0.3s ease-in-out;

        .opt {
          cursor: pointer;
          padding: 4px;
          border-radius: 3px;
          &:hover {
            background: #555;
          }
        }

        .selected {
          background: #E6E6E6;
        }
      }
    }
    .codes {
      flex: 1;
      font-size: 14px;
      margin-right: 1px;
      position: relative;
      display: flex;
      .selects {
        position: absolute;
        top: -2px;
        bottom: 0;
        height: auto;
        display: flex;
        width: 100%;
      }
    }

    .chips {
      margin-top: 2px;
      align-self: center;
    }

    .code-chip {
      opacity: 0.7;
    }
  }

  > li.focused {
    cursor: normal;
    background: $col-ans-focus-bg;
    border-top: 2px dashed $col-ans-focus-border;
    border-bottom: 2px dashed $col-ans-focus-border;
    cursor: default;
    color: $col-ans-focus-txt;

    .id {
      color: $col-ans-focused-id-txt;
    }
    .text {
      cursor: text;

      .translated {
        background: rgba(255, 255, 255, 0.7);
        border-radius: 5px;
        padding: 10px;
        margin: 10px 10px 0 15px;

        .tinfo {
          font-size: small;
          font-style: italic;
          text-align: right;
          margin: 0px 12px -8px 0;
          color: #9E9E9E;
          .helptip {
            position: absolute;
            font-style: normal;
            margin-left: 2px;
          }
        }

      }

      .marking {
        background: var(--v-accent-lighten1);
      }
    }

    .sentiment .doughnut {
      cursor: pointer;
      border-color: #BBB;
      /*box-shadow: 0px 0px 1px 0px rgba(0, 0, 0, 0.2);*/

      &.negH {
        border-bottom-color: #FF5252;
        border-left-color: #FF5252;
      }
      &.negF {
        border-color: #FF5252;
      }
      &.posH {
        border-right-color: #4CAF50;
        border-top-color: #4CAF50;
      }
      &.posF {
        border-color: #4CAF50;
      }
    }

    .code-chip { opacity: 1 }

    .icn:hover {
      .v-icon::before { content: "\F4D2"; /* mdi-star-outline */ }
    }
  }

  .code-select {
    flex: 1;
    .dropdown-toggle {
      /* min-height: ($row-min-height - 2); */
      background: $col-ans-select;
      min-height: 100%;
      height: auto;
      width: 100%;
      position: absolute;
      bottom: 0px;
      border-top: 2px dashed $col-ans-focus-border;
    }
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0!important
}

.pagination {
  height: 56px;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-end;
  border-top: 1px solid #e0e0e0;
  color: rgba(#000, .54);
  font-size: 12px;

  .jump-to {
    margin: 2px 35px 0 10px;
    font-size: inherit;
    width: 50px;
    input { padding-bottom: 2px }
  }

  .pagination-previous {
    margin-right: 2px;
    margin-left: 18px;
  }

  .v-select {
    width: 48px;
    min-width: 36px;
    margin: 0px 24px 0 32px;
    padding: 0;
    font-size: inherit;
    flex: 0;
    .v-select__selection { margin: 0 4px 0 0 }
    .v-select__selections input { padding: 0px }
    .v-input__append-inner { margin-top: 0 }
  }
}

.first-opt-italic .v-list > div:first-child { font-style: italic; }

.switch-with-helptip {
  display: flex;
  /* Workaround to give the first element a margin, the subsequent ones not */
  margin-top: 20px;
  & ~ .switch-with-helptip { margin-top: 0 }
  .beta-burst { position: relative; margin: 3px 0 0 15px }
  .v-input--switch { flex: 0 0 auto; margin-top: 5px }
  .helptip { flex: 0 0 auto; margin: 11px 0 0 10px }
}

.no-scroll {
  height: 100%;
  overflow: hidden;
}

</style>

<i18n src='@/i18n/pages/CodingFullyOpen.json'></i18n>
<i18n src='@/i18n/components/DownloadDialog.json'></i18n>
