<template>
  <div id="list-autocoder" @keydown.esc.stop tabindex="0">
    <v-stepper v-model="step" class="elevation-0" style="border-radius: 0">
      <v-toolbar dark color="primary" tile>
        <v-btn icon dark @click.native="$emit('close', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>{{ $t('title') }}</v-toolbar-title>
        <v-stepper-step style="margin-left: 100px" :complete="step > 1" :step="1">{{ $t('intro.step') }}</v-stepper-step>
        <v-divider />
        <v-stepper-step :complete="step > 2" :step="2">{{ $t('autocoder.step') }}</v-stepper-step>
        <v-divider />
        <v-stepper-step :step="3" style="margin-right: 250px">{{ $t('completed.step') }}</v-stepper-step>
      </v-toolbar>

      <v-stepper-items theme="light">

        <!-- ===== QUESTION TYPE SELECTION ===== -->
        <v-stepper-content :step="1" :dark="false">
          <div class="intro-badge">
            <v-hover close-delay="0">
              <div :style="{ background: $color.soft.green }"
                   :class="{ [`elevation-${hover ? 5 : 2}`]: true }"
                   @click="step2"
                   slot-scope="{ hover }">
                <v-icon size="160"
                        :style="{ color: `${(hover ? $color.strong.green : $color.medium.green)}!important` }">mdi-gesture-tap</v-icon>
                <div class="badge-text">
                  <div class="display-1" :style="{ color: $color.strong.green }">{{ $t('intro.hero') }}</div>
                  <p class="title grey--text" style="text-transform: uppercase;">{{ $t('intro.subtitle') }}</p>
                </div>
                <v-icon size="100"
                        color="grey"
                        style="margin-top: 30px"
                        :style="{ color: `${(hover ? $color.strong.green : $color.medium.green)}!important` }">
                  mdi-chevron-right
                </v-icon>
              </div>
            </v-hover>
          </div>
        </v-stepper-content>

        <v-stepper-content :step="2">

          <loading v-if="step===2"
                   :is-loading="loading"
                   :dont-animate-entry="initial"
                   :title="$t('processing')">

            <div v-if="failed">
              <alert type="error">{{ $t('autocoder.failed') }}</alert>
              <v-btn color="accent" @click="autocodeList">{{ $t('actions.retry') }}</v-btn>
            </div>
            <div v-else-if="result.codes.length === 0">
              <alert type="warning">{{ $t('autocoder.no_codes') }}</alert>
            </div>
            <div style="display: flex;" v-else-if="!initial">
              <div style="flex: 0 0 300px; margin-right: 25px">
                <div class="settings elevation-1">
                  <div class="grey--text" style="margin-bottom: 10px">
                    {{ $t('autocoder.settings.min_cnt') }}
                    <helptip position="bottom" x-offset="75px">
                      <span v-html="$t('autocoder.settings.min_cnt_helptip')" />
                    </helptip>
                  </div>
                  <v-slider v-model="fixed.settings_min_cnt"
                            thumb-label="always"
                            @change="settings.min_cnt=fixed.settings_min_cnt"
                            thumb-size="20"
                            hide-details
                            :min="LIMITS.MIN_CNT[0]"
                            :max="LIMITS.MIN_CNT[1]" />

                  <div class="grey--text" style="margin-bottom: 10px">
                    {{ $t('autocoder.settings.similarity') }}
                    <helptip position="bottom" x-offset="75px">
                      <span v-html="$t('autocoder.settings.similarity_helptip')" />
                    </helptip>
                  </div>
                  <v-slider v-model="fixed.settings_similarity"
                            thumb-size="20"
                            hide-details
                            @change="settings.similarity=fixed.settings_similarity*0.01"
                            :min="LIMITS.SIMILARITY[0]"
                            :max="LIMITS.SIMILARITY[1]"
                            thumb-label="always" />

                  <div class="grey--text" style="margin-top: 8px">
                    {{ $t('autocoder.settings.other') }}
                    <helptip position="bottom" x-offset="150px" :width="650">
                      <span v-html="$t('autocoder.settings.other_helptip')" />
                    </helptip>
                  </div>
                  <v-radio-group v-model="settings.other" hide-details>
                    <v-radio v-for="option in ['none', 'unassigned', 'rare']"
                             :key="option"
                             :label="$t(`autocoder.settings.other_options.${option}`)"
                             :value="option" />
                  </v-radio-group>
                  <v-checkbox v-if="question.inherits_from"
                              v-model="settings.keepOld"
                              :label="$t('autocoder.settings.keep_old')"
                              hide-details
                              dense style="margin-top: 10px" />
                  <v-checkbox class="new-checkbox"
                              v-if="question.inherits_from"
                              v-model="settings.newCodes"
                              hide-details
                              dense>
                    <div slot="label">
                      <span v-html="$t('autocoder.settings.new_codes.label', {
                        newCodeName: `<span class='new-label'>${$t('autocoder.settings.new_codes.name')}</span>`
                      })" />
                      <helptip position="bottom" x-offset="150px" :width="650">
                        <span v-html="$t('autocoder.settings.new_codes.helptip', { inheritedQuestionName: question.inherits_from_name})" />
                      </helptip>
                    </div>
                  </v-checkbox>

                </div>
                <div class="stats grey--text">
                  <table>
                    <tr>
                      <td>{{ $t('autocoder.stats.n_tokens') }}</td>
                      <td><code>{{ result.meta.n_tokens }}</code></td>
                    </tr>
                    <tr>
                      <td>{{ $t('autocoder.stats.n_tokens_unique') }}</td>
                      <td><code>{{ result.meta.n_tokens_unique }}</code></td>
                    </tr>
                    <tr>
                      <td>{{ $t('autocoder.stats.ncodes') }}</td>
                      <td><code>{{ nCodes }}</code></td>
                    </tr>
                  </table>
                </div>
              </div>

              <div style="flex: 1 0 400px; display: flex">

                <v-tabs class="result-tabs" v-model="resultTab" grow ref="resultTabs">
                  <v-tab>{{ $t('autocoder.codelist.title') }}</v-tab>
                  <v-tab>{{ $t('autocoder.freqgraph.title') }}</v-tab>

                  <v-tab-item>
                    <div class="resulting-codebook" :style="{ 'max-height': `${resultsMaxHeight}px` }">
                      <alert type="warning" v-if="maxCodesReached">
                        <span v-html="$t('autocoder.codelist.warnings.codes_limit', { maxCodes: MAX_CODES_PER_SURVEY })" />
                      </alert>
                      <v-data-table :headers="headers"
                                    :items="resultingCodebook"
                                    :items-per-page="1000"
                                    hide-default-footer>
                        <template slot="item" slot-scope="{ item }">
                          <tr :class="{ 'row-rare': item.isRare, 'row-new': item.category === '___NEW___' }">
                            <td class="font-weight-medium">{{ item.label }}</td>
                            <td class="text-xs-right">{{ item.cnt }}</td>
                            <td class="text-xs-right">{{ item.nchildren }}</td>
                            <td>
                              <v-chip v-for="c in item.children.slice(0, 10)" :key="c.label">{{ truncate(c.label) }} ({{ c.cnt }})</v-chip>
                              <span v-if="item.nchildren > 10" class="more-children">
                                {{ $t('autocoder.codelist.dotdot_and') }}
                                <helptip
                                  :width="600"
                                  position="top"
                                  :anchor-text="`${item.nchildren - 10} ${$t('autocoder.codelist.more')}`">
                                  <div>
                                    {{ $_.map(item.children.slice(10), c => `${c.label} (${c.cnt})`).join(', ') }}
                                  </div>
                                </helptip>
                              </span>
                            </td>
                          </tr>
                        </template>
                      </v-data-table>
                    </div>
                  </v-tab-item>
                  <v-tab-item>
                    <div :style="{ 'max-height': `${resultsMaxHeight}px` }" style="overflow-y: auto; flex: 1">
                      <div :style="{ height: Math.max(600, 15 * resultingCodebook.length) + 'px' }">
                        <chart-bar-horizontal :width="100"
                                              @contextmenu.native.prevent
                                              :height="100"
                                              :chart-data="{ datasets: codeCountDs, labels: $_.map(resultingCodebook, 'label') }"
                                              :percentage="result.meta.nanswers"
                                              style="width: 100%; height: 100%;"/>
                      </div>
                    </div>
                  </v-tab-item>
                </v-tabs>
              </div>
            </div>
            <alert type="warning" v-if="!failed && codes.length > 0" style="margin: 2px 0;">
              {{ $t('autocoder.codelist.warnings.save_overwrite') }}
            </alert>
          </loading>

        </v-stepper-content>
        <v-stepper-content :step="3">

          <div class="completed">
            <alert type="success">{{ $t('completed.title') }}</alert>

            <div class="headline next-steps">{{ $t('completed.next_steps') }}</div>
            <v-timeline>
              <v-timeline-item :color="$color.medium.red" fab>
                <span slot="opposite" class="title font-weight-bold grey--text">1</span>
                <v-card class="elevation-2">
                  <v-card-text>
                    <div class="title" v-html="$t('completed.step_refine.title')" />
                    <span v-html="$t('completed.step_refine.description')" />
                  </v-card-text>
                </v-card>
              </v-timeline-item>

              <v-timeline-item :color="$color.medium.green" fab>
                <span slot="opposite" class="title font-weight-bold grey--text">2</span>
                <v-card class="elevation-2">
                  <v-card-text>
                    <div class="title" v-html="$t('completed.step_review.title')" />
                    <span v-html="$t('completed.step_review.description')" />
                  </v-card-text>
                </v-card>
              </v-timeline-item>

              <v-timeline-item :color="$color.medium.purple" fab>
                <span slot="opposite" class="title font-weight-bold grey--text">3</span>
                <v-card class="elevation-2">
                  <v-card-text>
                    <div class="title" v-html="$t('completed.step_done.title')" />
                    <span v-html="$t('completed.step_done.description')" />
                  </v-card-text>
                </v-card>
              </v-timeline-item>
            </v-timeline>
          </div>
        </v-stepper-content>

      </v-stepper-items>

      <div style="position: fixed; bottom: 8px; left: 16px">
        <v-btn color="primary" @click="step2" v-if="step == 1">
          {{ $t('next') }}
        </v-btn>
        <v-btn color="primary" :disabled="failed || loading || !result.codes.length" @click="saveResults" v-if="step == 2">
          {{ $t('save.title') }}
        </v-btn>

        <v-btn outlined color="primary" @click="$emit('close', false)">
          {{ (step &lt; 3 ? $t('cancel' ) : $t('close' )) }}
        </v-btn>
      </div>

    </v-stepper>
  </div>
