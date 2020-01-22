<template>
  <div id="james" :class="{'in-focus-mode': focusMode }">
    <div id="avatar"><img src="../../assets/james.png" width="30" height="30" ></div>
    <v-btn icon small class="button-scroll" id="button-scroll-up" @click="scrollfromBottom+=20">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
    <v-btn icon small class="button-scroll" id="button-scroll-down"
           @click="scrollfromBottom=Math.max(scrollfromBottom-20, 0)">
      <v-icon>mdi-chevron-down</v-icon>
    </v-btn>

    <div id="content-container">
      <div id="fade-out"/>
      <div id="message-log" :style="{ bottom: -scrollfromBottom + 'px' }">
        <div v-if="oldRemoved" class="msg" key="oldRemoved"><span class="text">{{ $t('old_removed') }}</span></div>
        <div class="msg" v-for="(msg, idx) in oldMessages" :key="idx">
          <span class="text"><span class="typed" v-html="msg.text"/></span>
        </div>

        <div class="msg" v-if="isSaying" id="new-message" key="newMessage">
          <span class="text" ref="newMsgText"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Typed from 'typed.js'
import Vuex from 'vuex'

import JamesMixin from '@/mixins/james'

import { JAMES_FOCUS_MSG_INTERVAL } from '@/settings/coding.js'
import { QUESTION_CATEGORY_LIST } from '@/settings/constants'

let MAX_MESSAGES = 5

