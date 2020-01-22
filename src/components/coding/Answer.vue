<template>
  <li @click="clickAnswer"
      :class="{ 'focused': focused }" >
    <div class="icn" @click="maybeSelectText()">
      <v-icon class="mdi" :class="{ [answerIcon]: true }"/>
    </div>
    <div class="id">
      <div class="id-col">
        {{ (viewOptions.alternativeID === null ? answer.idx_continuous : answer.auxiliary_columns[viewOptions.alternativeID] ) }}
      </div>
      <div v-if="'identical_ids' in answer && answer.identical_ids.length && !isScrolling" class="badge-identical" >
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-icon size="13" v-on="on">mdi-content-copy</v-icon><span>&times;{{ answer.identical_ids.length }}</span>
          </template>
          <span v-html="$t('coding.grouped_helptip', { count: answer.identical_ids.length })" />
        </v-tooltip>
      </div>
    </div>
    <div class="additional" v-if="viewOptions.additionalColumn!==null">{{ answer.auxiliary_columns[viewOptions.additionalColumn] }}</div>
    <div class="text"
         @click="clearSelections"
         :style=" { 'max-height': focusMode ? codingTextContainerHeight + 'px' : 'none' }">
      <div data-private>
        <div v-if="!isScrolling" v-html="formattedText" @mouseup="maybeSelectText" class="verb" />
        <div v-else class="verb">{{ answer.text }}</div>
        <div v-if="(focusMode||question.show_translation)&&answer.translated" class="translated">
          <div class="ttext" v-if="focusMode">{{ answer.translated_text }}</div>
          <div class="tinfo" v-if="focused">
            {{ $t('translate.summary', { source: translateLanguages[answer.source_language] }) }}
            <helptip position="top" :dark="false" :width="800" :prevent-overflow="false">
              <div v-html="$t('translate.helptip', { source: translateLanguages[answer.source_language], target: translateLanguages[question.language], link: 'https://cloud.google.com/translate/docs/languages'})"/>
            </helptip>
          </div>
        </div>
      </div>
    </div>

    <div class="sentiment" v-if="question.show_sentiment" style="display: flex; align-items: center">
      <!-- If scrolling, only display a neutral doughnut, which is much faster to render than the tooltip doughnut -->
      <div class="doughnut neu" v-if="answer.sentiment!==null && isScrolling" />
      <v-tooltip bottom :disabled="!focused" v-if="!isScrolling">
        <template v-slot:activator="{ on }">
          <div class="doughnut"
               v-on="on"
               v-if="answer.sentiment!==null"
               @click="clickEditSentiment"
               :class="{ [sentimentClass]: true }" />
        </template>
        <span>{{ $t(`sentiment[${(answer.sentiment*2).toFixed(0)/2}]`) }}
          ({{ $t('sentiment.click_to_change') }})</span>
      </v-tooltip>
      <div class="edit-menu" v-if="focused && showEditSentiment && !isScrolling" v-c-click-outside="hideEditSentiment">
        <div class="opt" @click="setSentiment(-1)"
             :class="{ 'selected': (answer.sentiment*2).toFixed(0)/2 === -1.0 }">
          <div class="doughnut negF" />
        </div>
        <div class="opt" @click="setSentiment(-0.5)"
             :class="{ 'selected': (answer.sentiment*2).toFixed(0)/2 === -0.5 }">
          <div class="doughnut negH" />
        </div>
        <div class="opt" @click="setSentiment(0)"
             :class="{ 'selected': (answer.sentiment*2).toFixed(0)/2 === 0 }">
          <div class="doughnut neu" />
        </div>
        <div class="opt" @click="setSentiment(0.5)"
             :class="{ 'selected': (answer.sentiment*2).toFixed(0)/2 === 0.5 }">
          <div class="doughnut posH" />
        </div>
        <div class="opt" @click="setSentiment(1)"
             :class="{ 'selected': (answer.sentiment*2).toFixed(0)/2 === 1.0 }">
          <div class="doughnut posF" />
        </div>
      </div>
    </div>

    <div class="codes">
      <div class="selects" v-if="focused && !isScrolling && editable">
        <code-select v-model="answerCodes"
                     ref="codeSelect"
                     :codes-options="codesSorted"
                     :class="{ 'auto-assigned': !answer.reviewed }"
                     label="label"
                     identifier="id"
                     category="category"
                     :placeholder="$t('coding.select_placeholder')"
                     :max-height="codeSelectHeight + 'px'"
                     :sort-by-options="viewOptions.fixCodesDisplayOrder"
                     @addCode="addCode"
                     @removeCode="removeCode"
                     @resort="resortCodes"
                     @search:focus="$emit('maybeScrollToCodeSelect')"
                     james-integration
                     allow-new/>
      </div>
      <div class="chips" :class="{ 'auto-assigned': !answer.reviewed }" v-else>
        <code-chip v-for="codeId in (viewOptions.fixCodesDisplayOrder ? $_.sortBy(answerCodes, c => codeIdToIdxSorted[c]) : answerCodes)"
                   :key="codeId"
                   :color="$color.getMedium(codeIdToCatIdx[codeId])"
                   :category="codeIdToCat[codeId]">
          {{ codesSorted[codeIdToIdxSorted[codeId]].label }}
        </code-chip>
      </div>
    </div>
  </li>