</template>

<script>
import Vuex from 'vuex'
import ChartBarHorizontal from '@/components/ChartBarHorizontal.js'
import JamesMixin from '@/mixins/james'
import ApiTaskMixin from '@/mixins/apitask'

import { MAX_CODES_PER_SURVEY } from '@/settings/coding.js'

const INITIAL_CODES_GOAL = 20
const SIMILARITY_INITIAL = 0.75
const TOKEN_MAXLEN = 40

export default {
  codit: true,
  name: 'ListAutocoder',
  components: {
    'chart-bar-horizontal': ChartBarHorizontal
  },
  mixins: [JamesMixin, ApiTaskMixin],
  data () {
    return {
      step: 1,
      questionType: null,
      // result: require('@/semiopen_spoon.json'),
      // result: require('@/semiopen_lamudi.json'),
      result: { codes: [] },

      LIMITS: {
        MIN_CNT: [2, 1000],
        SIMILARITY: [65, 100]
      },

      settings: {
        min_cnt: 4,
        similarity: SIMILARITY_INITIAL,
        other: 'unassigned',
        keepOld: true,
        newCodes: true
      },

      resultsMaxHeight: null,
      resultTab: 0,
      loading: true,
      failed: false,
      initial: true,
      completed: true,
      maxCodesReached: false,

      headers: [
        { text: this.$t('autocoder.table.code_name'), value: 'label', width: 150 },
        { text: this.$t('autocoder.table.count'), value: 'cnt', align: 'right', width: 100 },
        { text: this.$t('autocoder.table.number_unique_tokens'), value: 'nchildren', align: 'right', width: 100 },
        { text: this.$t('autocoder.table.unique_tokens'), value: 'children', sortable: false }
      ]
    }
  },

  computed: {
    codeCountDs () {
      // create datasets for plotting code counts
      return [{
        label: 'CODES',
        data: _.map(this.resultingCodebook, 'cnt'),
        backgroundColor: this.$color.getSoft(0),
        hoverBackgroundColor: this.$color.getStrong(0)
      }]
    },

    alreadyHasOtherCode () {
      return this.question.inherits_from && !!_.find(this.result.codes, c => c.id === 999 && c.category !== '___NEW___')
    },

    resultingCodebook () {
      let cb = []
      const makeOtherCode = this.settings.other !== 'none' && !this.alreadyHasOtherCode
      let rares = {
        id: 0,
        label: `\uFEFF${this.$t('autocoder.code_rare')}`,
        cnt: 0,
        nchildren: 0,
        isRare: true,
        children: [],
        codeIdsContained: []
      }
      let maxCodesReached = false
      this.result.codes.forEach((c, idx) => {
        // Always keep the inherited other code
        let isInheritedOther = this.question.inherits_from && c.category !== '___NEW___' && c.id === 999

        // If inherited and we keep all codes
        let keepCauseInherited = this.question.inherits_from && c.category !== '___NEW___' && this.settings.keepOld

        // If the code occurs often enough or is kept because of inheritance
        let enoughOrInherited = c.cnt >= this.settings.min_cnt || keepCauseInherited

        // New codes are allowed or the code is not new
        let allowNewOrNotNew = this.settings.newCodes || c.category !== '___NEW___'

        if (isInheritedOther || (!maxCodesReached && enoughOrInherited && allowNewOrNotNew)) {
          cb.push({...c})
          maxCodesReached = (cb.length + makeOtherCode) === MAX_CODES_PER_SURVEY
        } else {
          rares.children.push(...c.children)
          rares.cnt += c.cnt
          rares.nchildren += c.nchildren
          rares.codeIdsContained.push(c.id)
        }
      })

      this.maxCodesReached = maxCodesReached // eslint-disable-line vue/no-side-effects-in-computed-properties
      cb.push(rares)

      return cb
    },

    nCodes () {
      return (this.resultingCodebook.length + (this.settings.other !== 'none'))
    },

    MAX_CODES_PER_SURVEY: {
      cache: false,
      get: () => MAX_CODES_PER_SURVEY
    },

    ...Vuex.mapState({
      user: state => state.user,
      question: state => state.coding.question,
      codes: state => state.coding.codes,
      answers: state => state.coding.answers
    })
  },

  watch: {
    'settings.similarity' () { setTimeout(this.autocodeList, 10) }
  },

  created () {
    // Set static variables, that are *not* reactive, improves performance as not entire component
    // is re-evaluated when values change
    this.fixed = {}
  },

  mounted () {
    this.resultsMaxHeight = Math.max(window.innerHeight - 270, 150)
  },

  methods: {
    step2 () {
      this.step = 2
      this.autocodeList()
    },

    truncate: s => (s.length > TOKEN_MAXLEN ? `${s.slice(0, TOKEN_MAXLEN)} [...]` : s),

    autocodeList () {
      this.loading = true
      this.failed = false
      api.get(`/api/questions/${this.question.id}/autocode-list?async&similarity=${this.settings.similarity}`).then((task) => {
        this.getApiTaskStatus(task.headers['task-id']).then(({ result }) => {
          if (!('codes' in result)) throw Error('Invalid return data')
          this.$set(this, 'result', result)

          if (this.initial) {
            this.determineInitialSettings()
            this.initial = false
          }

          this.loading = false
        }).catch(err => {
          this.failed = true
          this.loading = false
          this.$maybeRaiseAPIPromiseErr(err)
        })
      }).catch(err => {
        this.failed = true
        this.loading = false
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },

    determineInitialSettings () {
      // Set the min group size to a value, such that we get close to the INITIAL_CODES_GOAL number of codes
      // Assumes the results are already sorted by number of codes
      let lastCodeToDisplay = this.result.codes[INITIAL_CODES_GOAL]
      this.settings.min_cnt = Math.max(2, (lastCodeToDisplay !== undefined ? lastCodeToDisplay.cnt - 1 : 1))
      this.fixed.settings_min_cnt = this.settings.min_cnt
      this.fixed.settings_similarity = SIMILARITY_INITIAL * 100

      // Set the maximum of min count to the maximum count in the resulting codes list
      this.LIMITS.MIN_CNT.splice(1, 1, (this.result.codes.length ? _.maxBy(this.result.codes, 'cnt').cnt : 2))
    },

    saveResults () {
      this.step = 3
      setTimeout(() => {
        // Create the final codebook, which has been precomputed already
        // Skip the "rare terms" code, change the category name for new codes
        let codebook = this.resultingCodebook.slice(0, -1).map(({ id, label, category }) =>
          ({ id, label, category: (category === '___NEW___' ? 'NEW' : category) })
        )

        if (this.settings.other !== 'none' && !this.alreadyHasOtherCode) {
          codebook.push({
            id: 999,
            label: this.$t('autocoder.code_other'),
            category: this.$t('autocoder.code_other')
          })
        }

        // Get the IDs of the cdes grouped into the rare codes
        let rareTermsIDs = new Set(this.resultingCodebook.slice(-1)[0].codeIdsContained)

        // Build up code id to index array, needed for getting idx_sorted of answers
        let codeID2Index = {}
        codebook.forEach((c, idx) => { codeID2Index[c.id] = idx })

        this.result.answers.forEach((a, idx) => {
          let acodes = a.codes

          // Remove codes that have been put into rare terms
          a.codes = _.filter(a.codes, c => c in codeID2Index)
          // Rare mode: check if any of the original codes were in the "rare" category
          if (this.settings.other === 'rare' && acodes.filter(c => rareTermsIDs.has(c)).length) a.codes.push(999)
          // Unassigned mode: If the answer has no code, add the other code
          else if (this.settings.other === 'unassigned' && !a.codes.length) a.codes.push(999)
          // Sort the answers by the first code that they have
          a.idx_sorted = (a.codes.length > 0 ? codeID2Index[a.codes[0]] : 999)
          // Set all answers to reviewed, if they have a code
          a.reviewed = !(a.codes.length === 1 && a.codes[0] === 999)
        })

        let cbl = { min_cnt: this.settings.min_cnt, similarity: this.settings.similarity }
        this.$store.dispatch('saveQuestionModelProps', { codebook_generator_list: cbl }).then(() => {
          this.$store.commit('setCodes', codebook)
          this.$store.dispatch('setAnswersCodesSortedIdxReviewed', this.result.answers)
          this.jamesSay('autocoder.generated', 'info', true)
        }).catch(err => this.$maybeRaiseAPIPromiseErr(err))
      }, 500)
    }
  }
}

</script>

<style lang=scss>

@import '~css/coding-assistant';

#list-autocoder {
  .result-tabs {
    width: 100%;
  }

  .settings {
    flex: 1;
    font-size: 14px;
    border-radius: 4px;
    padding: 15px 12px 10px;
    background: $col-highlight-5;
    margin-bottom: 20px;
    .v-slider {
      margin-top: 7px;
    }
    .v-label {
      font-size: 12px;
    }
    .v-input--radio-group {
      margin-top: 2px;
    }
    .v-radio {
      margin-bottom: 0;
    }

    .v-input--checkbox {
      margin-top: 0;
    }

    .new-checkbox {
      .new-label {
        background: $col-medium-green;
        padding: 3px 4px;
        border-radius: 2px;
      }
    }
  }

  .stats {
    font-size: 14px;
    border-radius: 4px;
    background: #EEE;
    padding: 5px 12px 5px;
    margin-bottom: 0px;
    table {
      line-height: 1.5em;
      width: 100%;
      tr {
        height: 2em;
      }
    }
  }

  .resulting-codebook {
    overflow-y: auto;

    td {
      height: 40px;
    }

    .row-new {
      background: $col-soft-green;
    }

    .row-rare {
      background: $col-soft-red;
    }

    .more-children {
      display: inline-block;
      margin: 3px 0;

      .helptip-content > div {
        max-height: 250px;
        overflow-y: scroll;
      }
    }

    .v-chip { margin: 2px 4px }
  }
}

</style>

<i18n src='@/i18n/components/ListAutocoder.json'></i18n>