export default {
  codit: true,
  name: 'James',
  mixins: [ JamesMixin ],
  data () {
    return {
      // FIFO queue of messages that are still to be said, will be outputted once current "speach" is completed
      queuedMessages: [],

      // FIFO archive of old messages
      oldMessages: [],

      // If a new message is currently being written
      isSaying: false,

      // The Typed.js object
      typed: null,

      // Number of pixels the message box is scrolled from bottom
      scrollfromBottom: 0,

      // If any old messages have already been removed
      oldRemoved: false,

      // If James has actually already been destroyed, to prevent some dangling function calls into nirvana
      isDestroyed: false,

      // If anything has been said yet about training
      saidTrainingCompletedMessage: false,

      // A buffer for the last training message which hasn't been said yet
      trainingMessageBuffer: null,

      // Interval in which to print training messages during focus mode
      trainingMessagesInterval: null,

      // Last training
      lastPredictionReport: ''
    }
  },

  computed: {
    name () { return this.$root.user.first_name },
    ...Vuex.mapState({
      question: state => state.coding.question,
      codes: state => state.coding.codes,
      stats: state => state.coding.stats,
      counters: state => state.coding.james.counters,
      focusMode: state => state.coding.focusMode
    }),
    ...Vuex.mapGetters(['questionTrainingCompleted', 'nextRetrainThresh']),
    ntrainings () {
      return this.question.ntrainings_svm + this.question.ntrainings_bert
    }
  },

  watch: {
    'question.model.active_learning' (val, old) {
      if (val && !old) this.say(this.$t('model_results.active_learning'), 'info')
    },
    'counters.ans_focus_balance' (val) {
      if (val < -3) this.jamesInc('ans_focus_balance')
      else if (val > 3) {
        this.say(this.$t('keyboard.ans_focus'), 'tip')
        this.jamesReset('ans_focus_balance')
      }
    },

    'counters.code_delete_balance' (val) {
      if (val < -3) this.jamesInc('code_delete_balance')
      else if (val > 3) {
        this.say(this.$t('keyboard.code_delete'), 'tip')
        this.jamesReset('code_delete_balance')
      }
    },

    'counters.code_select_balance' (val) {
      if (val < -3) this.jamesInc('code_select_balance')
      else if (val > 3) {
        this.say(this.$t('keyboard.code_select'), 'tip')
        this.jamesReset('code_select_balance')
      }
    },

    'counters.code_add_balance' (val) {
      if (val < -3) this.jamesInc('code_add_balance')
      else if (val > 3) {
        this.say(this.$t('keyboard.code_add'), 'tip')
        this.jamesReset('code_add_balance')
      }
    },

    'ntrainings' () {
      let _nPhraseOptions = 5
      let message = this.$t(`new_preds[${this._randIdx(_nPhraseOptions)}]`, {
        nPredicted: this.stats.nPredicted
      })
      let predictionReport = this.getPredictionReport()

      // Don't reiterate the same report over and over again
      if (predictionReport === this.lastPredictionReport) return
      message += this.$t(predictionReport)
      this.lastPredictionReport = predictionReport

      if (!this.focusMode) this.say(message)
      else {
        if (!this.saidTrainingCompletedMessage) {
          // If this is the first message print it and restart the interval
          this.say(message)
          this.startTrainingMessageInterval()
          // Otherwise set the buffer to the current message, possibly overwriting old ones
        } else this.trainingMessageBuffer = message
      }
      this.saidTrainingCompletedMessage = true
    },

    focusMode (isOn) {
      if (isOn) this.startTrainingMessageInterval()
      else {
        this.flushTrainingMessages()
        this.clearTrainingMessageInterval()
      }
    }
  },

  created () {
    if (!this.$ls.get('james-introduced', false)) {
      setTimeout(() => {
        this.say(this.$t('introduction', { name: this.name }))
      }, 1000)
      this.$ls.set('james-introduced', true)
    }

    setTimeout(() => {
      if (this.isDestroyed) return
      let msg = ''
      if (this.stats.nreviewed === this.question.nanswers) msg += this.$t('reviewed.all')
      else if ('codebook_generator_list' in this.question.model) msg += this.$t('autocoder.generated')
      else if (this.question.question_category === QUESTION_CATEGORY_LIST) msg += this.$t('autocoder.fresh')
      else {
        if (this.stats.nreviewed > 0) {
          msg += this.$t('reviewed.partial', {
            reviewed: this.stats.nreviewed,
            total: this.question.nanswers
          })
        } else msg += this.$t('reviewed.none')

        if (!this.questionTrainingCompleted && this.question.inherits_from === null && this.nextRetrainThresh < this.stats.nanswers_unique) {
          let nToCode = this.nextRetrainThresh - this.stats.nreviewed_unique
          msg += this.$t('preds_state.not_enough_annotated', { ncodes: nToCode })
        } else if (!this.questionTrainingCompleted && this.question.inherits_from !== null && this.question.is_training_bert) {
          msg += this.$t('preds_state.predicting_from_inherited', { inherits_from_name: this.question.inherits_from_name })
        } else if (!this.questionTrainingCompleted && this.question.is_training_bert) {
          msg += this.$t('preds_state.predicting')
        } else if (this.questionTrainingCompleted) {
          msg += this.$t('preds_state.trained') + this.$t(this.getPredictionReport())
          this.saidTrainingCompletedMessage = true
        }
      }
      this.say(msg)
    }, 2000)

    // Register the say function on the store
    this.$store.commit('setJamesSay', this.say)
  },

  destroyed () {
    this.clearTrainingMessageInterval()
    this.isDestroyed = true
  },

  methods: {
    say (text, type = 'info', i18n = false) {
      if (i18n) text = this.$t(text)
      if (this.isDestroyed) return
      // Check that no other typing is in progress, otherwise queue message
      if (this.isSaying) {
        this.queuedMessages.push({ text: text, type: type })
        return
      }
      this.isSaying = true
      this.scrollfromBottom = 0
      this.$nextTick(() => {
        this.typed = new Typed('#new-message .text', {
          strings: [`<span class="typed">${text}</span><span class="label ${type}">${this.$t(`labels.${type}`)}</span>`],
          typeSpeed: 10,
          onComplete: () => {
            // Still wait a little to do this, let it blink for a short time to get attention of user
            setTimeout(() => { this.typedCompleted(type) }, 1000)
          }
        })
      })
    },

    typedCompleted (type) {
      if (this.isDestroyed) return
      this.oldMessages.push({ text: this.$refs.newMsgText.innerHTML, type: type })
      this.typed = null
      this.isSaying = false

      // Check that the stack of old messages is not growing too big
      if (this.oldMessages.length > MAX_MESSAGES) {
        this.oldMessages.splice(0, 1)
        this.oldRemoved = true
      }
      // See if there is something in the queue to say
      if (this.queuedMessages.length) {
        let {text, type} = this.queuedMessages.splice(0, 1)[0]
        this.$nextTick(() => { this.say(text, type) })
      }
    },

    getPredictionReport () {
      const score = Math.max(this.question.model.score_remaining, this.question.model.score)
      if (score < 0.5) {
        return 'model_results.lower50'
      } else if (score < 0.6) {
        return 'model_results.lower60'
      } else if (score < 0.7) {
        return 'model_results.lower70'
      } else if (score < 0.8) {
        return 'model_results.lower80'
      } else if (score < 0.9) {
        return 'model_results.lower90'
      } else {
        return 'model_results.higher90'
      }
    },

    clearTrainingMessageInterval () {
      if (this.trainingMessagesInterval !== null) {
        clearInterval(this.trainingMessagesInterval)
        this.trainingMessagesInterval = null
      }
    },

    startTrainingMessageInterval () {
      // First clear the existing interval
      this.clearTrainingMessageInterval()
      this.trainingMessagesInterval = setInterval(this.flushTrainingMessages, JAMES_FOCUS_MSG_INTERVAL * 1000)
    },

    flushTrainingMessages () {
      if (this.trainingMessageBuffer !== null) {
        this.say(this.trainingMessageBuffer)
        this.trainingMessageBuffer = null
      }
    },

    _randIdx (len) {
      return Math.floor(Math.random() * len)
    }
  }
}