</template>

<script>

import Vuex from 'vuex'
import JamesMixin from '@/mixins/james'
import CodeSelect from '@/components/CodeSelect'

export default {
  codit: true,
  name: 'Answer',
  components: {
    'code-select': CodeSelect
  },
  mixins: [JamesMixin],
  props: {
    answer: { type: Object, default: () => ({}) },
    focused: { type: Boolean, default: false },
    focusMode: { type: Boolean, default: false },
    isScrolling: { type: Boolean, default: false },
    viewOptions: { type: Object, default: () => ({}) },
    codeSelectHeight: { type: Number, default: 0 },
    codingTextContainerHeight: { type: Number, default: 0 }
  },

  data () {
    return {
      answerCodes: [], // the reactive proxy to answer.codes
      showEditSentiment: false
    }
  },

  computed: {
    formattedText: {
      cache: false,
      get () {
        let text = (this.answer.translated && this.question.show_translation && !this.focusMode ? this.answer.translated_text : this.answer.text)
        if (!this.answer.marking.length) return text
        else return `${text.slice(0, this.answer.marking[0])}<span class="marking" select-offset="${this.answer.marking[0]}">${text.slice(this.answer.marking[0], this.answer.marking[1])}</span><span select-offset="${this.answer.marking[1]}">${text.slice(this.answer.marking[1])}</span>`
      }
    },

    sentimentClass () {
      this.answerState // Dirty hack to make the computed property dependant on the answer state -> force update on change
      return {'-1': 'negF', '-0.5': 'negH', '0': 'neu', '0.5': 'posH', '1': 'posF'}[String((this.answer.sentiment * 2).toFixed(0) / 2)]
    },

    answerIcon: {
      cache: false,
      get () {
        if (this.answer.marking.length) return 'mdi-star'
        else if (this.answer.reviewed) return 'mdi-check'
        else return 'mdi-close'
      }
    },

    codeSelect: {
      cache: false,
      get () { return this.$refs.codeSelect }
    },

    ...Vuex.mapState({
      question: state => state.coding.question,
      codes: state => state.coding.codes,
      translateLanguages: 'translateLanguages',
      answerState: state => state.coding.storeState.answers,
      editable: state => state.coding.editable
    }),

    ...Vuex.mapGetters([
      'codesSorted',
      'codeCats',
      'codeIdToCat',
      'codeIdToCatIdx',
      'codeIdToIdxSorted'
    ])
  },

  watch: {
    focused (val) { if (!val) this.showEditSentiment = false },

    answer: 'updateAnswerCodes',

    'answer.marking' () {
      console.log('marking')
    },

    answerState () {
      this.updateAnswerCodes()
      this.$forceUpdate()
      if (this.codeSelect) {
        this.codeSelect.$forceUpdate()
      }
    }
  },

  beforeMount () { this.updateAnswerCodes() },

  created () {
    document.addEventListener('copy', this.copy)
  },

  destroyed () {
    document.removeEventListener('copy', this.copy)
  },

  methods: {
    copy (e) {
      if (!this.focused) return

      let val = ''
      let sel = window.getSelection().toString()
      // If a marking is made, copy the marking
      if (this.answer.marking.length === 2) val = this.answer.text.slice(this.answer.marking[0], this.answer.marking[1])
      else if (sel !== '') val = sel
      else val = this.answer.text

      e.clipboardData.setData('text/plain', val)
      e.preventDefault()
    },

    updateAnswerCodes () { this.answerCodes = [...this.answer.codes] },

    clickAnswer () {
      if (!this.focused) {
        this.$emit('focus')
        this.jamesInc('ans_focus_balance')
      }
    },

    addCode (codeID) {
      this.$store.dispatch('addCodeToAnswer', { answerID: this.answer.id, codeID })
      this.codeChanged()
    },

    removeCode (codeID) {
      this.$store.dispatch('removeCodeFromAnswer', { answerID: this.answer.id, codeID })
      this.codeChanged()
    },

    resortCodes (codes) {
      this.$store.dispatch('resortAnswerCodes', { answerID: this.answer.id, codes })
      this.codeChanged()
    },

    codeChanged () {
      this.setChanged()
      this.setReviewed()
    },

    setReviewed () {
      if (this.answer.reviewed) return
      this.$store.dispatch('setAnswerReviewed', { answerID: this.answer.id, reviewed: true })
      this.$emit('reviewed')
    },

    setChanged () {
      if (this.changedCurrent) return
      if (!this.answer.changed) this.$store.dispatch('setAnswerChanged', { answerID: this.answer.id, changed: true })
    },

    maybeSelectText (e) {
      if (!this.editable) return
      if (!this.focused) return
      if (e) e.stopPropagation()

      let sel = window.getSelection()
      let answerID = this.answer.id

      function getSelectionIdxFromSelectionPoint (point) {
        if (point !== 'anchor' && point !== 'focus') throw Error(`Invalid selection point ${point} given`)
        let markingOffset = Number(sel[`${point}Node`].parentElement.getAttribute('select-offset') || 0)
        let selectionOffset = sel[`${point}Offset`]
        return markingOffset + selectionOffset
      }

      if (!e) {
        // No event was passed, meaning it came from clicking the star icon
        // If there was a marking, remove it
        if (this.answer.marking.length) this.$store.dispatch('setAnswerMarking', { answerID, marking: [] })
        // If there was none, set the entire answer as marked
        else {
          this.$store.dispatch('setAnswerMarking', { answerID, marking: [0, this.answer.text.length] })
        }
      } else if (sel.anchorOffset === sel.focusOffset || sel.focusNode.className === 'verb') {
        if (sel.type === 'Range') {
          // If it's a range with anchro and focus the same, the entire string was selected
          this.$store.dispatch('setAnswerMarking', { answerID, marking: [0, this.answer.text.length] })
        } else {
          // If event was passed and no selection was made ("empty click"), clear entire selection
          this.$store.dispatch('setAnswerMarking', { answerID, marking: [] })
        }
      } else {
        // A selection was made

        let p1 = getSelectionIdxFromSelectionPoint('anchor')
        let p2 = getSelectionIdxFromSelectionPoint('focus')

        this.$store.dispatch('setAnswerMarking', { answerID, marking: [Math.min(p1, p2), Math.max(p1, p2)] })
      }
      // Remove any selection in the window, to make sure the user doesn't confuse the selections with the saved markings
      this.clearSelections()
    },

    clearSelections () {
      if (!this.editable) return
      window.getSelection().removeAllRanges()
    },

    clickEditSentiment ($e) {
      if (!this.editable) return
      if (this.focused) {
        this.showEditSentiment = true
        $e.stopPropagation()
      }
    },

    hideEditSentiment () { this.showEditSentiment = false },

    setSentiment (sentiment) {
      this.$store.dispatch('setAnswerSentiment', { answerID: this.answer.id, sentiment })
      this.showEditSentiment = false
    },

    incSentiment () {
      if (!this.editable) return
      let nexSentimentVal = Math.min(((this.answer.sentiment || 0) * 2).toFixed(0) / 2 + 0.5, 1)
      this.setSentiment(nexSentimentVal)
    },

    decSentiment () {
      if (!this.editable) return
      let nexSentimentVal = Math.max(((this.answer.sentiment || 0) * 2).toFixed(0) / 2 - 0.5, -1)
      this.setSentiment(nexSentimentVal)
    }
  }
}

</script>

<i18n src='@/i18n/pages/CodingFullyOpen.json'></i18n>
