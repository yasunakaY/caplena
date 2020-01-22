'use strict'

import Vue from 'vue'
import { MIN_TRAIN_ANSWERS, MIN_PREDICTION_ACCURACY } from '../settings/coding.js'
import { TRAINING_TIME_ESTIMATOR_BERT, QUESTION_CATEGORY_LIST } from '@/settings/constants'

let _getAnsWeight = ans => 1 + ('identical_ids' in ans ? ans.identical_ids.length : 0)

const touchAnsState = (state) => { state.storeState.answers += 1 }
const touchSortState = (state) => { state.storeState.sorting += 1 }

const REVIEWED_PREDICTION_THRESH = [20, 50, 100, 150, 200, 250, 300, 450, 600, 800]

export default {
  strict: process.env.NODE_ENV !== 'production',
  state () {
    return {

      storeState: {
        answers: 0,
        sorting: 0
      },

      // Loading
      loaded: false,

      editable: true,

      // DB data
      question: {
        id: -1,
        name: '',
        description: '',
        language: '',
        owner: '',
        owner_id: -1,
        created: '',
        last_modified: '',
        training_completed_svm: '',
        training_completed_bert: '',
        training_requested_svm: '',
        training_requested_bert: '',
        ntrainings_svm: 0,
        ntrainings_bert: 0,
        nanswers: 0,
        is_training_svm: false,
        is_training_bert: false,
        completed: false,
        inherits_from: null,
        inherits_from_name: null,
        translated: 0,
        model: { score: 0, score_remaining: 0, score_per_code: [], active_learning: false },
        auxiliary_column_names: [],
        group_identical: false,
        group_identical_exclude: '',
        show_sentiment: true,
        show_translation: false,
        smart_sort: false,
        model_certainty_thresh: 50,
        credits_open: 0,
        no_training: false,
        question_category: '',
        project: -1,
        project_name: '',
        permissions: {}
      },

      answers: [],
      groupedAnswerIDs: {},
      codes: [],

      answerID2Idx: {},
      answerIdx2SortedIdx: {},

      // UI
      focusMode: false,
      dialogIsOpen: false,

      // Function reference to James.say
      james: {
        say: null,
        counters: {}
      },

      // Stats
      stats: {
        nanswers_unique: 0,
        nchanged: 0,
        nreviewed: 0,
        nreviewed_unique: 0,
        nnocodes: 0,
        nnocodes_unique: 0,
        codeCounts: {},
        codeCatCounts: {},
        nPredicted: 0,
        lastTrainedAtNreviewed: -1,
        trainingRequestedTime: null,
        trainingCompletedETA: null
      },
      predictionsCachedReady: false,

      // Saving
      lastSaved: null,
      unsavedAnswers: [],
      savingError: {
        cntAnswers: 0,
        cntCodes: 0,
        authenticationError: false,
        networkError: false
      },

      usersOnline: [],

      sessionIssue: {
        show: false,
        type: null
      },

      // New code trigger
      newCode: {
        cb: null,
        name: ''
      }
    }
  },

  /**
  * Mutations only accept the objects to be modified, no indexes or IDs (except when removing, then the idx may be provided)
  */
  mutations: {
    isLoaded: state => { state.loaded = true },
    reloading: state => { state.loaded = false },

    /** =========== Initial Setters =========== **/
    isNotEditable: state => { state.editable = false },
    isEditable: state => { state.editable = true },
    /** =========== Initial Setters =========== **/
    hasSessionIssue: (state, type) => {
      state.sessionIssue.type = type
      state.sessionIssue.show = true
    },

    setUsersOnline: (state, usersOnline) => {
      Vue.set(state, 'usersOnline', usersOnline)
    },

    setQuestion (state, question) {
      // Set all key in question object that are already defined on this data obj
      _.each(state.question, (val, key) => { Vue.set(state.question, key, question[key]) })
      Vue.set(state, 'codes', question.codebook)
    },

    setAnswers (state, answers) {
      state.stats.nchanged = 0
      state.stats.nreviewed = state.stats.nreviewed_unique = 0
      state.stats.nnocodes = state.stats.nnocodes_unique = 0

      const MUTABLE_PROPS = new Set(['codes', 'idx_sorted', 'marking', 'reviewed', 'changed', 'sentiment_changed', 'sentiment'])

      let makeImmutable = ans => {
        // Get properties
        let propNames = Object.getOwnPropertyNames(ans)

        // Set properties to non-writable which are not explicitely allowed
        for (let name of propNames) {
          // if (!MUTABLE_PROPS.has(name)) console.log(name)
          if (!MUTABLE_PROPS.has(name)) {
            Object.defineProperty(ans, name, { writable: false, configurable: false })
          }
        }
        Object.seal(ans)
      }

      let answerID2Idx = {}
      answers.forEach((ans, idx) => {
        let _ansWeight = _getAnsWeight(ans)
        state.stats.nchanged += Number(ans.changed) * _ansWeight
        state.stats.nreviewed += Number(ans.reviewed) * _ansWeight
        state.stats.nreviewed_unique += Number(ans.reviewed)
        state.stats.nnocodes += Number(!ans.codes.length) * _ansWeight
        state.stats.nnocodes_unique += Number(!ans.codes.length)

        ans.translated = state.question.translated > 0 && ans.translated_text && ans.source_language !== state.question.language

        answerID2Idx[ans.id] = idx
        if ('identical_ids' in ans) ans.identical_ids.forEach(identID => { state.groupedAnswerIDs[identID] = ans })

        makeImmutable(ans)
      })

      if (state.stats.lastTrainedAtNreviewed === -1) {
        // Set the last threshold crossed to the current number of reviewed responses
        state.stats.lastTrainedAtNreviewed = state.stats.nreviewed_unique
      }

      state.stats.nanswers_unique = answers.length

      Vue.set(state, 'answers', answers)
      Vue.set(state, 'answerID2Idx', answerID2Idx)
      touchAnsState(state)
    },
    /** =========== Cross Component communication =========== **/

    triggerNewCode: (state, { name, cb }) => {
      if (typeof cb !== 'function') throw new Error('Received invalid new code callback object.')
      state.newCode.cb = cb
      state.newCode.name = name
    },

    resetNewCodeTrigger: (state) => {
      state.newCode.cb = null
      state.newCode.name = ''
    },

    setJamesSay (state, say) { state.james.say = say },

    jamesReset (state, key) { Vue.set(state.james.counters, key, 0) },

    jamesIncrement (state, key) {
      if (!(key in state.james.counters)) Vue.set(state.james.counters, key, 1)
      else state.james.counters[key] += 1
    },

    jamesDecrement (state, key) {
      if (!(key in state.james.counters)) Vue.set(state.james.counters, key, -1)
      else state.james.counters[key] += -1
    },

    startedTraining: state => { state.isTraining = true },
    completedTraining: state => { state.isTraining = false },

    focusModeOn: state => { state.focusMode = true },
    focusModeOff: state => { state.focusMode = false },

    /** =========== SURVEY Modifiers =========== **/
    setQuestionGroupIdentical (state, { groupIdentical }) {
      state.question.group_identical = groupIdentical
    },

    setQuestionGroupIdenticalExclude (state, { groupIdenticalExclude }) {
      state.question.group_identical_exclude = groupIdenticalExclude
    },

    setQuestionShowSentiment (state, { showSentiment }) {
      state.question.show_sentiment = showSentiment
    },

    setQuestionShowTranslation (state, { showTranslation }) {
      state.question.show_translation = showTranslation
    },

    setQuestionSmartSort (state, { smartSort }) {
      state.question.smart_sort = smartSort
    },

    setQuestionModelCertaintyThresh (state, { modelCertaintyThresh }) {
      state.question.model_certainty_thresh = modelCertaintyThresh
    },

    setQuestionModel (state, { model }) {
      Vue.set(state.question, 'model', model)
    },

    setQuestionBilled: state => { state.question.credits_open = 0 },

    /** =========== CODE Modifiers =========== **/
    setCodes: (state, codes) => Vue.set(state, 'codes', codes),
    addCode: (state, code) => state.codes.push(code),
    modifyCode: (state, { code, newAttributes }) => {
      _.each(newAttributes, (val, key) => {
        Vue.set(code, key, newAttributes[key])
      })
    },
    deleteCode: (state, { codeIdx }) => state.codes.splice(codeIdx, 1),
    setCodeCounts: (state, { counts, catCounts }) => {
      Vue.set(state.stats, 'codeCounts', counts)
      Vue.set(state.stats, 'codeCatCounts', catCounts)
    },

    savingCodesError: (state, status) => {
      // Saving fail
      state.savingError.networkError = !status
      state.savingError.authenticationError = (status === 401 || status === 403)
      state.savingError.cntCodes += 1
    },

    clearSavingCodesError: state => { state.savingError.cntCodes = 0 },

    /** =========== ANSWER Modifiers =========== **/

    answersStateChanged: (state) => touchAnsState(state),

    addCodeToAnswer: (state, { answer, codeID }) => { answer.codes.push(codeID); touchAnsState(state) },
    removeCodeFromAnswer: (state, { answer, codeIdx }) => { answer.codes.splice(codeIdx, 1); touchAnsState(state) },
    replaceCodeInAnswer: (state, { answer, codeIdx, newCode }) => { answer.codes.splice(codeIdx, 1, newCode); touchAnsState(state) },
    setAnswerCodes: (state, { answer, codes }) => { Vue.set(answer, 'codes', codes); touchAnsState(state) },
    setAnswerProps: (state, { answer, props }) => {
      _.each(props, (v, k) => Vue.set(answer, k, v))
      touchAnsState(state)
      if ('idx_sorted' in props) touchSortState(state)
    },
    setAnswerIdxSorted: (state, { answer, idxSorted }) => { Vue.set(answer, 'idx_sorted', idxSorted); touchSortState(state) },

    setAnswerMarking: (state, { answer, marking }) => { Vue.set(answer, 'marking', marking); touchAnsState(state) },
    setAnswerSentiment: (state, { answer, sentiment }) => {
      answer.sentiment = sentiment
      answer.sentiment_changed = true
      touchAnsState(state)
    },
    setAnswerChanged: (state, { answer, changed }) => {
      if (answer.changed === changed) return
      state.stats.nchanged += (answer.changed ? -1 : 1) * _getAnsWeight(answer)
      answer.changed = changed
    },
    setAnswerReviewed: (state, { answer, reviewed }) => {
      if (answer.reviewed === reviewed) return
      state.stats.nreviewed += (answer.reviewed ? -1 : 1) * _getAnsWeight(answer)
      state.stats.nreviewed_unique += (answer.reviewed ? -1 : 1)
      answer.reviewed = reviewed
      touchAnsState(state)
    },
    addToUnsaved: (state, { answer }) => {
      if (state.unsavedAnswers.indexOf(answer) === -1) state.unsavedAnswers.push(answer)
    },
    clearUnsaved: (state) => state.unsavedAnswers.splice(0),

    savingAnswerError: (state, status) => {
      // Saving fail
      state.savingError.networkError = !status
      state.savingError.authenticationError = (status === 401 || status === 403)
      state.savingError.cntAnswers += 1
    },

    clearSavingAnswersError: state => { state.savingError.cntAnswers = 0 },

    /** =========== STATS Modifiers =========== **/
    modifyCodeCountBy: (state, { codeID, by }) => {
      state.stats.codeCounts[codeID] += by
    },

    modifyCodeCatCountBy: (state, { cat, by }) => { state.stats.codeCatCounts[cat] += by },

    decrementNoCodeCount: (state, { by }) => {
      // This mutation is expected to be called for *one* answer
      state.stats.nnocodes -= by
      state.stats.nnocodes_unique -= 1
    },

    incrementNoCodeCount: (state, { by }) => {
      // This mutation is expected to be called for *one* answer
      state.stats.nnocodes += by
      state.stats.nnocodes_unique += 1
    },

    setPredictedMeta: (state, { trainingCompletedSVM, trainingCompletedBERT, nTrainingsSVM, nTrainingsBERT, modelMeta, nPredicted }) => {
      state.question.training_completed_svm = trainingCompletedSVM
      state.question.training_completed_bert = trainingCompletedBERT
      state.question.ntrainings_svm = nTrainingsSVM
      state.question.ntrainings_bert = nTrainingsBERT
      state.stats.nPredicted = nPredicted
      Vue.set(state.question, 'model', modelMeta)
    },

    setStats: (state, { nreviewed, nreviewedUnique, nchanged, nnocodes, nnocodesUnique }) => {
      state.stats.nchanged = nchanged
      state.stats.nreviewed = nreviewed
      state.stats.nreviewed_unique = nreviewedUnique
      state.stats.nnocodes = nnocodes
      state.stats.nnocodes_unique = nnocodesUnique
    },

    predictionsCachedReady: (state) => { state.predictionsCachedReady = true },

    setLastSaved: (state, val) => { state.lastSaved = val },

    updateLastTrainedNReviewed: (state) => { state.stats.lastTrainedAtNreviewed = state.stats.nreviewed_unique },
    setTrainingRequestedTime: (state, val) => {
      state.stats.trainingRequestedTime = val
      if (val !== null) {
        let expectedDuration = TRAINING_TIME_ESTIMATOR_BERT(state.answers.length, state.codes.length)
        state.stats.trainingCompletedETA = moment(state.stats.trainingRequestedTime).add(expectedDuration, 'seconds')
      } else state.stats.trainingCompletedETA = null
    },

    /** =========== UI Modifiers =========== **/
    dialogOpened: (state) => { state.dialogIsOpen = true },
    dialogClosed: (state) => { state.dialogIsOpen = false }
  },

  getters: {
    // object with code categories as keys and list of respective codes as values
    codesByCat: (state, getters) => _.groupBy(state.codes, 'category'),

    // Make sure the codes are sorted by category, after first appearance
    codesSorted: (state, getters) => _.flatMap(getters.codesByCat),

    // list of code categories
    codeCats: (state, getters) => _.keys(getters.codesByCat),

    codeIdToCat: (state, getters) => {
      // mapping of code ids to code categories (strings)
      let idToCat = {}
      state.codes.forEach(code => { idToCat[code.id] = code.category })
      return idToCat
    },
    codeIdToCatIdx: (state, getters) => {
      let idToCatIdx = {}
      _.forEach(getters.codeIdToCat, (val, key) => {
        idToCatIdx[key] = getters.codeCats.indexOf(val)
      })
      return idToCatIdx
    },
    codeIdToIdx: (state, getters) => {
      // mapping of code ids to code indexes (in codes)
      let idToIdx = {}
      state.codes.forEach((code, codeIdx) => { idToIdx[code.id] = codeIdx })
      return idToIdx
    },
    codeIdToIdxSorted: (state, getters) => {
      // mapping of code ids to code indexes (in codes)
      let idToIdx = {}
      getters.codesSorted.forEach((code, codeIdx) => { idToIdx[code.id] = codeIdx })
      return idToIdx
    },
    nCodesTotal: (state, getters) => {
      // count total number of annotations in question
      let cnt = 0
      _.each(state.stats.codeCounts, (codeCnt) => { cnt += codeCnt })
      return cnt
    },
    nAnswersInList: state => state.answers.length,

    answerByID: (state, getters) => id => {
      if (!(id in state.answerID2Idx)) throw new Error(`Invalid answer ID ${id} provided`)
      else return state.answers[state.answerID2Idx[id]]
    },

    codeByID: (state, getters) => id => {
      if (!(id in getters.codeIdToIdx)) throw new Error(`Invalid code ID ${id} provided`)
      else return state.codes[getters.codeIdToIdx[id]]
    },

    questionTrainingCompleted: (state) => state.question.training_completed_svm !== null || state.question.training_completed_bert !== null,

    prevRetrainThresh: (state, getters) => {
      // Find the previous threshold where predictions were requested
      let nextThreshold = getters.nextRetrainThresh
      let nextThresholdIdx = REVIEWED_PREDICTION_THRESH.indexOf(nextThreshold)

      // If the exact number doesn't exist in the REVIEWED_PREDICTION_THRESH arr
      // this means that we are above the maximum defined there already
      if (nextThresholdIdx === -1) return nextThreshold - 250
      // If it is the first index, the previous threshold would've been zero
      else if (nextThresholdIdx === 0) return 0
      else return REVIEWED_PREDICTION_THRESH[nextThresholdIdx - 1]
    },

    nextRetrainThresh: (state, getters) => {
      // Find the next threshold where predictions are requested
      let nextThreshold = _.filter(REVIEWED_PREDICTION_THRESH, v => v > state.stats.lastTrainedAtNreviewed && v >= MIN_TRAIN_ANSWERS)[0]
      // If it's above the max value defined in REQ_PRED_THRESH, it's the next multiple of 250
      nextThreshold = (nextThreshold === undefined ? (Math.floor(state.stats.lastTrainedAtNreviewed / 250) + 1) * 250 : nextThreshold)

      return nextThreshold
    },

    isListQuestion: (state) => state.question.question_category === QUESTION_CATEGORY_LIST
  },

  actions: {
    /** =========== SURVEY actions =========== **/
    billQuestion ({ commit, state, getters, dispatch }) {
      // If there are unbilled answers, bill them, otherwise do nothing
      if (!state.question.credits_open) return
      // It doesn't matter if the download is called first or the billing api call, both ways should work
      api.post(`/api/questions/${state.question.id}/bill`).then((res) => {
        if (res.data.success) {
          // If successfull, the balance of this question is now zero
          commit('setQuestionBilled')
          // Update the account balance
          let profile = {
            credits_remaining_monthly: res.data.profile.credits_remaining_monthly,
            credits_remaining_oneoff: res.data.profile.credits_remaining_oneoff
          }
          dispatch('updateUser', { profile, dontPatch: true })
        } else setTimeout(() => { throw res })
      }).catch(err => this._vm.$maybeRaiseAPIPromiseErr(err))
    },

    saveQuestionProps ({ commit, state, getters, dispatch }, props) {
      _.each(props, (v, k) => commit(`setQuestion${_.upperFirst(k)}`, { [k]: v }))
      return api.patch('/api/questions/' + state.question.id, _.mapKeys(props, (v, k) => _.snakeCase(k)))
    },

    saveQuestionModelCertaintyThresh ({ commit, state, getters, dispatch }, { modelCertaintyThresh }) {
      commit('setQuestionModelCertaintyThresh', { modelCertaintyThresh })
    },

    saveQuestionModelProps ({ commit, state, getters, dispatch }, props) {
      let model = _.clone(state.question.model)
      _.each(props, (v, k) => { model[k] = v })
      dispatch('saveQuestionProps', { model })
    },

    /** =========== ANSWER Actions =========== **/
    loadAnswers ({ commit, state, getters, dispatch }, questionID) {
      return api.get('/api/questions/' + questionID + '/answers')
    },

    addCodeToAnswer ({ commit, state, getters, dispatch }, { answerID, codeID }) {
      let answer = getters.answerByID(answerID)
      let _ansWeight = _getAnsWeight(answer)

      // If there were no codes before, substract this answer from the no codes count
      if (!answer.codes.length) commit('decrementNoCodeCount', { by: _ansWeight })
      commit('addCodeToAnswer', { answer, codeID })
      commit('addToUnsaved', { answer })
      dispatch('modifyCodeCountBy', { answer, codeID, by: 1 * _ansWeight })
    },

    setAnswersCodesIfNotReviewed ({ commit, state, getters, dispatch }, answerList) {
      answerList.forEach(({ id, codes }) => { // eslint-disable-line camelcase
        let answer = getters.answerByID(id)
        if (!answer.reviewed) {
          commit('setAnswerProps', { answer, props: { codes } })
          commit('addToUnsaved', { answer })
        }
      })
      dispatch('countCodes')
    },

    setAnswersCodesSortedIdxReviewed ({ commit, state, getters, dispatch }, answerList) {
      answerList.forEach(({ id, codes, idx_sorted, reviewed }) => { // eslint-disable-line camelcase
        let answer = getters.answerByID(id)
        commit('setAnswerProps', { answer, props: { codes, idx_sorted, reviewed } })
        commit('addToUnsaved', { answer })
      })
      dispatch('countCodes')
    },

    setAnswerProps ({ commit, state, getters, dispatch }, answerList) {
      answerList.forEach(({ id, ...props }) => {
        let answer = getters.answerByID(id)
        commit('setAnswerProps', { answer, props })
        commit('addToUnsaved', { answer })
      })
      dispatch('countCodes')
    },

    removeCodeFromAnswer ({ commit, state, getters, dispatch }, { answerID, codeID }) {
      let answer = getters.answerByID(answerID)
      let codeIdx = answer.codes.indexOf(codeID)
      let _ansWeight = _getAnsWeight(answer)

      // If there was only one code, we now have one more rows with no codes
      if (answer.codes.length === 1) commit('incrementNoCodeCount', { by: _ansWeight })
      // Remove the code from the answer
      commit('removeCodeFromAnswer', { answer, codeIdx })
      commit('addToUnsaved', { answer })
      dispatch('modifyCodeCountBy', { answer, codeID, by: -1 * _ansWeight })
    },

    resortAnswerCodes ({ commit, state, getters, dispatch }, { answerID, codes }) {
      let answer = getters.answerByID(answerID)
      commit('setAnswerCodes', { answer, codes })
      commit('addToUnsaved', { answer })
    },

    modifyCodeCountBy ({ commit, state, getters, dispatch }, { answer, codeID, by }) {
      let cat = getters.codeIdToCat[codeID]
      // Do the mutation on the code counts
      commit('modifyCodeCountBy', { codeID, by })

      // Check if we need to change code category counts as well
      let others = 0
      answer.codes.forEach(c => { if (getters.codeIdToCat[c] === cat) others += 1 })

      // The code was removed and was the only remaining of its category
      if (!others && by < 0) commit('modifyCodeCatCountBy', { cat, by: by })

      // The code was added and is the first of its category
      if (others === 1 && by > 0) commit('modifyCodeCatCountBy', { cat, by: by })
    },

    setAnswerMarking ({ commit, state, getters, dispatch }, { answerID, marking }) {
      let answer = getters.answerByID(answerID)
      commit('setAnswerMarking', { answer, marking })
      commit('addToUnsaved', { answer })
    },

    setAnswerSentiment ({ commit, state, getters, dispatch }, { answerID, sentiment }) {
      let answer = getters.answerByID(answerID)
      commit('setAnswerSentiment', { answer, sentiment })
      commit('addToUnsaved', { answer })
    },

    setAnswerChanged ({ commit, state, getters, dispatch }, { answerID, changed }) {
      let answer = getters.answerByID(answerID)
      commit('setAnswerChanged', { answer, changed })
      commit('addToUnsaved', { answer })
    },

    setAnswerReviewed ({ commit, state, getters, dispatch }, { answerID, reviewed }) {
      let answer = getters.answerByID(answerID)
      commit('setAnswerReviewed', { answer, reviewed })
      commit('addToUnsaved', { answer })
    },

    saveAnswers ({ commit, state, getters, dispatch }) {
      let currentlySaving = state.unsavedAnswers.slice(0)
      commit('clearUnsaved')
      let updateData = []
      currentlySaving.forEach(v => {
        updateData.push({
          id: v.id,
          codes: v.codes,
          sentiment: v.sentiment,
          marking: v.marking,
          reviewed: v.reviewed,
          changed: v.changed,
          sentiment_changed: v.sentiment_changed,
          idx_sorted: v.idx_sorted
        })
        // If there are grouped answers, update them as well
        if ('identical_ids' in v) {
          v.identical_ids.forEach(identicalID => updateData.push({
            id: identicalID,
            codes: v.codes,
            sentiment: v.sentiment,
            marking: v.marking,
            reviewed: v.reviewed,
            changed: v.changed,
            sentiment_changed: v.sentiment_changed,
            idx_sorted: v.idx_sorted
          }))
        }
      })
      let call = api.patch('/api/questions/' + state.question.id + '/answers', updateData).then(response => {
        if (response.status !== 200) {
          currentlySaving.forEach(answer => commit('addToUnsaved', { answer }))
          commit('savingAnswerError', (response && response.status))
        } else commit('clearSavingAnswersError')
      }).catch(err => {
        currentlySaving.forEach(answer => commit('addToUnsaved', { answer }))
        commit('savingAnswerError', (err.response && err.response.status))
        this._vm.$maybeRaiseAPIPromiseErr(err)
      })
      return call
    },

    setPredictions ({ commit, state, getters, dispatch }, { predictions, currentAnswerID, modelCertaintyThresh, allowCurrentAnswerOverwrite }) {
      console.log('Setting predictions')
      modelCertaintyThresh /= 100
      let MIN_SORT_OFFSET = 4
      // the sorted idx of the currently focused answer plus padding
      let minSortIdx = currentAnswerID < 0 ? 0 : (getters.answerByID(currentAnswerID).idx_sorted + MIN_SORT_OFFSET)

      // First resort the "reviewed" answers, so they are displayed first
      let resortReviewed = state.answers.filter(a => a.idx_sorted >= minSortIdx && a.reviewed)

      let resortReviewedSorted = resortReviewed.sort((a1, a2) => a1.idx_sorted - a2.idx_sorted)
      resortReviewedSorted.forEach((answer, answerIdx) => {
        commit('setAnswerIdxSorted', { answer, idxSorted: minSortIdx + answerIdx })
        commit('addToUnsaved', { answer })
      })

      let predsSortValues = []

      let predAnswersValid = []
      // create array for all predictions which will be sorted
      predictions.answers.forEach(resAns => {
        if (resAns.id in state.groupedAnswerIDs) return
        let currAns
        try {
          currAns = getters.answerByID(resAns.id)
        } catch (err) {
          this._vm.$onError(err)
          return
        }
        if (currAns.idx_sorted >= minSortIdx) {
          resAns.idxInSortArr = predsSortValues.length
          if (currAns.reviewed) predsSortValues.push(-1000)
          else predsSortValues.push(resAns.sortval)
        } else {
          // We need to reset the idxInSortArr, if this has been previously set
          resAns.idxInSortArr = undefined
        }
        predAnswersValid.push(resAns)
      })

      // do argsort on the index array
      let predsSortValuesArgsort = predsSortValues
        .map((val, idx) => [val, idx])
        .sort(([val1], [val2]) => val1 - val2)

      // console.log(predsSortValuesArgsort)

      // Switch key and values, i.e. index of prediction which should be sorted -> relative sort value
      let predsSortIndex = Array(predsSortValuesArgsort.length)
      predsSortValuesArgsort.forEach(([, val], idx) => { predsSortIndex[val] = idx })

      // console.log(predsSortIndex)

      let nPredicted = 0
      let codesToRemove = new Set()
      minSortIdx += resortReviewed.length

      predictions.model.score_per_code.forEach(c => { if (c.score < MIN_PREDICTION_ACCURACY) codesToRemove.add(c.id) })
      predAnswersValid.forEach(resAns => {
        // Don't set prediction for the grouped IDs
        if (resAns.id in state.groupedAnswerIDs) return
        let answer = getters.answerByID(resAns.id)
        // Update answer if it hasn't been reviewed yet and is not currently focused
        if (!answer.reviewed && (allowCurrentAnswerOverwrite || answer.id !== currentAnswerID)) {
          // Track if the answer has been changed and needs to be saved
          let changed = false
          // Remove codes with too low accuracy or that don't exist anymore
          let codes = _.filter(resAns.codes, (c, cidx) => !codesToRemove.has(c) && (c in getters.codeIdToIdx) && resAns.probas[cidx] > modelCertaintyThresh)
          // Compare to current codes, only update if not equal
          if (answer.codes.length !== codes.length || !answer.codes.every((v, i) => v === codes[i])) {
            // Check that all the predicted codes still exist
            commit('setAnswerCodes', { answer, codes })
            changed = true
          }
          // Update the sorted idx if applicable
          if (resAns.idxInSortArr !== undefined) {
            commit('setAnswerIdxSorted', { answer, idxSorted: minSortIdx + predsSortIndex[resAns.idxInSortArr] })
            changed = true
          }
          if (changed) commit('addToUnsaved', { answer })
          nPredicted += 1
        }
      })

      commit('setPredictedMeta', {
        modelMeta: predictions.model,
        trainingCompletedSVM: predictions.training_completed_svm,
        trainingCompletedBERT: predictions.training_completed_bert,
        nTrainingsSVM: predictions.ntrainings_svm,
        nTrainingsBERT: predictions.ntrainings_bert,
        nPredicted
      })

      commit('setTrainingRequestedTime', null)

      dispatch('countCodes')
    },

    /** =========== CODE Actions =========== **/
    modifyCode: ({ commit, state, getters, dispatch }, { codeID, newAttributes }) => {
      // If the id was modified, we need to that that for all answers
      if ('id' in newAttributes) {
        let newCode = newAttributes.id
        state.answers.forEach(answer => {
          let codeInAnswerIdx = answer.codes.indexOf(codeID)
          if (codeInAnswerIdx !== -1) {
            commit('replaceCodeInAnswer', { codeIdx: codeInAnswerIdx, answer, newCode })
            commit('addToUnsaved', { answer })
          }
        })
      }

      commit('modifyCode', { code: getters.codeByID(codeID), newAttributes })
    },
    deleteCode: ({ commit, state, getters, dispatch }, { codeID }) => {
      // delete the code from all the answers
      state.answers.forEach((a, ansIdx) => {
        let codeInAnswerIdx = a.codes.indexOf(codeID)
        if (codeInAnswerIdx !== -1) {
          commit('removeCodeFromAnswer', { codeIdx: codeInAnswerIdx, answer: a })
          commit('addToUnsaved', { answer: a })
        }
      })

      // delete the code from the code book (by codeIdx)
      let codeIdx = getters.codeIdToIdx[codeID]
      commit('deleteCode', { codeIdx })
    },
    saveCodes ({ commit, dispatch, state }) {
      return api.patch('/api/questions/' + state.question.id, { codebook: state.codes }).then(response => {
        if (response.status !== 200) {
          setTimeout(() => dispatch('saveCodes'), 5000) // Retry in 5s
          commit('savingCodesError', (response && response.status))
        } else commit('clearSavingCodesError')
      }).catch(err => {
        setTimeout(() => dispatch('saveCodes'), 5000) // Retry in 5s
        commit('savingCodesError', (err.response && err.response.status))
        this._vm.$maybeRaiseAPIPromiseErr(err)
      })
    },

    mergeCodes: ({ commit, state, getters, dispatch }, { parentID, childIDs }) => {
      // First update all answers to only have the id of the new code
      state.answers.forEach(answer => {
        let newParentSet = answer.codes.indexOf(parentID) !== -1
        childIDs.forEach(child => {
          let childIdx = answer.codes.indexOf(child)
          if (childIdx === -1) return
          else if (!newParentSet) {
            commit('replaceCodeInAnswer', { answer, codeIdx: childIdx, newCode: parentID })
            newParentSet = true
          } else commit('removeCodeFromAnswer', { answer, codeIdx: childIdx })
          commit('addToUnsaved', { answer })
        })
      })

      // Now remove the merged codes
      childIDs.forEach(child => { commit('deleteCode', { codeIdx: getters.codeIdToIdx[child] }) })
    },

    /** =========== STATISTICS actions =========== **/
    countCodes: ({ commit, state, getters, dispatch }) => {
      // code and category counts
      let counts = {}
      let catCounts = {}
      _.each(state.codes, code => {
        if (!(code.category in catCounts)) catCounts[code.category] = 0
        counts[code.id] = 0
      })

      let nchanged = 0
      let nreviewed = 0
      let nreviewedUnique = 0
      let nnocodes = 0
      let nnocodesUnique = 0

      state.answers.forEach(a => {
        let _catCounts = {}
        let _ansWeight = _getAnsWeight(a)

        nchanged += Number(a.changed) * _ansWeight
        nreviewed += Number(a.reviewed) * _ansWeight
        nreviewedUnique += Number(a.reviewed)
        nnocodes += Number(!a.codes.length) * _ansWeight
        nnocodesUnique += Number(!a.codes.length)

        getters.codeCats.forEach(cat => { _catCounts[cat] = false })
        a.codes.forEach(c => {
          // Do some housekeeping (delete not existing codes from answers)
          if (!(c in getters.codeIdToCat) || !(c in counts)) {
            commit('removeCodeFromAnswer', { answer: a, codeIdx: a.codes.indexOf(c) })
            commit('addToUnsaved', { answer: a })
          } else {
            counts[c] += _ansWeight
            _catCounts[getters.codeIdToCat[c]] = true
          }
        })
        _.forEach(_catCounts, (hasCode, cat) => { catCounts[cat] += hasCode * _ansWeight })
      })

      commit('setCodeCounts', { counts, catCounts })
      commit('setStats', { nreviewed, nreviewedUnique, nchanged, nnocodes, nnocodesUnique })
    },

    /** =========== STATISTICS actions =========== **/
    mutateDialogOpen: ({ commit }, val) => {
      if (val) commit('dialogOpened')
      else commit('dialogClosed')
    }
  }
}