</script>

<style lang=scss>

#james {
  flex: 1;
  position: relative;
  border: 2px dotted #CCC;
  border-radius: 10px;
  padding: 20px 45px 10px 12px;
  margin: 4px 0px 0 0;
  background-color: #FFF;
  transition: all 0.4s ease-in-out;
  height: 127px;
  font-size: 14px;

  &.in-focus-mode {
    transform: translateY(15px);
    border: 2px solid #FFF;
    z-index: 50;
    background: #EEE;
    &:before {
      background: linear-gradient(135deg, #999 6px, transparent 0), linear-gradient(-135deg, #999 6px, transparent 0);
      background-position: left top;
      background-repeat: repeat-x;
      background-size: 12px 12px;
    }

    #avatar {
      background: #EEE;
    }

    #fade-out {
      background: linear-gradient(to top, rgba(238,238,238,0) 0%,rgba(238,238,238,1) 100%)!important;
    }
  }

  &:before {
    background: linear-gradient(135deg, #666 6px, transparent 0), linear-gradient(-135deg, #666 6px, transparent 0);
    background-position: left top;
    background-repeat: repeat-x;
    background-size: 12px 12px;
    content: " ";
    display: block;
    position: absolute;
    top: -2px;
    padding: 0 2px;
    left: -2px;
    width: calc(100% + 4px);
    height: 32px;
    border-radius: 10px;
  }

  #avatar {
    position: absolute;
    left: 12px;
    top: -12px;
    background: #FFF;
    padding: 0px 2px;
    margin-top: -2px;
    border-radius: 19px;
    width: 34px;
    height: 34px;
    line-height: 32px;
  }

  .button-scroll {
    position: absolute;
    right: 3px;
    &#button-scroll-up { top: 18px; }
    &#button-scroll-down { bottom: 10px; }
  }

  #content-container {
    position: relative;
    height: 100%;
    width: 100%;
    overflow: hidden;

    #fade-out {
      position: absolute;
      top: 0;
      left: 0;
      height: 30px;
      width: 100%;
      z-index: 1;
      background: linear-gradient(to top, rgba(255,255,255,0) 0%,rgba(255,255,255,1) 100%);
    }

    #message-log {
      position: absolute;
      height: auto;
      width: 100%;
      overflow-y: auto;
    }
  }

  .msg {
    margin: 7px 0 0 10px;
    position: relative;
    font-family: "Consolas", "Courier New", "Courier";
    line-height: 21px;
    &:before {
      position: absolute;
      left: -12px;
      top: 0px;
      content: '> ';
      font-weight: 600;
    }

    .text {
    }

    .v-icon {
      font-size: 14px!important;
      margin: -1px 0 0 0;
      padding: 0;
    }

    .label {
      border-radius: 3px;
      margin: 0 2px;
      padding: 2px 4px;
      font-family: Roboto,Noto Sans,-apple-system,BlinkMacSystemFont,sans-serif;
      color: #FFF;
      font-size: 12px;
      font-weight: 500;
      background: #999;
      line-height: 19px;

      &.info { background-color: #4CAF50!important; margin: 0 7px; }
      &.tip { background-color: #FFC107!important; margin: 0 7px; }
    }
  }
}

#james {
 .typed-cursor {
  position: absolute;
  opacity: 1;
    animation: blink .7s infinite;
  }

  @keyframes blink {
    0% {
        opacity: 1;
    }
    50% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
  }
}

</style>

<i18n src="@/i18n/components/James.json" />
